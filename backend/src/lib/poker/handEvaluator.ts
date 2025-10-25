import { Card, HandEvaluation, HandRank } from '../../../../shared/types/game';
import { RANK_VALUES, HAND_RANKINGS } from '../../../../shared/constants/gameRules';

/**
 * Evaluates a poker hand of exactly 5 cards
 * @param cards - Array of exactly 5 cards
 * @returns HandEvaluation with rank, value, and cards
 * @throws Error if cards.length !== 5
 */
export function evaluateHand(cards: Card[]): HandEvaluation {
  if (cards.length !== 5) {
    throw new Error(`evaluateHand requires exactly 5 cards, got ${cards.length}`);
  }

  // Check hands in descending order of strength
  const royalFlush = checkRoyalFlush(cards);
  if (royalFlush) return royalFlush;

  const straightFlush = checkStraightFlush(cards);
  if (straightFlush) return straightFlush;

  const fourOfAKind = checkFourOfAKind(cards);
  if (fourOfAKind) return fourOfAKind;

  const fullHouse = checkFullHouse(cards);
  if (fullHouse) return fullHouse;

  const flush = checkFlush(cards);
  if (flush) return flush;

  const straight = checkStraight(cards);
  if (straight) return straight;

  const threeOfAKind = checkThreeOfAKind(cards);
  if (threeOfAKind) return threeOfAKind;

  const twoPair = checkTwoPair(cards);
  if (twoPair) return twoPair;

  const pair = checkPair(cards);
  if (pair) return pair;

  return checkHighCard(cards);
}

/**
 * Finds the best 5-card hand from a set of 5-7 cards
 * @param cards - Array of 5-7 cards
 * @returns HandEvaluation with the best possible hand
 */
export function findBestHand(cards: Card[]): HandEvaluation {
  if (cards.length < 5) {
    throw new Error(`findBestHand requires at least 5 cards, got ${cards.length}`);
  }

  if (cards.length === 5) {
    return evaluateHand(cards);
  }

  // Generate all possible 5-card combinations
  const combinations = generateCombinations(cards, 5);

  // Evaluate each combination and find the best
  let bestHand: HandEvaluation | null = null;

  for (const combo of combinations) {
    const evaluation = evaluateHand(combo);
    if (!bestHand || evaluation.value > bestHand.value) {
      bestHand = evaluation;
    }
  }

  return bestHand!;
}

/**
 * Generates all combinations of k elements from array
 */
function generateCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];

  const [first, ...rest] = arr;
  const combosWithFirst = generateCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const combosWithoutFirst = generateCombinations(rest, k);

  return [...combosWithFirst, ...combosWithoutFirst];
}

/**
 * Helper: Get rank counts from cards
 */
function getRankCounts(cards: Card[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.rank, (counts.get(card.rank) || 0) + 1);
  }
  return counts;
}

/**
 * Helper: Check if all cards are same suit
 */
function isFlush(cards: Card[]): boolean {
  return cards.every(card => card.suit === cards[0].suit);
}

/**
 * Helper: Check if cards form a straight
 * @returns high card rank value if straight, null otherwise
 */
function isStraight(cards: Card[]): number | null {
  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);

  // Check for regular straight (consecutive values)
  const isConsecutive = values.every((val, i) => i === 0 || val === values[i - 1] + 1);
  if (isConsecutive) {
    return values[4]; // High card
  }

  // Check for wheel (A-2-3-4-5)
  const isWheel = values[0] === 2 && values[1] === 3 && values[2] === 4 && values[3] === 5 && values[4] === 14;
  if (isWheel) {
    return 5; // In a wheel, 5 is the high card
  }

  return null;
}

/**
 * Helper: Calculate hand value from hand rank and card values
 */
function calculateHandValue(handRank: HandRank, primaryValues: number[], kickers: number[] = []): number {
  const baseValue = HAND_RANKINGS.indexOf(handRank) * 100000000; // 100 million per rank tier

  // Encode primary values (e.g., trip value, pair values) in higher digits
  let primaryScore = 0;
  primaryValues.forEach((val, i) => {
    primaryScore += val * Math.pow(100, 4 - i);
  });

  // Encode kickers in lower digits
  let kickerScore = 0;
  kickers.forEach((val, i) => {
    kickerScore += val * Math.pow(100, 3 - i);
  });

  return baseValue + primaryScore + kickerScore;
}

/**
 * Check for Royal Flush
 */
function checkRoyalFlush(cards: Card[]): HandEvaluation | null {
  if (!isFlush(cards)) return null;

  const ranks = cards.map(c => c.rank).sort();
  const isRoyal =
    ranks.includes('10') &&
    ranks.includes('J') &&
    ranks.includes('Q') &&
    ranks.includes('K') &&
    ranks.includes('A');

  if (isRoyal) {
    return {
      handRank: 'Royal Flush',
      value: calculateHandValue('Royal Flush', [14]),
      cards,
    };
  }

  return null;
}

