import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeHand,
  progressToNextPhase,
  processPlayerAction,
  canPlayerAct,
  isHandComplete,
  getNextPlayerPosition,
} from '../../src/lib/poker/gameEngine';
import type { Table, TableSettings } from '../../../shared/types/table';
import type { PlayerState } from '../../../shared/types/player';

describe('Game Engine', () => {
  let mockTable: Table;
  let mockPlayers: PlayerState[];

  beforeEach(() => {
    // Setup a basic 3-player table for testing
    mockPlayers = [
      {
        id: 'player1',
        position: 0,
        chips: 1000,
        status: 'sitting',
        isDealer: true,
        isSmallBlind: false,
        isBigBlind: false,
        currentBet: 0,
        hasActed: false,
        isFolded: false,
        isAllIn: false,
      },
      {
        id: 'player2',
        position: 1,
        chips: 1000,
        status: 'sitting',
        isDealer: false,
        isSmallBlind: true,
        isBigBlind: false,
        currentBet: 0,
        hasActed: false,
        isFolded: false,
        isAllIn: false,
      },
      {
        id: 'player3',
        position: 2,
        chips: 1000,
        status: 'sitting',
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: true,
        currentBet: 0,
        hasActed: false,
        isFolded: false,
        isAllIn: false,
      },
    ];

    const settings: TableSettings = {
      maxPlayers: 10,
      minBuyIn: 100,
      maxStack: 2000,
      maxDebtPerPlayer: 1000,
      smallBlind: 5,
      bigBlind: 10,
      blindIncreaseInterval: 15,
      actionTimer: 30,
      showHandStrength: false,
    };

    mockTable = {
      id: '1234',
      hostId: 'player1',
      status: 'playing',
      createdAt: new Date(),
      settings,
      players: mockPlayers,
      hand: null,
    };
  });

  describe('initializeHand', () => {
    it('should create a new hand with shuffled deck and deal hole cards', () => {
      const hand = initializeHand(mockTable, 1);

      expect(hand.handNumber).toBe(1);
      expect(hand.phase).toBe('preflop');
      expect(hand.pot).toBe(15); // Small blind (5) + Big blind (10)
      expect(hand.communityCards).toEqual([]);
      expect(hand.deck.length).toBe(52 - 6); // 52 cards - 6 hole cards (3 players × 2)
      expect(hand.sidePots).toEqual([]);
    });

    it('should assign dealer, small blind, and big blind positions correctly', () => {
      const hand = initializeHand(mockTable, 1);

      expect(hand.dealerPosition).toBe(0);
      expect(hand.smallBlindPosition).toBe(1);
      expect(hand.bigBlindPosition).toBe(2);
    });

    it('should set current player to left of big blind for preflop', () => {
      const hand = initializeHand(mockTable, 1);

      // In preflop, action starts left of big blind (position 0 for 3 players)
      expect(hand.currentPlayerPosition).toBe(0);
    });

    it('should deduct blinds from player chip stacks', () => {
      const hand = initializeHand(mockTable, 1);
      const updatedTable = { ...mockTable, hand };

      const smallBlindPlayer = updatedTable.players.find(p => p.position === 1);
      const bigBlindPlayer = updatedTable.players.find(p => p.position === 2);

      expect(smallBlindPlayer?.currentBet).toBe(5);
      expect(bigBlindPlayer?.currentBet).toBe(10);
    });

    it('should rotate dealer button for subsequent hands', () => {
      const hand1 = initializeHand(mockTable, 1);
      expect(hand1.dealerPosition).toBe(0);

      // Simulate dealer rotation
      mockPlayers[0].isDealer = false;
      mockPlayers[1].isDealer = true;

      const hand2 = initializeHand(mockTable, 2);
      expect(hand2.dealerPosition).toBe(1);
    });
  });

  describe('progressToNextPhase', () => {
    it('should progress from preflop to flop and deal 3 community cards', () => {
      const hand = initializeHand(mockTable, 1);
      const updatedHand = progressToNextPhase(hand);

      expect(updatedHand.phase).toBe('flop');
      expect(updatedHand.communityCards.length).toBe(3);
      expect(updatedHand.deck.length).toBe(52 - 6 - 4); // Dealt 3 cards + 1 burned
    });

    it('should progress from flop to turn and deal 1 community card', () => {
      let hand = initializeHand(mockTable, 1);
      hand = progressToNextPhase(hand); // Flop

      const updatedHand = progressToNextPhase(hand);

      expect(updatedHand.phase).toBe('turn');
      expect(updatedHand.communityCards.length).toBe(4);
    });

    it('should progress from turn to river and deal 1 community card', () => {
      let hand = initializeHand(mockTable, 1);
      hand = progressToNextPhase(hand); // Flop
      hand = progressToNextPhase(hand); // Turn

      const updatedHand = progressToNextPhase(hand);

      expect(updatedHand.phase).toBe('river');
      expect(updatedHand.communityCards.length).toBe(5);
    });

    it('should progress from river to showdown', () => {
      let hand = initializeHand(mockTable, 1);
      hand = progressToNextPhase(hand); // Flop
      hand = progressToNextPhase(hand); // Turn
      hand = progressToNextPhase(hand); // River

      const updatedHand = progressToNextPhase(hand);

      expect(updatedHand.phase).toBe('showdown');
      expect(updatedHand.communityCards.length).toBe(5);
    });

    it('should reset betting round when progressing phases', () => {
      const hand = initializeHand(mockTable, 1);
      hand.bettingRound.currentBet = 50;
      hand.bettingRound.minRaise = 50;

      const updatedHand = progressToNextPhase(hand, mockTable.settings.bigBlind);

      expect(updatedHand.bettingRound.currentBet).toBe(0);
      expect(updatedHand.bettingRound.minRaise).toBe(mockTable.settings.bigBlind);
    });
  });

  describe('processPlayerAction', () => {
    it('should process a fold action correctly', () => {
      const hand = initializeHand(mockTable, 1);
      const { updatedHand, updatedPlayers } = processPlayerAction(
        hand,
        mockPlayers,
        'player1',
        'fold'
      );

      const foldedPlayer = updatedPlayers.find(p => p.id === 'player1');
      expect(foldedPlayer?.isFolded).toBe(true);
      expect(foldedPlayer?.status).toBe('folded');
      expect(updatedHand.actions.length).toBe(1);
      expect(updatedHand.actions[0].action).toBe('fold');
    });

    it('should process a call action and match current bet', () => {
      const hand = initializeHand(mockTable, 1);
      hand.bettingRound.currentBet = 10; // Big blind

      const { updatedHand, updatedPlayers } = processPlayerAction(
        hand,
        mockPlayers,
        'player1',
        'call'
      );

      const callingPlayer = updatedPlayers.find(p => p.id === 'player1');
      expect(callingPlayer?.currentBet).toBe(10);
      expect(callingPlayer?.chips).toBe(990); // 1000 - 10
      expect(updatedHand.pot).toBe(25); // 15 (blinds) + 10 (call)
    });

    it('should process a raise action correctly', () => {
      const hand = initializeHand(mockTable, 1);
      hand.bettingRound.currentBet = 10;
      hand.bettingRound.minRaise = 10;

      const { updatedHand, updatedPlayers } = processPlayerAction(
        hand,
        mockPlayers,
        'player1',
        'raise',
        50
      );

      const raisingPlayer = updatedPlayers.find(p => p.id === 'player1');
      expect(raisingPlayer?.currentBet).toBe(50);
      expect(raisingPlayer?.chips).toBe(950); // 1000 - 50
      expect(updatedHand.bettingRound.currentBet).toBe(50);
      expect(updatedHand.bettingRound.minRaise).toBe(40); // Raise amount (50 - 10)
    });

    it('should process a check action when no bet is active', () => {
      let hand = initializeHand(mockTable, 1);
      hand = progressToNextPhase(hand); // Move to flop (no bets)
      hand.bettingRound.currentBet = 0;
      hand.currentPlayerPosition = 1; // Small blind acts first post-flop

      // Reset player bets from previous round (normally done in game loop)
      mockPlayers.forEach(p => {
        p.currentBet = 0;
        p.hasActed = false;
      });

      const { updatedHand, updatedPlayers } = processPlayerAction(
        hand,
        mockPlayers,
        'player2',
        'check'
      );

      const checkingPlayer = updatedPlayers.find(p => p.id === 'player2');
      expect(checkingPlayer?.hasActed).toBe(true);
      expect(checkingPlayer?.currentBet).toBe(0);
      expect(updatedHand.pot).toBe(hand.pot); // Pot unchanged
    });

    it('should handle all-in action when player bets all chips', () => {
      const hand = initializeHand(mockTable, 1);
      const { updatedHand, updatedPlayers } = processPlayerAction(
        hand,
        mockPlayers,
        'player1',
        'allin',
        1000
      );

      const allInPlayer = updatedPlayers.find(p => p.id === 'player1');
      expect(allInPlayer?.isAllIn).toBe(true);
      expect(allInPlayer?.chips).toBe(0);
      expect(allInPlayer?.currentBet).toBe(1000);
      expect(updatedHand.pot).toBe(1015); // 15 (blinds) + 1000 (all-in)
    });

    it('should advance to next player after action', () => {
      const hand = initializeHand(mockTable, 1);
      const currentPosition = hand.currentPlayerPosition;

      const { updatedHand } = processPlayerAction(hand, mockPlayers, 'player1', 'call');

      expect(updatedHand.currentPlayerPosition).not.toBe(currentPosition);
    });

    it('should mark player as having acted', () => {
      const hand = initializeHand(mockTable, 1);

      const { updatedPlayers } = processPlayerAction(hand, mockPlayers, 'player1', 'call');

      const actingPlayer = updatedPlayers.find(p => p.id === 'player1');
      expect(actingPlayer?.hasActed).toBe(true);
    });

    it('should throw error if invalid action (check when bet is active)', () => {
      const hand = initializeHand(mockTable, 1);
      hand.bettingRound.currentBet = 10;

      expect(() => {
        processPlayerAction(hand, mockPlayers, 'player1', 'check');
      }).toThrow();
    });

    it('should throw error if raise is below minimum', () => {
      const hand = initializeHand(mockTable, 1);
      hand.bettingRound.currentBet = 10;
      hand.bettingRound.minRaise = 10;

      expect(() => {
        processPlayerAction(hand, mockPlayers, 'player1', 'raise', 15); // Less than minRaise
      }).toThrow();
    });
  });

  describe('canPlayerAct', () => {
    it("should return true if it is the player's turn", () => {
      const hand = initializeHand(mockTable, 1);
      const currentPlayerId = mockPlayers[hand.currentPlayerPosition].id;

      expect(canPlayerAct(hand, mockPlayers, currentPlayerId)).toBe(true);
    });

    it("should return false if it is not the player's turn", () => {
      const hand = initializeHand(mockTable, 1);
      const otherPlayerId = mockPlayers[(hand.currentPlayerPosition + 1) % mockPlayers.length].id;

      expect(canPlayerAct(hand, mockPlayers, otherPlayerId)).toBe(false);
    });

    it('should return false if player has folded', () => {
      const hand = initializeHand(mockTable, 1);
      const currentPlayerId = mockPlayers[hand.currentPlayerPosition].id;

      mockPlayers[hand.currentPlayerPosition].isFolded = true;

      expect(canPlayerAct(hand, mockPlayers, currentPlayerId)).toBe(false);
    });

    it('should return false if player is all-in', () => {
      const hand = initializeHand(mockTable, 1);
      const currentPlayerId = mockPlayers[hand.currentPlayerPosition].id;

      mockPlayers[hand.currentPlayerPosition].isAllIn = true;

      expect(canPlayerAct(hand, mockPlayers, currentPlayerId)).toBe(false);
    });
  });

  describe('isHandComplete', () => {
    it('should return true if only one player remains (all others folded)', () => {
      const hand = initializeHand(mockTable, 1);

      mockPlayers[0].isFolded = true;
      mockPlayers[1].isFolded = true;
      // Only player3 remains

      expect(isHandComplete(hand, mockPlayers)).toBe(true);
    });

    it('should return true if hand is in showdown phase', () => {
      let hand = initializeHand(mockTable, 1);
      hand = progressToNextPhase(hand); // Flop
      hand = progressToNextPhase(hand); // Turn
      hand = progressToNextPhase(hand); // River
      hand = progressToNextPhase(hand); // Showdown

      expect(isHandComplete(hand, mockPlayers)).toBe(true);
    });

    it('should return false if multiple players remain and not in showdown', () => {
      const hand = initializeHand(mockTable, 1);

      expect(isHandComplete(hand, mockPlayers)).toBe(false);
    });

    it('should return false if betting round is not complete', () => {
      const hand = initializeHand(mockTable, 1);

      // Not all players have acted yet
      expect(isHandComplete(hand, mockPlayers)).toBe(false);
    });
  });

  describe('getNextPlayerPosition', () => {
    it('should return next active player position clockwise', () => {
      const currentPosition = 0;

      const nextPosition = getNextPlayerPosition(currentPosition, mockPlayers);

      expect(nextPosition).toBe(1);
    });

    it('should skip folded players', () => {
      mockPlayers[1].isFolded = true;
      const currentPosition = 0;

      const nextPosition = getNextPlayerPosition(currentPosition, mockPlayers);

      expect(nextPosition).toBe(2); // Skips player at position 1
    });

    it('should skip all-in players', () => {
      mockPlayers[1].isAllIn = true;
      const currentPosition = 0;

      const nextPosition = getNextPlayerPosition(currentPosition, mockPlayers);

      expect(nextPosition).toBe(2); // Skips player at position 1
    });

    it('should wrap around to position 0 when reaching end', () => {
      const currentPosition = 2;

      const nextPosition = getNextPlayerPosition(currentPosition, mockPlayers);

      expect(nextPosition).toBe(0);
    });

    it('should handle when all but one player is folded/all-in', () => {
      mockPlayers[0].isFolded = true;
      mockPlayers[1].isAllIn = true;
      const currentPosition = 2;

      const nextPosition = getNextPlayerPosition(currentPosition, mockPlayers);

      expect(nextPosition).toBe(2); // Returns same player (only active one)
    });
  });
});
