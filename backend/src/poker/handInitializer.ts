/**
 * Hand Initialization Module
 * Contract: specs/001-texas-holdem-poker/data-model.md
 *
 * Handles initialization of new poker hands including:
 * - Dealer button positioning
 * - Blind posting
 * - Card dealing
 * - Initial game state setup
 */

import { Timestamp } from 'firebase-admin/firestore';
import type { Card } from '@shared/types/game';
import type { PlayerState } from '@shared/types/player';
import type { TableSettings } from '@shared/types/table';
import type { HandState } from '../functions/game/schemas';
import { createDeck, shuffleDeckMultiple, dealCards } from './deck';

export interface HandInitializationResult {
  hand: HandState;
  playerHands: Map<string, [Card, Card]>; // playerId -> hole cards
  updatedPlayers: PlayerState[]; // Players with blinds posted
}

/**
 * Initialize a new hand for the table
 *
 * This function:
 * 1. Determines dealer, small blind, and big blind positions
 * 2. Shuffles deck and deals hole cards
 * 3. Posts blinds
 * 4. Sets up initial betting round
 *
 * @param players - Active players at the table
 * @param settings - Table settings (blind amounts, timers)
 * @param handNumber - Current hand number
 * @param previousDealerPosition - Previous dealer position (null for first hand)
 * @returns Hand state, player hole cards, and updated player states
 */
export function initializeHand(
  players: PlayerState[],
  settings: TableSettings,
  handNumber: number,
  previousDealerPosition: number | null = null
): HandInitializationResult {
  if (players.length < 2) {
    throw new Error('Cannot start hand with fewer than 2 players');
  }

  // Determine positions
  const positions = determinePositions(players, previousDealerPosition);
  const { dealerPosition, smallBlindPosition, bigBlindPosition, firstToActPosition } = positions;

  // Deal in players who are sitting at the big blind position
  // This follows Vegas rules: new players must wait for big blind to be dealt in
  const playersWithDealIn = dealInPlayersAtBigBlind(players, bigBlindPosition);

  // Filter active players (those who will be dealt cards this hand)
  const activePlayers = playersWithDealIn.filter(p => p.status !== 'sitting');

  if (activePlayers.length < 2) {
    throw new Error('Cannot start hand with fewer than 2 active players');
  }

  // Create and shuffle deck
  const deck = createDeck();
  shuffleDeckMultiple(deck, 7); // 7 shuffles for excellent randomness

  // Deal hole cards only to active players
  const playerHands = new Map<string, [Card, Card]>();
  for (const player of activePlayers) {
    const holeCards = dealCards(deck, 2) as [Card, Card];
    playerHands.set(player.id, holeCards);
  }

  // Post blinds and update player states
  const { updatedPlayers, pot } = postBlinds(
    playersWithDealIn,
    settings,
    dealerPosition,
    smallBlindPosition,
    bigBlindPosition
  );

  // Calculate blind increase time
  const blindIncreaseAt = Timestamp.fromMillis(
    Date.now() + settings.blindIncreaseInterval * 60 * 1000
  );

  // Calculate action deadline for first player
  const actionDeadline = settings.actionTimer
    ? Timestamp.fromMillis(Date.now() + settings.actionTimer * 1000)
    : null;

  // Initialize hand state
  const hand: HandState = {
    handNumber,
    phase: 'preflop',
    dealerPosition,
    smallBlindPosition,
    bigBlindPosition,
    currentPlayerPosition: firstToActPosition,
    communityCards: [],
    deck, // Remaining 48-50 cards (depending on player count)
    pot,
    sidePots: [],
    bettingRound: {
      currentBet: settings.bigBlind,
      minRaise: settings.bigBlind,
      playerActions: {},
    },
    actionDeadline,
    blindIncreaseAt,
    actions: [],
  };

  return {
    hand,
    playerHands,
    updatedPlayers,
  };
}

/**
 * Deal in players who are sitting at the big blind position
 *
 * Following Vegas rules, new players must wait until they are in the
 * big blind position before being dealt into the hand.
 *
 * @param players - All players at table
 * @param bigBlindPosition - Position of big blind
 * @returns Players with updated deal-in status
 */
function dealInPlayersAtBigBlind(players: PlayerState[], bigBlindPosition: number): PlayerState[] {
  return players.map((player, index) => {
    // If player is sitting and at big blind position, deal them in
    if (player.status === 'sitting' && index === bigBlindPosition) {
      return {
        ...player,
        status: 'playing', // Change from sitting to playing
      };
    }
    return player;
  });
}

/**
 * Determine dealer, blind, and first-to-act positions
 *
 * @param players - Active players
 * @param previousDealerPosition - Previous dealer position (null for first hand)
 * @returns Position assignments
 */
