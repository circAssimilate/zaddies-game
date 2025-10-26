// Shared game types for Texas Hold'em Poker

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export type GamePhase = 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';

export interface SidePot {
  amount: number;
  eligiblePlayers: string[]; // Player IDs eligible to win this pot
}

export interface PlayerAction {
  playerId: string;
  action: 'fold' | 'call' | 'raise' | 'check' | 'allin';
  amount: number; // Bet amount (0 for fold/check)
  timestamp: Date;
}

export interface BettingRound {
  currentBet: number;
  minRaise: number;
  playerActions: Record<string, PlayerAction['action']>;
}

export interface Hand {
  handNumber: number;
  dealerPosition: number; // Seat number of dealer button
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentPlayerPosition: number; // Whose turn

  phase: GamePhase;
  pot: number; // Main pot
  sidePots: SidePot[]; // For all-in situations

  communityCards: Card[]; // 0-5 cards
  deck: Card[]; // Remaining cards (server-side only)

  bettingRound: BettingRound;

  // Timing
  actionDeadline: Date | null; // When current player must act
  blindIncreaseAt: Date; // When blinds increase next

  // History (for current hand only)
  actions: PlayerAction[];
}

export type HandRank =
  | 'Royal Flush'
  | 'Straight Flush'
  | 'Four of a Kind'
  | 'Full House'
  | 'Flush'
  | 'Straight'
  | 'Three of a Kind'
  | 'Two Pair'
  | 'Pair'
  | 'High Card';

export interface HandEvaluation {
  handRank: HandRank;
  value: number; // Numeric value for comparison (higher is better)
  cards: Card[]; // The 5 cards that make up the hand
}
