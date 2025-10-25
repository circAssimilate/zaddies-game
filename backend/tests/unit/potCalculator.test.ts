import { describe, it, expect } from 'vitest';
import { calculatePots, distributePot } from '../../src/lib/poker/potCalculator';
import { SidePot } from '../../../../shared/types/game';

describe('Pot Calculator', () => {
  describe('calculatePots', () => {
    it('should create single main pot when no all-ins', () => {
      const bets = new Map([
        ['player1', 100],
        ['player2', 100],
        ['player3', 100],
      ]);

      const pots = calculatePots(bets);

      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).toEqual(['player1', 'player2', 'player3']);
    });

    it('should handle single all-in player with side pot', () => {
      const bets = new Map([
        ['player1', 50], // all-in
        ['player2', 100],
        ['player3', 100],
      ]);
      const allInPlayers = new Set(['player1']);

      const pots = calculatePots(bets, allInPlayers);

      // Main pot: 50 * 3 = 150 (everyone eligible)
      expect(pots[0].amount).toBe(150);
      expect(pots[0].eligiblePlayers).toEqual(['player1', 'player2', 'player3']);

      // Side pot: 50 * 2 = 100 (only player2 and player3 eligible)
      expect(pots[1].amount).toBe(100);
      expect(pots[1].eligiblePlayers).toEqual(['player2', 'player3']);
    });

    it('should handle multiple all-in players at different amounts', () => {
      const bets = new Map([
        ['player1', 30], // all-in (smallest)
        ['player2', 60], // all-in (medium)
        ['player3', 100], // full bet
        ['player4', 100], // full bet
      ]);
      const allInPlayers = new Set(['player1', 'player2']);

      const pots = calculatePots(bets, allInPlayers);

      // Main pot: 30 * 4 = 120 (all 4 players eligible)
      expect(pots[0].amount).toBe(120);
      expect(pots[0].eligiblePlayers).toEqual(['player1', 'player2', 'player3', 'player4']);

      // Side pot 1: 30 * 3 = 90 (player2, player3, player4 eligible)
      expect(pots[1].amount).toBe(90);
      expect(pots[1].eligiblePlayers).toEqual(['player2', 'player3', 'player4']);

      // Side pot 2: 40 * 2 = 80 (player3, player4 eligible)
      expect(pots[2].amount).toBe(80);
      expect(pots[2].eligiblePlayers).toEqual(['player3', 'player4']);
    });

    it('should handle everyone all-in at same amount', () => {
      const bets = new Map([
        ['player1', 100],
        ['player2', 100],
        ['player3', 100],
      ]);
      const allInPlayers = new Set(['player1', 'player2', 'player3']);

      const pots = calculatePots(bets, allInPlayers);

      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(300);
      expect(pots[0].eligiblePlayers).toEqual(['player1', 'player2', 'player3']);
    });

    it('should handle everyone all-in at different amounts', () => {
      const bets = new Map([
        ['player1', 50],
        ['player2', 100],
        ['player3', 150],
      ]);
      const allInPlayers = new Set(['player1', 'player2', 'player3']);

      const pots = calculatePots(bets, allInPlayers);

      // Main pot: 50 * 3 = 150
      expect(pots[0].amount).toBe(150);
      expect(pots[0].eligiblePlayers).toEqual(['player1', 'player2', 'player3']);

      // Side pot 1: 50 * 2 = 100
      expect(pots[1].amount).toBe(100);
      expect(pots[1].eligiblePlayers).toEqual(['player2', 'player3']);

      // Side pot 2: 50 * 1 = 50
      expect(pots[2].amount).toBe(50);
      expect(pots[2].eligiblePlayers).toEqual(['player3']);
    });

    it('should handle empty bets', () => {
      const bets = new Map();
      const pots = calculatePots(bets);

      expect(pots).toHaveLength(0);
    });

    it('should handle single player bet (fold scenario)', () => {
      const bets = new Map([['player1', 100]]);
      const pots = calculatePots(bets);

      expect(pots).toHaveLength(1);
      expect(pots[0].amount).toBe(100);
      expect(pots[0].eligiblePlayers).toEqual(['player1']);
    });

    it('should ignore players who folded (excluded from eligiblePlayers)', () => {
      const bets = new Map([
        ['player1', 50],
        ['player2', 100], // active
        ['player3', 100], // active
        ['player4', 0], // folded before betting
      ]);
      const allInPlayers = new Set(['player1']);

      const pots = calculatePots(bets, allInPlayers);

      // Main pot: 50 * 3 = 150 (player1, player2, player3 - not player4)
      expect(pots[0].amount).toBe(150);
      expect(pots[0].eligiblePlayers).toEqual(['player1', 'player2', 'player3']);

      // Side pot: 50 * 2 = 100
      expect(pots[1].amount).toBe(100);
      expect(pots[1].eligiblePlayers).toEqual(['player2', 'player3']);
    });
  });

  describe('distributePot', () => {
    it('should award entire pot to single winner', () => {
      const pot: SidePot = {
        amount: 300,
        eligiblePlayers: ['player1', 'player2', 'player3'],
      };
      const winners = ['player1'];

      const distribution = distributePot(pot, winners);

      expect(distribution.size).toBe(1);
      expect(distribution.get('player1')).toBe(300);
    });

    it('should split pot evenly between multiple winners', () => {
      const pot: SidePot = {
        amount: 300,
        eligiblePlayers: ['player1', 'player2', 'player3'],
      };
      const winners = ['player1', 'player2'];

      const distribution = distributePot(pot, winners);

      expect(distribution.size).toBe(2);
      expect(distribution.get('player1')).toBe(150);
      expect(distribution.get('player2')).toBe(150);
    });

    it('should handle odd chip splits (give extra to earlier position)', () => {
      const pot: SidePot = {
        amount: 100,
        eligiblePlayers: ['player1', 'player2', 'player3'],
      };
      const winners = ['player1', 'player2', 'player3'];

      const distribution = distributePot(pot, winners);

      // 100 / 3 = 33.33... → 34, 33, 33
      expect(distribution.size).toBe(3);
      expect(distribution.get('player1')).toBe(34); // Gets the odd chip
      expect(distribution.get('player2')).toBe(33);
      expect(distribution.get('player3')).toBe(33);
    });

    it('should only award to winners who are eligible for pot', () => {
      const pot: SidePot = {
        amount: 200,
        eligiblePlayers: ['player2', 'player3'], // Side pot, player1 was all-in earlier
      };
      const winners = ['player1', 'player2']; // player1 won but not eligible for this pot

      const distribution = distributePot(pot, winners);

      // Only player2 gets this pot
      expect(distribution.size).toBe(1);
      expect(distribution.get('player2')).toBe(200);
      expect(distribution.has('player1')).toBe(false);
    });

    it('should handle empty pot', () => {
      const pot: SidePot = {
        amount: 0,
        eligiblePlayers: ['player1', 'player2'],
      };
      const winners = ['player1'];

      const distribution = distributePot(pot, winners);

      expect(distribution.size).toBe(1);
      expect(distribution.get('player1')).toBe(0);
    });

    it('should handle no winners (all folded - should not happen but defensive)', () => {
      const pot: SidePot = {
        amount: 300,
        eligiblePlayers: ['player1', 'player2'],
      };
      const winners: string[] = [];

      const distribution = distributePot(pot, winners);

      expect(distribution.size).toBe(0);
    });

    it('should handle multiple odd chips across several winners', () => {
      const pot: SidePot = {
        amount: 103,
        eligiblePlayers: ['player1', 'player2', 'player3'],
      };
      const winners = ['player1', 'player2', 'player3'];

      const distribution = distributePot(pot, winners);

      // 103 / 3 = 34.33... → 35, 34, 34
      expect(distribution.size).toBe(3);
      expect(distribution.get('player1')).toBe(35);
      expect(distribution.get('player2')).toBe(34);
      expect(distribution.get('player3')).toBe(34);

      // Verify total equals pot amount
      const total = Array.from(distribution.values()).reduce((sum, val) => sum + val, 0);
      expect(total).toBe(103);
    });
  });

  describe('Integration: Full pot calculation and distribution', () => {
    it('should handle complex multi-way all-in scenario', () => {
      // Scenario: 4 players
      // Player1: all-in 30
      // Player2: all-in 60
      // Player3: bet 100
      // Player4: bet 100
      const bets = new Map([
        ['player1', 30],
        ['player2', 60],
        ['player3', 100],
        ['player4', 100],
      ]);
      const allInPlayers = new Set(['player1', 'player2']);

      const pots = calculatePots(bets, allInPlayers);

      // Main pot: 120 (all 4 eligible)
      // Side pot 1: 90 (player2, 3, 4 eligible)
      // Side pot 2: 80 (player3, 4 eligible)

      expect(pots).toHaveLength(3);

      // Scenario: Player1 wins with best hand
      const mainPotDist = distributePot(pots[0], ['player1']);
      expect(mainPotDist.get('player1')).toBe(120);

      const sidePot1Dist = distributePot(pots[1], ['player2']); // Player2 second best
      expect(sidePot1Dist.get('player2')).toBe(90);

      const sidePot2Dist = distributePot(pots[2], ['player3']); // Player3 wins side pot 2
      expect(sidePot2Dist.get('player3')).toBe(80);
    });

    it('should handle split pot scenario with all-ins', () => {
      const bets = new Map([
        ['player1', 50],
        ['player2', 100],
        ['player3', 100],
      ]);
      const allInPlayers = new Set(['player1']);

      const pots = calculatePots(bets, allInPlayers);

      // Main pot: 150, Side pot: 100

      // Player1 and Player2 tie
      const mainPotDist = distributePot(pots[0], ['player1', 'player2']);
      expect(mainPotDist.get('player1')).toBe(75);
      expect(mainPotDist.get('player2')).toBe(75);

      // Only Player2 eligible for side pot
      const sidePotDist = distributePot(pots[1], ['player2']);
      expect(sidePotDist.get('player2')).toBe(100);
    });
  });
});
