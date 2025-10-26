/**
 * endHand Cloud Function (Internal/Scheduled)
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Evaluates showdown and distributes pot when hand reaches showdown phase.
 * This can be triggered by:
 * - Scheduled function checking for hands in showdown phase
 * - Called internally after last betting round completes
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { TableDocument } from './schemas';
import type { Card } from '@shared/types/game';
import { evaluateShowdown } from '../../poker/showdownHandler';

/**
 * End Hand Function - Evaluate showdown and distribute pot
 * @param tableId - Table ID
 * @returns Success status and hand result
 */
export async function endHand(tableId: string): Promise<{
  success: boolean;
  winners: string[];
  payouts: Map<string, number>;
}> {
  if (!tableId) {
    throw new HttpsError('invalid-argument', 'tableId is required');
  }

  const db = getFirestore();

  try {
    // Run transaction to ensure atomic updates
    const result = await db.runTransaction(async transaction => {
      // Get table document
      const tableRef = db.collection('tables').doc(tableId);
      const tableSnap = await transaction.get(tableRef);

      if (!tableSnap.exists) {
        throw new HttpsError('not-found', 'Table does not exist');
      }

      const table = tableSnap.data() as TableDocument;

      // Validate hand in progress
      if (!table.hand) {
        throw new HttpsError('failed-precondition', 'No hand in progress');
      }

      // Validate hand is at showdown
      if (table.hand.phase !== 'showdown') {
        throw new HttpsError('failed-precondition', 'Hand is not at showdown phase');
      }

      // Get player hole cards from secure subcollection
      const playerHoleCards = new Map<string, [Card, Card]>();
      const handNumber = table.hand.handNumber;

      const playerHandsSnapshot = await transaction.get(
        tableRef.collection('hands').doc(String(handNumber)).collection('playerHands')
      );

      for (const doc of playerHandsSnapshot.docs) {
        const data = doc.data();
        playerHoleCards.set(doc.id, data.holeCards as [Card, Card]);
      }

      // Evaluate showdown
      const showdownResult = evaluateShowdown(table.players, table.hand, playerHoleCards);

      // Clear hand state and update player chips
      transaction.update(tableRef, {
        hand: null,
        players: showdownResult.updatedPlayers,
        lastHandResult: {
          handNumber: table.hand.handNumber,
          winners: showdownResult.winners,
          winningHands: Object.fromEntries(showdownResult.winningHands),
          payouts: Object.fromEntries(showdownResult.payouts),
          timestamp: Timestamp.now(),
        },
      });

      return {
        success: true,
        winners: showdownResult.winners,
        payouts: showdownResult.payouts,
      };
    });

    return result;
  } catch (error) {
    // Handle specific errors
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Error ending hand:', error);
    throw new HttpsError('internal', 'Failed to end hand');
  }
}
