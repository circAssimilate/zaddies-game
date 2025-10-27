/**
 * startGame Cloud Function
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Starts a poker game at a table (host only, requires ≥2 players)
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import type { StartGameRequest, StartGameResponse } from './types';
import type { TableDocument } from './schemas';
import { initializeHand } from '../../poker/handInitializer';
import { createPlayerHandDocument } from './schemas';

/**
 * Start Game Function
 * @param data - StartGameRequest
 * @param context - Call context with auth
 * @returns StartGameResponse
 */
export async function startGame(
  data: StartGameRequest,
  context: { auth?: { uid: string } }
): Promise<StartGameResponse> {
  // Validate authentication
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to start a game');
  }

  const userId = context.auth.uid;
  const { tableId } = data;

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

      // Validate host permission
      if (table.hostId !== userId) {
        throw new HttpsError('permission-denied', 'Only the host can start the game');
      }

      // Validate table status
      if (table.status === 'playing') {
        throw new HttpsError('failed-precondition', 'Game is already in progress');
      }

      if (table.status === 'ended') {
        throw new HttpsError('failed-precondition', 'Table has ended');
      }

      // Validate minimum players
      if (table.players.length < 2) {
        throw new HttpsError(
          'failed-precondition',
          'At least 2 players are required to start a game'
        );
      }

      // Initialize first hand
      const handNumber = 1;
      const { hand, playerHands, updatedPlayers } = initializeHand(
        table.players,
        table.settings,
        handNumber,
        null // No previous dealer position for first hand
      );

      // Update table with hand and player states
      transaction.update(tableRef, {
        status: 'playing',
        hand,
        players: updatedPlayers,
      });

      // Store player hole cards in secure subcollection
      for (const [playerId, holeCards] of playerHands) {
        const playerHandDoc = createPlayerHandDocument(playerId, holeCards, handNumber);
        const playerHandRef = tableRef
          .collection('hands')
          .doc(String(handNumber))
          .collection('playerHands')
          .doc(playerId);

        transaction.set(playerHandRef, playerHandDoc);
      }

      return {
        success: true,
        handNumber,
        message: 'Game started successfully',
      };
    });

    return result;
  } catch (error) {
    // Handle specific errors
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Error starting game:', error);
    throw new HttpsError('internal', 'Failed to start game');
  }
}
