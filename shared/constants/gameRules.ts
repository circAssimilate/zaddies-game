// Texas Hold'em game rules and constants

import { HandRank, Rank } from '../types/game';

// Hand rankings in order of strength (higher index = stronger)
export const HAND_RANKINGS: readonly HandRank[] = [
  'High Card',
  'Pair',
  'Two Pair',
  'Three of a Kind',
  'Straight',
  'Flush',
  'Full House',
  'Four of a Kind',
  'Straight Flush',
  'Royal Flush',
] as const;

// Rank values for comparison (higher = better)
export const RANK_VALUES: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14, // Ace is high by default (can be low in straights)
};

// All ranks in order
export const ALL_RANKS: readonly Rank[] = [
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
  'A',
] as const;

// All suits
export const ALL_SUITS = ['spades', 'hearts', 'diamonds', 'clubs'] as const;

// Number of riffle shuffles for Gilbert-Shannon-Reeds algorithm
export const SHUFFLE_COUNT = 7;

// Game timing constants
export const DEFAULT_ACTION_TIMER_SECONDS = 30;
export const DEFAULT_BLIND_INCREASE_MINUTES = 15;

// Pot distribution
export const RAKE_PERCENTAGE = 0; // No rake for friend games
