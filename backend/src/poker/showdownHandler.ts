/**
 * Showdown Handler Module
 * Contract: specs/001-texas-holdem-poker/data-model.md
 *
 * Handles showdown logic including:
 * - Hand evaluation for all active players
 * - Winner determination
 * - Pot distribution (main pot and side pots)
 * - Hand result recording
 */

import type { Card } from '@shared/types/game';
import type { PlayerState } from '@shared/types/player';
import type { HandState } from '../functions/game/schemas';
import { findBestHand } from '@shared/lib/poker/handEvaluator';
import { calculateSidePots } from './potCalculator';

export interface ShowdownResult {
  winners: string[]; // Player IDs of winners
  winningHands: Map<string, { handRank: string; cards: Card[] }>; // Player ID -> best hand
  payouts: Map<string, number>; // Player ID -> chips won
  updatedPlayers: PlayerState[];
}

/**
 * Evaluate hands at showdown and distribute pot(s)
 *
 * @param players - All players at table
 * @param hand - Current hand state
 * @param playerHoleCards - Map of player ID to hole cards
 * @returns Showdown result with winners and payouts
 */
export function evaluateShowdown(
  players: PlayerState[],
  hand: HandState,
  playerHoleCards: Map<string, [Card, Card]>
): ShowdownResult {
  // Get all players who can win (not folded)
  const eligiblePlayers = players.filter(p => !p.isFolded);

  if (eligiblePlayers.length === 0) {
    throw new Error('No eligible players for showdown');
  }

  // If only one player remains, they win by default
  if (eligiblePlayers.length === 1) {
    return awardPotToSingleWinner(players, hand, eligiblePlayers[0].id);
  }

  // Evaluate each player's best hand
  const playerHands = new Map<
    string,
    {
      handRank: string;
      value: number;
      cards: Card[];
    }
  >();

  for (const player of eligiblePlayers) {
    const holeCards = playerHoleCards.get(player.id);
    if (!holeCards) {
      throw new Error(`No hole cards found for player ${player.id}`);
    }

    // Combine hole cards with community cards
    const allCards = [...holeCards, ...hand.communityCards];
    const bestHand = findBestHand(allCards);

    playerHands.set(player.id, bestHand);
  }

  // Calculate side pots if there are all-in players
  const pots = calculateSidePots(players, hand.pot);

  // Distribute pots to winners
  const payouts = new Map<string, number>();
  const allWinners = new Set<string>();

  for (const pot of pots) {
    // Find eligible players for this pot
    const potEligible = eligiblePlayers.filter(p => pot.eligiblePlayers.includes(p.id));

    // Find best hand value among eligible players
    let bestValue = -1;
    for (const player of potEligible) {
      const hand = playerHands.get(player.id);
      if (hand && hand.value > bestValue) {
        bestValue = hand.value;
      }
    }

    // Find all players with best hand (handles ties)
    const potWinners = potEligible.filter(p => {
      const hand = playerHands.get(p.id);
      return hand && hand.value === bestValue;
    });

    // Split pot among winners
    const amountPerWinner = Math.floor(pot.amount / potWinners.length);
    const remainder = pot.amount % potWinners.length;

    for (let i = 0; i < potWinners.length; i++) {
      const winner = potWinners[i];
      const currentPayout = payouts.get(winner.id) || 0;
      // First winner gets remainder for odd chips
      const payout = amountPerWinner + (i === 0 ? remainder : 0);
      payouts.set(winner.id, currentPayout + payout);
      allWinners.add(winner.id);
    }
  }

  // Update player chip stacks
  const updatedPlayers = players.map(player => {
    const payout = payouts.get(player.id) || 0;
    return {
      ...player,
      chips: player.chips + payout,
    };
  });

  // Convert playerHands to simplified format for return
  const winningHands = new Map<string, { handRank: string; cards: Card[] }>();
  for (const [playerId, hand] of playerHands) {
    winningHands.set(playerId, {
      handRank: hand.handRank,
      cards: hand.cards,
    });
  }

  return {
    winners: Array.from(allWinners),
    winningHands,
    payouts,
    updatedPlayers,
  };
}

/**
 * Award entire pot to single winner (all others folded)
 *
 * @param players - All players
 * @param hand - Current hand state
 * @param winnerId - ID of winning player
 * @returns Showdown result
 */
function awardPotToSingleWinner(
  players: PlayerState[],
  hand: HandState,
  winnerId: string
): ShowdownResult {
  const payouts = new Map<string, number>();
  payouts.set(winnerId, hand.pot);

  const updatedPlayers = players.map(player => ({
    ...player,
    chips: player.chips + (player.id === winnerId ? hand.pot : 0),
  }));

  return {
    winners: [winnerId],
    winningHands: new Map(), // No hand evaluation needed
    payouts,
    updatedPlayers,
  };
}