function determinePositions(
  players: PlayerState[],
  previousDealerPosition: number | null
): {
  dealerPosition: number;
  smallBlindPosition: number;
  bigBlindPosition: number;
  firstToActPosition: number;
} {
  const numPlayers = players.length;

  // Determine dealer position
  let dealerPosition: number;
  if (previousDealerPosition === null) {
    // First hand: choose random dealer
    dealerPosition = Math.floor(Math.random() * numPlayers);
  } else {
    // Rotate dealer button clockwise
    dealerPosition = (previousDealerPosition + 1) % numPlayers;
  }

  // Determine blind positions
  let smallBlindPosition: number;
  let bigBlindPosition: number;
  let firstToActPosition: number;

  if (numPlayers === 2) {
    // Heads-up: dealer is small blind, other player is big blind
    smallBlindPosition = dealerPosition;
    bigBlindPosition = (dealerPosition + 1) % numPlayers;
    // In heads-up, small blind acts first preflop
    firstToActPosition = smallBlindPosition;
  } else {
    // 3+ players: standard positions
    smallBlindPosition = (dealerPosition + 1) % numPlayers;
    bigBlindPosition = (dealerPosition + 2) % numPlayers;
    // First to act is left of big blind (UTG)
    firstToActPosition = (bigBlindPosition + 1) % numPlayers;
  }

  return {
    dealerPosition,
    smallBlindPosition,
    bigBlindPosition,
    firstToActPosition,
  };
}

/**
 * Post blinds and update player chip stacks
 *
 * @param players - Player states
 * @param settings - Table settings (blind amounts)
 * @param dealerPosition - Dealer position
 * @param smallBlindPosition - Small blind position
 * @param bigBlindPosition - Big blind position
 * @returns Updated players and initial pot
 */
function postBlinds(
  players: PlayerState[],
  settings: TableSettings,
  dealerPosition: number,
  smallBlindPosition: number,
  bigBlindPosition: number
): {
  updatedPlayers: PlayerState[];
  pot: number;
} {
  const updatedPlayers = players.map((player, index) => {
    const isDealer = index === dealerPosition;
    const isSmallBlind = index === smallBlindPosition;
    const isBigBlind = index === bigBlindPosition;

    let chips = player.chips;
    let currentBet = 0;
    let hasActed = false;
    let isAllIn = false;
    let status = player.status;

    // Post small blind
    if (isSmallBlind) {
      const blindAmount = Math.min(settings.smallBlind, chips);
      chips -= blindAmount;
      currentBet = blindAmount;
      hasActed = true; // Blinds count as having acted

      if (chips === 0) {
        isAllIn = true;
        status = 'allin';
      }
    }

    // Post big blind
    if (isBigBlind) {
      const blindAmount = Math.min(settings.bigBlind, chips);
      chips -= blindAmount;
      currentBet = blindAmount;
      hasActed = true; // Blinds count as having acted

      if (chips === 0) {
        isAllIn = true;
        status = 'allin';
      }
    }

    return {
      ...player,
      chips,
      currentBet,
      hasActed,
      isDealer,
      isSmallBlind,
      isBigBlind,
      isAllIn,
      isFolded: false,
      status,
    };
  });

  // Calculate initial pot from blinds
  const pot = updatedPlayers.reduce((sum, player) => sum + player.currentBet, 0);

  return {
    updatedPlayers,
    pot,
  };
}

/**
 * Get the next active player position (clockwise)
 *
 * @param players - Player states
 * @param currentPosition - Current player position
 * @returns Next active player position, or -1 if no active players
 */
export function getNextPlayerPosition(players: PlayerState[], currentPosition: number): number {
  const numPlayers = players.length;

  for (let i = 1; i <= numPlayers; i++) {
    const nextPosition = (currentPosition + i) % numPlayers;
    const nextPlayer = players[nextPosition];

    // Player is active if not folded and not all-in
    if (!nextPlayer.isFolded && !nextPlayer.isAllIn) {
      return nextPosition;
    }
  }

  // No active players found
  return -1;
}

/**
 * Reset player states after a hand ends
 *
 * Prepares players for the next hand by clearing hand-specific state.
 * Players who were 'folded' or 'allin' return to 'playing' status.
 * Players who are 'sitting' remain sitting (waiting to be dealt in).
 *
 * @param players - Player states after hand completion
 * @returns Players with reset states for next hand
 */
export function resetPlayerStatesForNextHand(players: PlayerState[]): PlayerState[] {
  return players.map(player => {
    // Determine status for next hand
    let nextStatus: PlayerState['status'];
    if (player.status === 'sitting') {
      // Sitting players remain sitting until dealt in at big blind
      nextStatus = 'sitting';
    } else {
      // All other statuses reset to 'playing' for next hand
      nextStatus = 'playing';
    }

    return {
      ...player,
      status: nextStatus,
      currentBet: 0,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
    };
  });
}
