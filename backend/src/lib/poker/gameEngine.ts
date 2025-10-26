import type { Table } from '../../../../shared/types/table';
import type { PlayerState } from '../../../../shared/types/player';
import type { Hand, GamePhase, PlayerAction, BettingRound } from '../../../../shared/types/game';
import { createDeck, gilbertShannonReedsShuff } from '../../../../shared/lib/poker/shuffler';

/**
 * Initializes a new hand for the table
 * @param table - The current table state
 * @param handNumber - The hand number (sequential)
 * @returns A new Hand object with shuffled deck and dealt hole cards
 */
export function initializeHand(table: Table, handNumber: number): Hand {
  // Create and shuffle deck
  const deck = gilbertShannonReedsShuff(createDeck());

  // Find dealer, small blind, and big blind positions
  const dealerPlayer = table.players.find(p => p.isDealer);
  if (!dealerPlayer) {
    throw new Error('No dealer found at table');
  }

  const dealerPosition = dealerPlayer.position;
  const smallBlindPosition = getNextActivePosition(dealerPosition, table.players);
  const bigBlindPosition = getNextActivePosition(smallBlindPosition, table.players);

  // Deal hole cards (2 per player) - this consumes 2 * numPlayers cards from deck
  const activePlayers = table.players.filter(p => !p.isFolded && !p.isAllIn);
  const numHoleCards = activePlayers.length * 2;
  const remainingDeck = deck.slice(numHoleCards);

  // Post blinds
  const smallBlindPlayer = table.players.find(p => p.position === smallBlindPosition);
  const bigBlindPlayer = table.players.find(p => p.position === bigBlindPosition);

  if (!smallBlindPlayer || !bigBlindPlayer) {
    throw new Error('Could not find blind players');
  }

  // Update player bets for blinds
  smallBlindPlayer.currentBet = table.settings.smallBlind;
  bigBlindPlayer.currentBet = table.settings.bigBlind;

  const pot = table.settings.smallBlind + table.settings.bigBlind;

  // Determine first player to act (left of big blind in preflop)
  const currentPlayerPosition = getNextActivePosition(bigBlindPosition, table.players);

  // Initialize betting round
  const bettingRound: BettingRound = {
    currentBet: table.settings.bigBlind,
    minRaise: table.settings.bigBlind,
    playerActions: {},
  };

  const hand: Hand = {
    handNumber,
    dealerPosition,
    smallBlindPosition,
    bigBlindPosition,
    currentPlayerPosition,
    phase: 'preflop',
    pot,
    sidePots: [],
    communityCards: [],
    deck: remainingDeck,
    bettingRound,
    actionDeadline: new Date(Date.now() + table.settings.actionTimer * 1000),
    blindIncreaseAt: new Date(Date.now() + table.settings.blindIncreaseInterval * 60 * 1000),
    actions: [],
  };

  return hand;
}

/**
 * Progresses the hand to the next phase and deals appropriate community cards
 * @param hand - Current hand state
 * @param bigBlind - Big blind amount (for resetting minRaise)
 * @returns Updated hand with next phase and cards dealt
 */
export function progressToNextPhase(hand: Hand, bigBlind?: number): Hand {
  const phaseProgression: Record<GamePhase, GamePhase> = {
    preflop: 'flop',
    flop: 'turn',
    turn: 'river',
    river: 'showdown',
    showdown: 'showdown', // Terminal state
  };

  const nextPhase = phaseProgression[hand.phase];
  const updatedHand = { ...hand, phase: nextPhase };

  // Deal community cards based on phase
  switch (nextPhase) {
    case 'flop':
      // Burn 1, deal 3 (total 4 cards consumed)
      updatedHand.communityCards = hand.deck.slice(1, 4);
      updatedHand.deck = hand.deck.slice(4);
      break;
    case 'turn':
      // Burn 1, deal 1 (total 2 cards consumed)
      updatedHand.communityCards = [...hand.communityCards, hand.deck[1]];
      updatedHand.deck = hand.deck.slice(2);
      break;
    case 'river':
      // Burn 1, deal 1 (total 2 cards consumed)
      updatedHand.communityCards = [...hand.communityCards, hand.deck[1]];
      updatedHand.deck = hand.deck.slice(2);
      break;
    case 'showdown':
      // No cards dealt
      break;
  }

  // Reset betting round for new phase
  if (nextPhase !== 'showdown') {
    // Use provided big blind or fall back to current minRaise
    const resetMinRaise = bigBlind ?? hand.bettingRound.minRaise;

    updatedHand.bettingRound = {
      currentBet: 0,
      minRaise: resetMinRaise, // Reset to big blind for new round
      playerActions: {},
    };

    // Reset player acted flags for new round (not implemented here, done in game loop)
  }

  return updatedHand;
}

/**
 * Processes a player action and updates hand and player states
 * @param hand - Current hand state
 * @param players - Array of player states
 * @param playerId - ID of acting player
 * @param action - The action being taken
 * @param amount - Amount for raise/allin (optional)
 * @returns Updated hand and players
 */
