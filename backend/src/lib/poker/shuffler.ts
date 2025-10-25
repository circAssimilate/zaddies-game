import { Card } from '../../../../shared/types/game';
import { ALL_RANKS, ALL_SUITS, SHUFFLE_COUNT } from '../../../../shared/constants/gameRules';

/**
 * Creates a standard 52-card deck in sorted order
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const suit of ALL_SUITS) {
    for (const rank of ALL_RANKS) {
      deck.push({ rank, suit });
    }
  }

  return deck;
}

/**
 * Performs a single riffle shuffle using binomial distribution for the cut point
 * @param deck - The deck to shuffle
 * @returns A new shuffled deck
 */
function riffleShuffle(deck: Card[]): Card[] {
  const n = deck.length;

  // Binomial distribution for cut point (approximated by normal distribution for large n)
  // For a fair riffle, the cut point follows Binomial(n, 0.5)
  // We use a simple approximation: normal distribution with mean n/2, stddev sqrt(n/4)
  const mean = n / 2;
  const stddev = Math.sqrt(n / 4);

  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  let cutPoint = Math.round(mean + z * stddev);

  // Clamp to valid range [0, n]
  cutPoint = Math.max(0, Math.min(n, cutPoint));

  // Split deck at cut point
  const left = deck.slice(0, cutPoint);
  const right = deck.slice(cutPoint);

  // Interleave cards with probability based on remaining cards in each pile
  const result: Card[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length || j < right.length) {
    if (i >= left.length) {
      // Left pile exhausted, take from right
      result.push(right[j++]);
    } else if (j >= right.length) {
      // Right pile exhausted, take from left
      result.push(left[i++]);
    } else {
      // Both piles have cards, choose randomly based on pile sizes
      const leftRemaining = left.length - i;
      const rightRemaining = right.length - j;
      const total = leftRemaining + rightRemaining;

      if (Math.random() < leftRemaining / total) {
        result.push(left[i++]);
      } else {
        result.push(right[j++]);
      }
    }
  }

  return result;
}

/**
 * Gilbert-Shannon-Reeds shuffle algorithm
 * Performs 7 riffle shuffles for full randomization
 * @param deck - The deck to shuffle
 * @returns A new shuffled deck (original deck is not modified)
 */
export function gilbertShannonReedsShuff(deck: Card[]): Card[] {
  let shuffled = [...deck]; // Copy to avoid modifying original

  for (let i = 0; i < SHUFFLE_COUNT; i++) {
    shuffled = riffleShuffle(shuffled);
  }

  return shuffled;
}
