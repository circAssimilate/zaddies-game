/**
 * Deck Management Module
 * Contract: specs/001-texas-holdem-poker/data-model.md
 *
 * Provides deck creation and shuffling using the Gilbert-Shannon-Reeds (GSR) algorithm.
 * The GSR shuffle is the gold standard for card shuffling as it models physical riffle shuffles.
 */

import type { Card, Rank, Suit } from '@shared/types/game';

/**
 * Create a standard 52-card deck
 * @returns Unshuffled deck in standard order
 */
export function createDeck(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

/**
 * Shuffle a deck using the Gilbert-Shannon-Reeds (GSR) algorithm
 *
 * The GSR shuffle simulates a real riffle shuffle by:
 * 1. Cutting the deck into two halves at a binomially distributed position
 * 2. Interleaving cards from both halves with probability proportional to remaining cards
 *
 * This is the mathematically correct model of physical card shuffling.
 * For cryptographic security, we use crypto.randomInt() instead of Math.random().
 *
 * @param deck - Deck to shuffle (will be modified in place)
 * @returns Shuffled deck
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const n = deck.length;
  const result: Card[] = [];

  // Use binomial distribution to determine cut position
  // For a fair riffle shuffle, the cut follows a binomial distribution B(n, 0.5)
  let cutPosition = 0;
  for (let i = 0; i < n; i++) {
    if (cryptoRandom() < 0.5) {
      cutPosition++;
    }
  }

  // Split deck into two halves
  const leftHalf = deck.slice(0, cutPosition);
  const rightHalf = deck.slice(cutPosition);

  // Interleave cards using probability proportional to remaining cards
  let leftIndex = 0;
  let rightIndex = 0;

  while (leftIndex < leftHalf.length || rightIndex < rightHalf.length) {
    const leftRemaining = leftHalf.length - leftIndex;
    const rightRemaining = rightHalf.length - rightIndex;
    const total = leftRemaining + rightRemaining;

    if (leftRemaining === 0) {
      // Only right half remaining
      result.push(rightHalf[rightIndex++]);
    } else if (rightRemaining === 0) {
      // Only left half remaining
      result.push(leftHalf[leftIndex++]);
    } else {
      // Choose from left with probability leftRemaining / total
      if (cryptoRandom() < leftRemaining / total) {
        result.push(leftHalf[leftIndex++]);
      } else {
        result.push(rightHalf[rightIndex++]);
      }
    }
  }

  // Modify deck in place
  for (let i = 0; i < n; i++) {
    deck[i] = result[i];
  }

  return deck;
}

/**
 * Perform multiple GSR shuffles for enhanced randomness
 *
 * While 1 GSR shuffle is theoretically sufficient, performing 3-7 shuffles
 * ensures excellent randomness and matches casino practices.
 *
 * @param deck - Deck to shuffle
 * @param numShuffles - Number of shuffles to perform (default: 7)
 * @returns Shuffled deck
 */
export function shuffleDeckMultiple(deck: Card[], numShuffles: number = 7): Card[] {
  for (let i = 0; i < numShuffles; i++) {
    shuffleDeck(deck);
  }
  return deck;
}

/**
 * Cryptographically secure random number generator
 *
 * Uses crypto module for secure randomness instead of Math.random()
 * This is important for game integrity.
 *
 * @returns Random number in range [0, 1)
 */
function cryptoRandom(): number {
  // Generate random 32-bit integer and convert to [0, 1)
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  return buffer[0] / (0xffffffff + 1);
}

/**
 * Deal cards from the top of the deck
 *
 * @param deck - Deck to deal from (modified in place)
 * @param count - Number of cards to deal
 * @returns Dealt cards
 * @throws Error if deck doesn't have enough cards
 */
export function dealCards(deck: Card[], count: number): Card[] {
  if (deck.length < count) {
    throw new Error(`Not enough cards in deck. Requested ${count}, have ${deck.length}`);
  }

  return deck.splice(0, count);
}

/**
 * Get card display string for debugging
 *
 * @param card - Card to display
 * @returns String like "A♠" or "10♦"
 */
export function cardToString(card: Card): string {
  const suitSymbols: Record<Suit, string> = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  };

  return `${card.rank}${suitSymbols[card.suit]}`;
}

/**
 * Get deck display string for debugging
 *
 * @param deck - Deck to display
 * @returns String with all cards
 */
export function deckToString(deck: Card[]): string {
  return deck.map(cardToString).join(' ');
}