export function processPlayerAction(
  hand: Hand,
  players: PlayerState[],
  playerId: string,
  action: PlayerAction['action'],
  amount?: number
): { updatedHand: Hand; updatedPlayers: PlayerState[] } {
  const updatedPlayers = players.map(p => ({ ...p }));
  const player = updatedPlayers.find(p => p.id === playerId);

  if (!player) {
    throw new Error(`Player ${playerId} not found`);
  }

  if (!canPlayerAct(hand, players, playerId)) {
    throw new Error(`Player ${playerId} cannot act at this time`);
  }

  const updatedHand = { ...hand };
  let betAmount = 0;

  switch (action) {
    case 'fold':
      player.isFolded = true;
      player.status = 'folded';
      break;

    case 'check':
      if (hand.bettingRound.currentBet > player.currentBet) {
        throw new Error('Cannot check when there is a bet to call');
      }
      break;

    case 'call':
      betAmount = hand.bettingRound.currentBet - player.currentBet;
      if (betAmount > player.chips) {
        throw new Error('Insufficient chips to call');
      }
      player.chips -= betAmount;
      player.currentBet += betAmount;
      updatedHand.pot += betAmount;
      break;

    case 'raise':
      if (!amount) {
        throw new Error('Raise amount must be specified');
      }

      // const callAmount = hand.bettingRound.currentBet - player.currentBet; // May be used for validation
      const raiseAmount = amount - hand.bettingRound.currentBet;

      if (raiseAmount < hand.bettingRound.minRaise) {
        throw new Error(`Raise must be at least ${hand.bettingRound.minRaise} (minimum raise)`);
      }

      if (amount > player.chips + player.currentBet) {
        throw new Error('Insufficient chips to raise');
      }

      betAmount = amount - player.currentBet;
      player.chips -= betAmount;
      player.currentBet = amount;
      updatedHand.pot += betAmount;
      updatedHand.bettingRound.currentBet = amount;
      updatedHand.bettingRound.minRaise = raiseAmount;
      break;

    case 'allin':
      if (!amount) {
        throw new Error('All-in amount must be specified');
      }

      betAmount = Math.min(amount, player.chips);
      player.chips -= betAmount;
      player.currentBet += betAmount;
      player.isAllIn = true;
      player.status = 'allin';
      updatedHand.pot += betAmount;

      // Update current bet if all-in is a raise
      if (player.currentBet > hand.bettingRound.currentBet) {
        const raiseAmount = player.currentBet - hand.bettingRound.currentBet;
        updatedHand.bettingRound.currentBet = player.currentBet;
        updatedHand.bettingRound.minRaise = raiseAmount;
      }
      break;
  }

  // Mark player as having acted
  player.hasActed = true;

  // Record action in history
  const playerAction: PlayerAction = {
    playerId,
    action,
    amount: betAmount,
    timestamp: new Date(),
  };
  updatedHand.actions = [...hand.actions, playerAction];
  updatedHand.bettingRound.playerActions[playerId] = action;

  // Advance to next player
  updatedHand.currentPlayerPosition = getNextPlayerPosition(
    hand.currentPlayerPosition,
    updatedPlayers
  );

  return { updatedHand, updatedPlayers };
}

/**
 * Checks if a player can act in the current hand
 * @param hand - Current hand state
 * @param players - Array of player states
 * @param playerId - ID of player to check
 * @returns True if player can act, false otherwise
 */
export function canPlayerAct(hand: Hand, players: PlayerState[], playerId: string): boolean {
  const player = players.find(p => p.id === playerId);

  if (!player) {
    return false;
  }

  // Player must be at current position
  if (player.position !== hand.currentPlayerPosition) {
    return false;
  }

  // Player must not be folded or all-in
  if (player.isFolded || player.isAllIn) {
    return false;
  }

  return true;
}

/**
 * Checks if the hand is complete (ready to end or progress)
 * @param hand - Current hand state
 * @param players - Array of player states
 * @returns True if hand is complete, false otherwise
 */
export function isHandComplete(hand: Hand, players: PlayerState[]): boolean {
  // Hand is complete if in showdown phase
  if (hand.phase === 'showdown') {
    return true;
  }

  // Count active players (not folded, not all-in)
  const activePlayers = players.filter(p => !p.isFolded);

  // Hand is complete if only one player remains
  if (activePlayers.length === 1) {
    return true;
  }

  // Check if betting round is complete (all active players have acted and matched the bet)
  const playersWhoCanAct = players.filter(p => !p.isFolded && !p.isAllIn);

  if (playersWhoCanAct.length === 0) {
    // All remaining players are all-in, proceed to showdown
    return false; // Actually need to deal out remaining cards
  }

  const allPlayersActed = playersWhoCanAct.every(p => p.hasActed);
  const allBetsMatched = playersWhoCanAct.every(
    p => p.currentBet === hand.bettingRound.currentBet || p.chips === 0
  );

  return allPlayersActed && allBetsMatched;
}

/**
 * Gets the next active player position (skips folded/all-in players)
 * @param currentPosition - Current player position
 * @param players - Array of player states
 * @returns Next active player position
 */
export function getNextPlayerPosition(currentPosition: number, players: PlayerState[]): number {
  const numPlayers = players.length;
  let nextPosition = (currentPosition + 1) % numPlayers;
  let attempts = 0;

  // Find next active player
  while (attempts < numPlayers) {
    const nextPlayer = players.find(p => p.position === nextPosition);

    if (nextPlayer && !nextPlayer.isFolded && !nextPlayer.isAllIn) {
      return nextPosition;
    }

    nextPosition = (nextPosition + 1) % numPlayers;
    attempts++;
  }

  // If no active players found, return current position (shouldn't happen in normal gameplay)
  return currentPosition;
}

/**
 * Helper: Gets the next active position from a given position
 * @param position - Starting position
 * @param players - Array of player states
 * @returns Next active position
 */
function getNextActivePosition(position: number, players: PlayerState[]): number {
  const numPlayers = players.length;
  let nextPosition = (position + 1) % numPlayers;
  let attempts = 0;

  while (attempts < numPlayers) {
    const nextPlayer = players.find(p => p.position === nextPosition);

    if (nextPlayer && nextPlayer.status !== 'folded') {
      return nextPosition;
    }

    nextPosition = (nextPosition + 1) % numPlayers;
    attempts++;
  }

  throw new Error('No active players found');
}
