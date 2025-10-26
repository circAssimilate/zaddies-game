/**
 * joinTable Cloud Function
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Allows players to join existing tables with 4-digit codes
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import type { JoinTableRequest, JoinTableResponse } from './types';
import type { TableDocument } from './schemas';
import type { PlayerState } from '@shared/types/player';
import { createLedgerEntry, createPlayerDocument } from './schemas';

/**
 * Join Table Function
 * @param data - JoinTableRequest
 * @param context - Call context with auth
 * @returns JoinTableResponse
 */
export async function joinTable(
  data: JoinTableRequest,
  context: { auth?: { uid: string; token?: { email?: string; name?: string } } }
): Promise<JoinTableResponse> {
  // Validate authentication
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to join a table');
  }

  const userId = context.auth.uid;
  const { tableId, buyInAmount } = data;
  const db = getFirestore();

  try {
    // Validate table ID format
    if (!/^\d{4}$/.test(tableId)) {
      throw new HttpsError('invalid-argument', 'Table code must be a 4-digit number');
    }

    // Validate buy-in amount
    if (buyInAmount <= 0) {
      throw new HttpsError('invalid-argument', 'Buy-in amount must be positive');
    }

    // Use transaction to ensure atomicity
    const result = await db.runTransaction(async transaction => {
      // Get table document
      const tableRef = db.collection('tables').doc(tableId);
      const tableDoc = await transaction.get(tableRef);

      if (!tableDoc.exists) {
        throw new HttpsError('not-found', 'Table not found');
      }

      const table = tableDoc.data() as TableDocument;

      // Validate table status
      if (table.status === 'ended') {
        throw new HttpsError('failed-precondition', 'Cannot join a table that has ended');
      }

      // Validate table is not full
      if (table.players.length >= table.settings.maxPlayers) {
        throw new HttpsError('failed-precondition', 'Table is full');
      }

      // Validate player is not already at table
      if (table.players.some(p => p.id === userId)) {
        throw new HttpsError('already-exists', 'You are already at this table');
      }

      // Validate buy-in amount meets minimum
      if (buyInAmount < table.settings.minBuyIn) {
        throw new HttpsError(
          'invalid-argument',
          `Buy-in amount must be at least ${table.settings.minBuyIn}`
        );
      }

      // Validate buy-in amount does not exceed maximum
      if (buyInAmount > table.settings.maxStack) {
        throw new HttpsError(
          'invalid-argument',
          `Buy-in amount cannot exceed ${table.settings.maxStack}`
        );
      }

      // Get player's current ledger balance
      const ledgerSnapshot = await transaction.get(
        db
          .collection('ledger')
          .doc(userId)
          .collection('transactions')
          .orderBy('timestamp', 'desc')
          .limit(1)
      );

      let currentBalance = 0;
      if (!ledgerSnapshot.empty) {
        const lastTransaction = ledgerSnapshot.docs[0].data();
        currentBalance = lastTransaction.runningBalance || 0;
      }

      // Calculate new balance after purchase
      const newBalance = currentBalance - buyInAmount;

      // Validate debt limit
      if (Math.abs(newBalance) > table.settings.maxDebtPerPlayer) {
        throw new HttpsError(
          'permission-denied',
          `This purchase would exceed the maximum debt limit of ${table.settings.maxDebtPerPlayer}`
        );
      }

      // Find first available seat position
      const occupiedPositions = new Set(table.players.map(p => p.position));
      let position = 0;
      for (let i = 0; i < table.settings.maxPlayers; i++) {
        if (!occupiedPositions.has(i)) {
          position = i;
          break;
        }
      }

      // Create player state
      const playerState: PlayerState = {
        id: userId,
        position,
        chips: buyInAmount,
        status: 'sitting',
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        currentBet: 0,
        hasActed: false,
        isFolded: false,
        isAllIn: false,
      };

      // Update table with new player
      transaction.update(tableRef, {
        players: FieldValue.arrayUnion(playerState),
      });

      // Create or update player document
      const playerRef = db.collection('players').doc(userId);
      const playerDoc = await transaction.get(playerRef);

      if (!playerDoc.exists) {
        // Create new player document
        const email = context.auth?.token?.email || `${userId}@unknown`;
        const username = context.auth?.token?.name || `Player ${userId.slice(0, 6)}`;

        const newPlayer = createPlayerDocument(userId, username, email);
        transaction.set(playerRef, newPlayer);
      } else {
        // Update lastSeen timestamp
        transaction.update(playerRef, {
          lastSeen: Timestamp.now(),
        });
      }

      // Create ledger transaction
      const ledgerEntry = createLedgerEntry(
        userId,
        'buy',
        -buyInAmount, // Negative for chip purchase
        newBalance,
        tableId
      );

      const ledgerRef = db.collection('ledger').doc(userId).collection('transactions').doc(); // Auto-generate ID

      transaction.set(ledgerRef, {
        ...ledgerEntry,
        id: ledgerRef.id,
      });

      return { position, newBalance };
    });

    return {
      success: true,
      position: result.position,
      message: 'Successfully joined table',
    };
  } catch (error) {
    // Re-throw HttpsErrors
    if (error instanceof HttpsError) {
      throw error;
    }

    // Generic error
    console.error('Error joining table:', error);
    throw new HttpsError('internal', 'Failed to join table');
  }
}
