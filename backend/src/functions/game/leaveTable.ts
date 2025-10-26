/**
 * leaveTable Cloud Function
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Allows players to leave tables and automatically cash out chips
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { LeaveTableRequest, LeaveTableResponse } from './types';
import type { TableDocument } from './schemas';
import { createLedgerEntry } from './schemas';

/**
 * Leave Table Function
 * @param data - LeaveTableRequest
 * @param context - Call context with auth
 * @returns LeaveTableResponse
 */
export async function leaveTable(
  data: LeaveTableRequest,
  context: { auth?: { uid: string } },
): Promise<LeaveTableResponse> {
  // Validate authentication
  if (!context.auth) {
    throw new HttpsError(
      'unauthenticated',
      'User must be authenticated to leave a table',
    );
  }

  const userId = context.auth.uid;
  const { tableId } = data;
  const db = getFirestore();

  try {
    // Validate table ID format
    if (!/^\d{4}$/.test(tableId)) {
      throw new HttpsError(
        'invalid-argument',
        'Table code must be a 4-digit number',
      );
    }

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async (transaction) => {
      // Get table document
      const tableRef = db.collection('tables').doc(tableId);
      const tableDoc = await transaction.get(tableRef);

      if (!tableDoc.exists) {
        throw new HttpsError('not-found', 'Table not found');
      }

      const table = tableDoc.data() as TableDocument;

      // Find player in table
      const playerIndex = table.players.findIndex((p) => p.id === userId);

      if (playerIndex === -1) {
        throw new HttpsError(
          'failed-precondition',
          'You are not at this table',
        );
      }

      const player = table.players[playerIndex];
      const chipsToCashOut = player.chips;

      // Remove player from table
      const updatedPlayers = table.players.filter((p) => p.id !== userId);

      // If player is in active hand, fold them
      let updatedHand = table.hand;
      if (table.hand && !player.isFolded) {
        // TODO: Implement auto-fold logic when hand state is implemented
        // For now, just log it
        console.log(`Player ${userId} auto-folded when leaving table ${tableId}`);
      }

      // Handle host transfer if leaving player is host
      let newHostId = table.hostId;
      if (table.hostId === userId && updatedPlayers.length > 0) {
        // Transfer host to next player (longest-seated = first in array)
        newHostId = updatedPlayers[0].id;
        console.log(`Host transferred from ${userId} to ${newHostId}`);
      }

      // Update table
      const tableUpdate: Partial<TableDocument> = {
        players: updatedPlayers,
        hostId: newHostId,
      };

      // If no players left, mark table as ended
      if (updatedPlayers.length === 0) {
        tableUpdate.status = 'ended';
      }

      transaction.update(tableRef, tableUpdate);

      // Get player's current ledger balance
      const ledgerSnapshot = await transaction.get(
        db
          .collection('ledger')
          .doc(userId)
          .collection('transactions')
          .orderBy('timestamp', 'desc')
          .limit(1),
      );

      let currentBalance = 0;
      if (!ledgerSnapshot.empty) {
        const lastTransaction = ledgerSnapshot.docs[0].data();
        currentBalance = lastTransaction.runningBalance || 0;
      }

      // Calculate new balance after cash out
      const newBalance = currentBalance + chipsToCashOut;

      // Create ledger transaction for cash out
      const ledgerEntry = createLedgerEntry(
        userId,
        'cashout',
        chipsToCashOut, // Positive for cash out
        newBalance,
        tableId,
      );

      const ledgerRef = db
        .collection('ledger')
        .doc(userId)
        .collection('transactions')
        .doc(); // Auto-generate ID

      transaction.set(ledgerRef, {
        ...ledgerEntry,
        id: ledgerRef.id,
      });

      // Update player's lastSeen timestamp
      const playerRef = db.collection('players').doc(userId);
      transaction.update(playerRef, {
        lastSeen: Timestamp.now(),
      });

      return { chipsCashedOut: chipsToCashOut, newBalance };
    });

    return {
      success: true,
      chipsCashedOut: result.chipsCashedOut,
      message: `Successfully left table. Cashed out ${result.chipsCashedOut} chips.`,
    };
  } catch (error) {
    // Re-throw HttpsErrors
    if (error instanceof HttpsError) {
      throw error;
    }

    // Generic error
    console.error('Error leaving table:', error);
    throw new HttpsError(
      'internal',
      'Failed to leave table',
    );
  }
}
