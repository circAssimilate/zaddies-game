import { SidePot } from '../../types/game';

/**
 * Calculates pots and side pots from player bets
 * @param bets - Map of playerId to bet amount
 * @param allInPlayers - Set of player IDs who are all-in (optional)
 * @returns Array of side pots ordered from main pot to final side pot
 */
export function calculatePots(
  bets: Map<string, number>,
  _allInPlayers: Set<string> = new Set()
): SidePot[] {
  if (bets.size === 0) {
    return [];
  }

  // Filter out players with 0 bets (folded before betting)
  const activeBets = Array.from(bets.entries()).filter(([_, amount]) => amount > 0);

  if (activeBets.length === 0) {
    return [];
  }

  // Sort bets by amount (ascending)
  activeBets.sort((a, b) => a[1] - b[1]);

  const pots: SidePot[] = [];
  let remainingPlayers = activeBets.map(([playerId]) => playerId);
  let previousLevel = 0;

  for (let i = 0; i < activeBets.length; i++) {
    const [currentPlayerId, currentBet] = activeBets[i];
    const levelAmount = currentBet - previousLevel;

    if (levelAmount > 0) {
      // Create a pot for this level
      const potAmount = levelAmount * remainingPlayers.length;
      const eligiblePlayers = [...remainingPlayers];

      pots.push({
        amount: potAmount,
        eligiblePlayers,
      });

      previousLevel = currentBet;
    }

    // Remove current player from remaining players for next level
    // (they can't win more than they put in)
    remainingPlayers = remainingPlayers.filter(id => id !== currentPlayerId);
  }

  return pots;
}

/**
 * Distributes a single pot among winners
 * @param pot - The pot to distribute
 * @param winners - Array of winning player IDs (in order of priority for odd chips)
 * @returns Map of playerId to winnings from this pot
 */
export function distributePot(pot: SidePot, winners: string[]): Map<string, number> {
  const distribution = new Map<string, number>();

  if (winners.length === 0) {
    return distribution;
  }

  // Only include winners who are eligible for this pot
  const eligibleWinners = winners.filter(winner => pot.eligiblePlayers.includes(winner));

  if (eligibleWinners.length === 0) {
    return distribution;
  }

  // Calculate base share and remainder (odd chips)
  const baseShare = Math.floor(pot.amount / eligibleWinners.length);
  const oddChips = pot.amount % eligibleWinners.length;

  // Distribute pot
  eligibleWinners.forEach((winner, index) => {
    // First winner(s) get the odd chip(s)
    const share = baseShare + (index < oddChips ? 1 : 0);
    distribution.set(winner, share);
  });

  return distribution;
}

/**
 * Distributes all pots to winners
 * @param pots - Array of pots to distribute
 * @param winners - Array of winning player IDs for each pot (can be different per pot)
 * @returns Map of playerId to total winnings across all pots
 */
export function distributeAllPots(pots: SidePot[], winnersPerPot: string[][]): Map<string, number> {
  const totalWinnings = new Map<string, number>();

  pots.forEach((pot, index) => {
    const winners = winnersPerPot[index] || [];
    const potDistribution = distributePot(pot, winners);

    // Accumulate winnings
    potDistribution.forEach((amount, playerId) => {
      totalWinnings.set(playerId, (totalWinnings.get(playerId) || 0) + amount);
    });
  });

  return totalWinnings;
}
