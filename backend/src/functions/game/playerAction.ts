/**
 * playerAction Cloud Function
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Execute a player action (fold, call, check, raise, allin)
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { PlayerActionRequest, PlayerActionResponse } from './types';
import type { TableDocument } from './schemas';
import { getNextPlayerPosition } from '../../poker/handInitializer';

/**
 * Player Action Function
 * @param data - PlayerActionRequest
 * @param context - Call context with auth
 * @returns PlayerActionResponse
 */
export async function playerAction(
  data: PlayerActionRequest,
  context: { auth?: { uid: string } }
): Promise<PlayerActionResponse> {
  // Validate authentication
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to perform an action');
  }

  const userId = context.auth.uid;
  const { tableId, action, raiseAmount } = data;

  if (!tableId) {
    throw new HttpsError('invalid-argument', 'tableId is required');
  }

  if (!action) {
    throw new HttpsError('invalid-argument', 'action is required');
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

      // Find current player
      const currentPlayerIndex = table.hand.currentPlayerPosition;
      const currentPlayer = table.players[currentPlayerIndex];

      if (!currentPlayer) {
        throw new HttpsError('internal', 'Current player not found');
      }

      // Validate it's the player's turn
      if (currentPlayer.id !== userId) {
        throw new HttpsError('permission-denied', 'It is not your turn');
      }

      // Process the action
      const { updatedPlayers, updatedHand } = processAction(
        table,
        currentPlayerIndex,
        action,
        raiseAmount
      );

      // Update table
      transaction.update(tableRef, {
        players: updatedPlayers,
        hand: updatedHand,
      });

      return {
        success: true,
        message: `Action ${action} executed successfully`,
      };
    });

    return result;
  } catch (error) {
    // Handle specific errors
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle unexpected errors
    console.error('Error processing player action:', error);
    throw new HttpsError('internal', 'Failed to process player action');
  }
}

/**
 * Process a player action and return updated game state
 *
 * @param table - Current table state
 * @param playerIndex - Index of acting player
 * @param action - Action to perform
 * @param raiseAmount - Raise amount (if action is raise)
 * @returns Updated players and hand state
 */
function processAction(
  table: TableDocument,
  playerIndex: number,
  action: PlayerActionRequest['action'],
  raiseAmount?: number
): {
  updatedPlayers: TableDocument['players'];
  updatedHand: TableDocument['hand'];
} {
  if (!table.hand) {
    throw new HttpsError('failed-precondition', 'No hand in progress');
  }

  const players = [...table.players];
  const hand = { ...table.hand };
  const player = { ...players[playerIndex] };
  const currentBet = hand.bettingRound.currentBet;

  // Validate and process action
  switch (action) {
    case 'fold':
      player.isFolded = true;
      player.status = 'folded';
      player.hasActed = true;
      break;

    case 'check':
      // Can only check if currentBet === player.currentBet
      if (currentBet !== player.currentBet) {
        throw new HttpsError('invalid-argument', 'Cannot check when there is a bet to call');
      }
      player.hasActed = true;
      break;

    case 'call': {
      const callAmount = currentBet - player.currentBet;
      if (callAmount > player.chips) {
        throw new HttpsError('invalid-argument', 'Insufficient chips to call');
      }
      player.chips -= callAmount;
      player.currentBet += callAmount;
      player.hasActed = true;
      hand.pot += callAmount;

      // Check if player is all-in after call
      if (player.chips === 0) {
        player.isAllIn = true;
        player.status = 'allin';
      }
      break;
    }

    case 'raise': {
      if (!raiseAmount) {
        throw new HttpsError('invalid-argument', 'raiseAmount is required for raise action');
      }

      const totalBet = raiseAmount;
      if (totalBet < currentBet + hand.bettingRound.minRaise) {
        throw new HttpsError(
          'invalid-argument',
          `Raise must be at least ${currentBet + hand.bettingRound.minRaise}`
        );
      }

      const raiseChips = totalBet - player.currentBet;
      if (raiseChips > player.chips) {
        throw new HttpsError('invalid-argument', 'Insufficient chips to raise');
      }

      player.chips -= raiseChips;
      player.currentBet = totalBet;
      player.hasActed = true;
      hand.pot += raiseChips;
      hand.bettingRound.currentBet = totalBet;
      hand.bettingRound.minRaise = totalBet - currentBet;

      // Mark all other players as needing to act again
      for (let i = 0; i < players.length; i++) {
        if (i !== playerIndex && !players[i].isFolded && !players[i].isAllIn) {
          players[i].hasActed = false;
        }
      }

      // Check if player is all-in after raise
      if (player.chips === 0) {
        player.isAllIn = true;
        player.status = 'allin';
      }
      break;
    }

    case 'allin': {
      const allInAmount = player.chips;
      player.chips = 0;
      player.currentBet += allInAmount;
      player.isAllIn = true;
      player.status = 'allin';
      player.hasActed = true;
      hand.pot += allInAmount;

      // If all-in amount >= currentBet + minRaise, it's a raise
      if (player.currentBet >= currentBet + hand.bettingRound.minRaise) {
        hand.bettingRound.currentBet = player.currentBet;
        hand.bettingRound.minRaise = player.currentBet - currentBet;

        // Mark all other players as needing to act again
        for (let i = 0; i < players.length; i++) {
          if (i !== playerIndex && !players[i].isFolded && !players[i].isAllIn) {
            players[i].hasActed = false;
          }
        }
      }
      break;
    }

    default:
      throw new HttpsError('invalid-argument', `Invalid action: ${action}`);
  }

  // Update player in array
  players[playerIndex] = player;

  // Record action in history
  hand.actions.push({
    playerId: player.id,
    action,
    amount: player.currentBet,
    timestamp: Timestamp.now(),
  });

  // Update player actions map
  hand.bettingRound.playerActions[player.id] = action;

  // Check if betting round is complete
  const bettingRoundComplete = isBettingRoundComplete(players);

  if (bettingRoundComplete) {
    // TODO: Advance to next phase (flop, turn, river, showdown)
    // For now, just move to next player
    // This will be implemented in T083-T090
    hand.currentPlayerPosition = getNextPlayerPosition(players, playerIndex);
  } else {
    // Move to next active player
    hand.currentPlayerPosition = getNextPlayerPosition(players, playerIndex);

    // Update action deadline
    if (hand.actionDeadline) {
      // Reset timer for next player
      const actionTimer = table.settings.actionTimer;
      hand.actionDeadline = Timestamp.fromMillis(Date.now() + actionTimer * 1000);
    }
  }

  return {
    updatedPlayers: players,
    updatedHand: hand,
  };
}

/**
 * Check if the betting round is complete
 *
 * A betting round is complete when all active players have either:
 * - Folded
 * - Gone all-in
 * - Acted and matched the current bet
 *
 * @param players - Player states
 * @returns True if betting round is complete
 */
function isBettingRoundComplete(players: TableDocument['players']): boolean {
  const activePlayers = players.filter(p => !p.isFolded && !p.isAllIn);

  // If 0 or 1 active players, round is complete
  if (activePlayers.length <= 1) {
    return true;
  }

  // All active players must have acted
  const allActed = activePlayers.every(p => p.hasActed);
  if (!allActed) {
    return false;
  }

  // All active players must have same current bet
  const currentBets = activePlayers.map(p => p.currentBet);
  const allBetsEqual = currentBets.every(bet => bet === currentBets[0]);

  return allBetsEqual;
}
