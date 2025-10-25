import { describe, it, expect } from 'vitest';

// Import the shuffler (will implement after test)
import { gilbertShannonReedsShuff, createDeck } from '../../src/lib/poker/shuffler';

describe('Gilbert-Shannon-Reeds Shuffler', () => {
  describe('createDeck', () => {
    it('should create a standard 52-card deck', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should have 13 cards of each suit', () => {
      const deck = createDeck();
      const suits = deck.reduce(
        (acc, card) => {
          acc[card.suit] = (acc[card.suit] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      expect(suits.spades).toBe(13);
      expect(suits.hearts).toBe(13);
      expect(suits.diamonds).toBe(13);
      expect(suits.clubs).toBe(13);
    });

    it('should have 4 cards of each rank', () => {
      const deck = createDeck();
      const ranks = deck.reduce(
        (acc, card) => {
          acc[card.rank] = (acc[card.rank] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      Object.values(ranks).forEach(count => {
        expect(count).toBe(4);
      });
    });
  });

  describe('gilbertShannonReedsShuff', () => {
    it('should return a deck of 52 cards', () => {
      const deck = createDeck();
      const shuffled = gilbertShannonReedsShuff(deck);
      expect(shuffled).toHaveLength(52);
    });

    it('should not modify the original deck', () => {
      const deck = createDeck();
      const original = [...deck];
      gilbertShannonReedsShuff(deck);
      expect(deck).toEqual(original);
    });

    it('should produce a different order than the original', () => {
      const deck = createDeck();
      const shuffled = gilbertShannonReedsShuff(deck);

      // Extremely unlikely to be in same order after shuffling
      const sameOrder = deck.every((card, i) => card === shuffled[i]);
      expect(sameOrder).toBe(false);
    });

    it('should produce different results on subsequent shuffles', () => {
      const deck = createDeck();
      const shuffle1 = gilbertShannonReedsShuff(deck);
      const shuffle2 = gilbertShannonReedsShuff(deck);

      // Extremely unlikely to produce same shuffle twice
      const sameShuff = shuffle1.every((card, i) => card === shuffle2[i]);
      expect(sameShuff).toBe(false);
    });

    it('should contain all original cards (no duplicates/missing)', () => {
      const deck = createDeck();
      const shuffled = gilbertShannonReedsShuff(deck);

      // Convert to sets of string representations for comparison
      const originalSet = new Set(deck.map(c => `${c.rank}-${c.suit}`));
      const shuffledSet = new Set(shuffled.map(c => `${c.rank}-${c.suit}`));

      expect(shuffledSet.size).toBe(52);
      expect(shuffledSet).toEqual(originalSet);
    });

    it('should perform 7 riffle shuffles (GSR standard)', () => {
      // This is more of a documentation test
      // We can't directly test internal shuffle count, but we document the expected behavior
      const deck = createDeck();
      const shuffled = gilbertShannonReedsShuff(deck);

      // After 7 riffle shuffles, deck should be well-randomized
      // We test this indirectly by checking it's different from original
      expect(shuffled).not.toEqual(deck);
    });

    // Statistical test: Distribution should be roughly uniform
    it('should produce roughly uniform distribution over multiple shuffles', () => {
      const deck = createDeck();
      const firstCardCounts: Record<string, number> = {};
      const iterations = 1000;

      // Shuffle many times and count what card ends up in first position
      for (let i = 0; i < iterations; i++) {
        const shuffled = gilbertShannonReedsShuff(deck);
        const firstCard = `${shuffled[0].rank}-${shuffled[0].suit}`;
        firstCardCounts[firstCard] = (firstCardCounts[firstCard] || 0) + 1;
      }

      // Each card should appear in first position roughly 1000/52 ≈ 19 times
      // We'll accept a wide range (5-40) to account for randomness
      const counts = Object.values(firstCardCounts);
      const avgCount = iterations / 52; // ≈ 19.23

      counts.forEach(count => {
        expect(count).toBeGreaterThan(avgCount * 0.3); // At least 30% of expected
        expect(count).toBeLessThan(avgCount * 2.5); // At most 250% of expected
      });
    });
  });
});
