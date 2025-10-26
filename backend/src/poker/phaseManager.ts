/**
 * Phase Manager Module
 * Contract: specs/001-texas-holdem-poker/data-model.md
 *
 * Handles phase transitions in Texas Hold'em:
 * - preflop → flop (deal 3 community cards)
 * - flop → turn (deal 1 card)
 * - turn → river (deal 1 card)
 * - river → showdown (evaluate hands, distribute pot)
 */

import type { PlayerState } from '@shared/types/player';
import type { HandState } from '../functions/game/schemas';
import { dealCards } from './deck';

/**
 * Advance to the next phase of the hand
 *
 * @param hand - Current hand state
 * @param players - Current player states
 * @returns Updated hand state with new phase
 */
export function advancePhase(
  hand: HandState,
  players: PlayerState[]
): {
  hand: HandState;
  shouldEndHand: boolean;
} {
  const activePlayers = players.filter(p => !p.isFolded && !p.isAllIn);

  // Check if only one player remains (all others folded)
  const playersNotFolded = players.filter(p => !p.isFolded);
  if (playersNotFolded.length === 1) {
    // End hand immediately - winner by default
    return {
      hand: {
        ...hand,
        phase: 'showdown',
      },
      shouldEndHand: true,
    };
  }

  // Check if all remaining players are all-in (no more betting possible)
  if (activePlayers.length === 0) {
    // Deal all remaining community cards and go to showdown
    return dealToShowdown(hand);
  }

  // Normal phase progression
  switch (hand.phase) {
    case 'preflop':
      return advanceToFlop(hand, players);

    case 'flop':
      return advanceToTurn(hand, players);

    case 'turn':
      return advanceToRiver(hand, players);

    case 'river':
      return advanceToShowdown(hand);

    case 'showdown':
      // Already at showdown, should not advance
      return {
        hand,
        shouldEndHand: true,
      };

    default:
      throw new Error(`Invalid phase: ${hand.phase}`);
  }
}

/**
 * Advance from preflop to flop
 * Deal 3 community cards and reset betting round
 */
function advanceToFlop(
  hand: HandState,
  players: PlayerState[]
): {
  hand: HandState;
  shouldEndHand: boolean;
} {
  // Deal 3 community cards (the flop)
  const flopCards = dealCards(hand.deck, 3);

  // Find first player to act (left of dealer button)
  const firstToAct = findFirstToAct(players, hand.dealerPosition);

  return {
    hand: {
      ...hand,
      phase: 'flop',
      communityCards: [...hand.communityCards, ...flopCards],
      currentPlayerPosition: firstToAct,
      bettingRound: {
        currentBet: 0,
        minRaise: hand.bettingRound.minRaise,
        playerActions: {},
      },
    },
    shouldEndHand: false,
  };
}

/**
 * Advance from flop to turn
 * Deal 1 community card and reset betting round
 */
function advanceToTurn(
  hand: HandState,
  players: PlayerState[]
): {
  hand: HandState;
  shouldEndHand: boolean;
} {
  // Deal 1 community card (the turn)
  const turnCard = dealCards(hand.deck, 1);

  const firstToAct = findFirstToAct(players, hand.dealerPosition);

  return {
    hand: {
      ...hand,
      phase: 'turn',
      communityCards: [...hand.communityCards, ...turnCard],
      currentPlayerPosition: firstToAct,
      bettingRound: {
        currentBet: 0,
        minRaise: hand.bettingRound.minRaise,
        playerActions: {},
      },
    },
    shouldEndHand: false,
  };
}

/**
 * Advance from turn to river
 * Deal 1 community card and reset betting round
 */
function advanceToRiver(
  hand: HandState,
  players: PlayerState[]
): {
  hand: HandState;
  shouldEndHand: boolean;
} {
  // Deal 1 community card (the river)
  const riverCard = dealCards(hand.deck, 1);

  const firstToAct = findFirstToAct(players, hand.dealerPosition);

  return {
    hand: {
      ...hand,
      phase: 'river',
      communityCards: [...hand.communityCards, ...riverCard],
      currentPlayerPosition: firstToAct,
      bettingRound: {
        currentBet: 0,
        minRaise: hand.bettingRound.minRaise,
        playerActions: {},
      },
    },
    shouldEndHand: false,
  };
}

/**
 * Advance from river to showdown
 * No more cards to deal, proceed to hand evaluation
 */
function advanceToShowdown(hand: HandState): {
  hand: HandState;
  shouldEndHand: boolean;
} {
  return {
    hand: {
      ...hand,
      phase: 'showdown',
      currentPlayerPosition: -1, // No more actions
    },
    shouldEndHand: true,
  };
}

/**
 * Deal all remaining community cards when all players are all-in
 * This happens when there's no more betting possible
 */
function dealToShowdown(hand: HandState): {
  hand: HandState;
  shouldEndHand: boolean;
} {
  const cardsNeeded = 5 - hand.communityCards.length;
  if (cardsNeeded > 0) {
    const remainingCards = dealCards(hand.deck, cardsNeeded);
    return {
      hand: {
        ...hand,
        phase: 'showdown',
        communityCards: [...hand.communityCards, ...remainingCards],
        currentPlayerPosition: -1,
      },
      shouldEndHand: true,
    };
  }

  return {
    hand: {
      ...hand,
      phase: 'showdown',
      currentPlayerPosition: -1,
    },
    shouldEndHand: true,
  };
}

/**
 * Find the first player to act in a new betting round
 * (player left of dealer button who is still active)
 *
 * @param players - All players at table
 * @param dealerPosition - Dealer button position
 * @returns Position of first player to act, or -1 if none
 */
function findFirstToAct(players: PlayerState[], dealerPosition: number): number {
  // Start from left of dealer
  const startPosition = (dealerPosition + 1) % players.length;

  // Find first active player (not folded, not all-in)
  for (let i = 0; i < players.length; i++) {
    const position = (startPosition + i) % players.length;
    const player = players[position];

    if (!player.isFolded && !player.isAllIn) {
      return position;
    }
  }

  return -1; // No active players
}

/**
 * Reset player betting round state for new phase
 *
 * @param players - Current player states
 * @returns Players with reset betting round state
 */
export function resetBettingRoundState(players: PlayerState[]): PlayerState[] {
  return players.map(player => ({
    ...player,
    currentBet: 0,
    hasActed: false,
    // Keep dealer/blind flags (they only apply to preflop)
    isDealer: player.isDealer,
    isSmallBlind: player.isSmallBlind,
    isBigBlind: player.isBigBlind,
  }));
}

/**
 * Check if all active players have acted and matched the current bet
 *
 * @param players - Current player states
 * @param currentBet - Current bet amount
 * @returns True if betting round is complete
 */
export function isBettingRoundComplete(players: PlayerState[], currentBet: number): boolean {
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

  // All active players must have matched the current bet
  const allBetsMatched = activePlayers.every(p => p.currentBet === currentBet);

  return allBetsMatched;
}
