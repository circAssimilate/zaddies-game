/**
 * Pot Calculator Module
 * Contract: specs/001-texas-holdem-poker/data-model.md
 *
 * Handles pot and side pot calculations for:
 * - All-in situations
 * - Multiple all-in players at different amounts
 * - Determining eligible players for each pot
 */

import type { PlayerState } from '@shared/types/player';

export interface Pot {
  amount: number;
  eligiblePlayers: string[]; // Player IDs who can win this pot
}

/**
 * Calculate main pot and side pots based on player bets
 *
 * This handles complex all-in scenarios where players have bet different amounts.
 * Creates a main pot and side pots as needed.
 *
 * @param players - All players at table with their current bets
 * @param totalPot - Total pot amount
 * @returns Array of pots (main pot first, then side pots)
 */
export function calculateSidePots(players: PlayerState[], totalPot: number): Pot[] {
  // Get all players who contributed to the pot (not folded or contributed chips)
  const playersWithBets = players
    .filter(p => p.currentBet > 0)
    .sort((a, b) => a.currentBet - b.currentBet);

  // If only one bet level, no side pots needed
  if (playersWithBets.length === 0) {
    return [
      {
        amount: totalPot,
        eligiblePlayers: players.filter(p => !p.isFolded).map(p => p.id),
      },
    ];
  }

  // Check if all non-folded players bet the same amount (no side pots)
  const activePlayers = players.filter(p => !p.isFolded);
  const bets = new Set(activePlayers.map(p => p.currentBet));
  if (bets.size === 1) {
    return [
      {
        amount: totalPot,
        eligiblePlayers: activePlayers.map(p => p.id),
      },
    ];
  }

  // Calculate side pots
  const pots: Pot[] = [];
  let remainingAmount = totalPot;
  let previousBetLevel = 0;

  // Create pots for each bet level
  const betLevels = [...new Set(playersWithBets.map(p => p.currentBet))].sort((a, b) => a - b);

  for (const betLevel of betLevels) {
    // Players who bet at least this amount (and not folded)
    const eligiblePlayers = players.filter(p => !p.isFolded && p.currentBet >= betLevel);

    // Calculate pot amount for this level
    const contributingPlayers = players.filter(p => p.currentBet >= betLevel);
    const potAmount = contributingPlayers.length * (betLevel - previousBetLevel);

    if (potAmount > 0 && eligiblePlayers.length > 0) {
      pots.push({
        amount: potAmount,
        eligiblePlayers: eligiblePlayers.map(p => p.id),
      });
      remainingAmount -= potAmount;
    }

    previousBetLevel = betLevel;
  }

  // Handle any rounding errors or remaining chips
  if (remainingAmount > 0 && pots.length > 0) {
    pots[pots.length - 1].amount += remainingAmount;
  }

  return pots;
}

/**
 * Calculate the maximum amount a player can win from the pot
 *
 * Used for all-in scenarios to determine how much of the pot a player can win.
 *
 * @param player - Player to calculate for
 * @param players - All players at table
 * @param totalPot - Total pot amount
 * @returns Maximum winnable amount
 */
export function calculateMaxWinAmount(
  player: PlayerState,
  players: PlayerState[],
  totalPot: number
): number {
  if (!player.isAllIn) {
    // If not all-in, can win entire pot
    return totalPot;
  }

  // Calculate maximum win based on player's contribution
  const playerContribution = player.currentBet;

  // Count how many players are eligible to contest this pot
  const eligiblePlayers = players.filter(p => !p.isFolded);

  // Player can win at most their contribution * number of eligible players
  const maxWin = playerContribution * eligiblePlayers.length;

  return Math.min(maxWin, totalPot);
}