/**
 * Check for Straight Flush
 */
function checkStraightFlush(cards: Card[]): HandEvaluation | null {
  if (!isFlush(cards)) return null;

  const straightHighCard = isStraight(cards);
  if (straightHighCard) {
    return {
      handRank: 'Straight Flush',
      value: calculateHandValue('Straight Flush', [straightHighCard]),
      cards,
    };
  }

  return null;
}

/**
 * Check for Four of a Kind
 */
function checkFourOfAKind(cards: Card[]): HandEvaluation | null {
  const counts = getRankCounts(cards);

  for (const [rank, count] of counts.entries()) {
    if (count === 4) {
      const quadValue = RANK_VALUES[rank as keyof typeof RANK_VALUES];
      const kicker = Math.max(
        ...cards
          .filter(c => c.rank !== rank)
          .map(c => RANK_VALUES[c.rank])
      );

      return {
        handRank: 'Four of a Kind',
        value: calculateHandValue('Four of a Kind', [quadValue], [kicker]),
        cards,
      };
    }
  }

  return null;
}

/**
 * Check for Full House
 */
function checkFullHouse(cards: Card[]): HandEvaluation | null {
  const counts = getRankCounts(cards);
  let tripRank: string | null = null;
  let pairRank: string | null = null;

  for (const [rank, count] of counts.entries()) {
    if (count === 3) tripRank = rank;
    if (count === 2) pairRank = rank;
  }

  if (tripRank && pairRank) {
    const tripValue = RANK_VALUES[tripRank as keyof typeof RANK_VALUES];
    const pairValue = RANK_VALUES[pairRank as keyof typeof RANK_VALUES];

    return {
      handRank: 'Full House',
      value: calculateHandValue('Full House', [tripValue, pairValue]),
      cards,
    };
  }

  return null;
}

/**
 * Check for Flush
 */
function checkFlush(cards: Card[]): HandEvaluation | null {
  if (!isFlush(cards)) return null;

  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);

  return {
    handRank: 'Flush',
    value: calculateHandValue('Flush', [], values),
    cards,
  };
}

/**
 * Check for Straight
 */
function checkStraight(cards: Card[]): HandEvaluation | null {
  const straightHighCard = isStraight(cards);

  if (straightHighCard) {
    return {
      handRank: 'Straight',
      value: calculateHandValue('Straight', [straightHighCard]),
      cards,
    };
  }

  return null;
}

/**
 * Check for Three of a Kind
 */
function checkThreeOfAKind(cards: Card[]): HandEvaluation | null {
  const counts = getRankCounts(cards);

  for (const [rank, count] of counts.entries()) {
    if (count === 3) {
      const tripValue = RANK_VALUES[rank as keyof typeof RANK_VALUES];
      const kickers = cards
        .filter(c => c.rank !== rank)
        .map(c => RANK_VALUES[c.rank])
        .sort((a, b) => b - a);

      return {
        handRank: 'Three of a Kind',
        value: calculateHandValue('Three of a Kind', [tripValue], kickers),
        cards,
      };
    }
  }

  return null;
}

/**
 * Check for Two Pair
 */
function checkTwoPair(cards: Card[]): HandEvaluation | null {
  const counts = getRankCounts(cards);
  const pairs: string[] = [];

  for (const [rank, count] of counts.entries()) {
    if (count === 2) pairs.push(rank);
  }

  if (pairs.length === 2) {
    const pairValues = pairs
      .map(r => RANK_VALUES[r as keyof typeof RANK_VALUES])
      .sort((a, b) => b - a);

    const kicker = Math.max(
      ...cards
        .filter(c => !pairs.includes(c.rank))
        .map(c => RANK_VALUES[c.rank])
    );

    return {
      handRank: 'Two Pair',
      value: calculateHandValue('Two Pair', pairValues, [kicker]),
      cards,
    };
  }

  return null;
}

/**
 * Check for Pair
 */
function checkPair(cards: Card[]): HandEvaluation | null {
  const counts = getRankCounts(cards);

  for (const [rank, count] of counts.entries()) {
    if (count === 2) {
      const pairValue = RANK_VALUES[rank as keyof typeof RANK_VALUES];
      const kickers = cards
        .filter(c => c.rank !== rank)
        .map(c => RANK_VALUES[c.rank])
        .sort((a, b) => b - a);

      return {
        handRank: 'Pair',
        value: calculateHandValue('Pair', [pairValue], kickers),
        cards,
      };
    }
  }

  return null;
}

/**
 * Check for High Card
 */
function checkHighCard(cards: Card[]): HandEvaluation {
  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);

  return {
    handRank: 'High Card',
    value: calculateHandValue('High Card', [], values),
    cards,
  };
}
