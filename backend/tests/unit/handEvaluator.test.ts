import { describe, it, expect } from 'vitest';
import { Card } from '../../../shared/types/game';
import { evaluateHand, findBestHand } from '../../src/lib/poker/handEvaluator';

describe('Hand Evaluator', () => {
  describe('Royal Flush', () => {
    it('should identify a royal flush', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'spades' },
        { rank: 'Q', suit: 'spades' },
        { rank: 'J', suit: 'spades' },
        { rank: '10', suit: 'spades' },
      ];

      const result = evaluateHand(cards);

      expect(result.handRank).toBe('Royal Flush');
      expect(result.value).toBeGreaterThan(0);
    });

    it('should identify royal flush with 7 cards', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'hearts' },
        { rank: 'J', suit: 'hearts' },
        { rank: '10', suit: 'hearts' },
        { rank: '2', suit: 'clubs' },
        { rank: '3', suit: 'diamonds' },
      ];

      const result = findBestHand(cards);
      expect(result.handRank).toBe('Royal Flush');
    });
  });

  describe('Straight Flush', () => {
    it('should identify a straight flush', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'diamonds' },
        { rank: '8', suit: 'diamonds' },
        { rank: '7', suit: 'diamonds' },
        { rank: '6', suit: 'diamonds' },
        { rank: '5', suit: 'diamonds' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Straight Flush');
    });

    it('should identify wheel straight flush (A-2-3-4-5)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'clubs' },
        { rank: '2', suit: 'clubs' },
        { rank: '3', suit: 'clubs' },
        { rank: '4', suit: 'clubs' },
        { rank: '5', suit: 'clubs' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Straight Flush');
    });
  });

  describe('Four of a Kind', () => {
    it('should identify four of a kind', () => {
      const cards: Card[] = [
        { rank: 'K', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Four of a Kind');
    });

    it('should rank higher four of a kind correctly', () => {
      const aces: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
      ];

      const kings: Card[] = [
        { rank: 'K', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
      ];

      const acesResult = evaluateHand(aces);
      const kingsResult = evaluateHand(kings);

      expect(acesResult.value).toBeGreaterThan(kingsResult.value);
    });
  });

  describe('Full House', () => {
    it('should identify a full house', () => {
      const cards: Card[] = [
        { rank: 'J', suit: 'spades' },
        { rank: 'J', suit: 'hearts' },
        { rank: 'J', suit: 'diamonds' },
        { rank: '7', suit: 'clubs' },
        { rank: '7', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Full House');
    });

    it('should rank full houses correctly by three of a kind', () => {
      const acesOverKings: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: 'A', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: 'K', suit: 'spades' },
      ];

      const kingsOverAces: Card[] = [
        { rank: 'K', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'A', suit: 'clubs' },
        { rank: 'A', suit: 'spades' },
      ];

      const acesResult = evaluateHand(acesOverKings);
      const kingsResult = evaluateHand(kingsOverAces);

      expect(acesResult.value).toBeGreaterThan(kingsResult.value);
    });
  });

  describe('Flush', () => {
    it('should identify a flush', () => {
      const cards: Card[] = [
        { rank: 'K', suit: 'hearts' },
        { rank: 'J', suit: 'hearts' },
        { rank: '9', suit: 'hearts' },
        { rank: '6', suit: 'hearts' },
        { rank: '3', suit: 'hearts' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Flush');
    });

    it('should rank flushes by high card', () => {
      const aceHigh: Card[] = [
        { rank: 'A', suit: 'clubs' },
        { rank: '9', suit: 'clubs' },
        { rank: '7', suit: 'clubs' },
        { rank: '5', suit: 'clubs' },
        { rank: '3', suit: 'clubs' },
      ];

      const kingHigh: Card[] = [
        { rank: 'K', suit: 'diamonds' },
        { rank: '9', suit: 'diamonds' },
        { rank: '7', suit: 'diamonds' },
        { rank: '5', suit: 'diamonds' },
        { rank: '3', suit: 'diamonds' },
      ];

      const aceResult = evaluateHand(aceHigh);
      const kingResult = evaluateHand(kingHigh);

      expect(aceResult.value).toBeGreaterThan(kingResult.value);
    });
  });

  describe('Straight', () => {
    it('should identify a straight', () => {
      const cards: Card[] = [
        { rank: '9', suit: 'spades' },
        { rank: '8', suit: 'hearts' },
        { rank: '7', suit: 'diamonds' },
        { rank: '6', suit: 'clubs' },
        { rank: '5', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Straight');
    });

    it('should identify wheel straight (A-2-3-4-5)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: '2', suit: 'hearts' },
        { rank: '3', suit: 'diamonds' },
        { rank: '4', suit: 'clubs' },
        { rank: '5', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Straight');
    });

    it('should identify broadway straight (10-J-Q-K-A)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
        { rank: '10', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Straight');
    });
  });

  describe('Three of a Kind', () => {
    it('should identify three of a kind', () => {
      const cards: Card[] = [
        { rank: '8', suit: 'spades' },
        { rank: '8', suit: 'hearts' },
        { rank: '8', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: '4', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Three of a Kind');
    });
  });

  describe('Two Pair', () => {
    it('should identify two pair', () => {
      const cards: Card[] = [
        { rank: 'J', suit: 'spades' },
        { rank: 'J', suit: 'hearts' },
        { rank: '3', suit: 'diamonds' },
        { rank: '3', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Two Pair');
    });

    it('should rank two pair by higher pair', () => {
      const acesAndKings: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
      ];

      const kingsAndQueens: Card[] = [
        { rank: 'K', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
        { rank: '2', suit: 'spades' },
      ];

      const acesResult = evaluateHand(acesAndKings);
      const kingsResult = evaluateHand(kingsAndQueens);

      expect(acesResult.value).toBeGreaterThan(kingsResult.value);
    });
  });

  describe('Pair', () => {
    it('should identify a pair', () => {
      const cards: Card[] = [
        { rank: '10', suit: 'spades' },
        { rank: '10', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: '6', suit: 'clubs' },
        { rank: '3', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('Pair');
    });

    it('should rank pairs correctly', () => {
      const aces: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
        { rank: 'J', suit: 'spades' },
      ];

      const twos: Card[] = [
        { rank: '2', suit: 'spades' },
        { rank: '2', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
        { rank: 'J', suit: 'spades' },
      ];

      const acesResult = evaluateHand(aces);
      const twosResult = evaluateHand(twos);

      expect(acesResult.value).toBeGreaterThan(twosResult.value);
    });
  });

  describe('High Card', () => {
    it('should identify high card', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'J', suit: 'hearts' },
        { rank: '8', suit: 'diamonds' },
        { rank: '5', suit: 'clubs' },
        { rank: '3', suit: 'spades' },
      ];

      const result = evaluateHand(cards);
      expect(result.handRank).toBe('High Card');
    });

    it('should rank high cards correctly', () => {
      const aceHigh: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
        { rank: '9', suit: 'spades' },
      ];

      const kingHigh: Card[] = [
        { rank: 'K', suit: 'spades' },
        { rank: 'Q', suit: 'hearts' },
        { rank: 'J', suit: 'diamonds' },
        { rank: '10', suit: 'clubs' },
        { rank: '8', suit: 'spades' },
      ];

      const aceResult = evaluateHand(aceHigh);
      const kingResult = evaluateHand(kingHigh);

      expect(aceResult.value).toBeGreaterThan(kingResult.value);
    });
  });

  describe('findBestHand', () => {
    it('should find best 5 cards from 7 cards', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'K', suit: 'clubs' },
        { rank: 'Q', suit: 'spades' },
        { rank: '3', suit: 'hearts' },
        { rank: '2', suit: 'diamonds' },
      ];

      const result = findBestHand(cards);

      // Should find two pair: Aces and Kings with Queen kicker
      expect(result.handRank).toBe('Two Pair');
      expect(result.cards).toHaveLength(5);
    });

    it('should work with exactly 5 cards', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'A', suit: 'hearts' },
        { rank: 'K', suit: 'diamonds' },
        { rank: 'Q', suit: 'clubs' },
        { rank: 'J', suit: 'spades' },
      ];

      const result = findBestHand(cards);
      expect(result.cards).toHaveLength(5);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty array gracefully', () => {
      expect(() => evaluateHand([])).toThrow();
    });

    it('should handle less than 5 cards gracefully', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
      ];

      expect(() => evaluateHand(cards)).toThrow();
    });

    it('should handle more than 7 cards (findBestHand)', () => {
      const cards: Card[] = [
        { rank: 'A', suit: 'spades' },
        { rank: 'K', suit: 'hearts' },
        { rank: 'Q', suit: 'diamonds' },
        { rank: 'J', suit: 'clubs' },
        { rank: '10', suit: 'spades' },
        { rank: '9', suit: 'hearts' },
        { rank: '8', suit: 'diamonds' },
      ];

      const result = findBestHand(cards);
      expect(result.cards).toHaveLength(5);
      expect(result.handRank).toBe('Straight');
    });
  });
});
