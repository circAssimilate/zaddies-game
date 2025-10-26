/**
 * useGameState Hook
 * Provides game state and actions for playing poker hands
 *
 * This hook combines table state with game-specific actions:
 * - Starting a game
 * - Making player actions (fold, call, raise, etc.)
 * - Monitoring hand progress and phase transitions
 */

import { useState, useCallback } from 'react';
import { Table } from '@shared/types/table';
import { Card } from '@shared/types/game';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../services/firebase/config';

export interface GameState {
  hand: Table['hand'];
  currentPlayerPosition: number | null;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown' | null;
  pot: number;
  communityCards: Card[];
  loading: boolean;
  error: Error | null;
}

export interface GameActions {
  startGame: () => Promise<void>;
  fold: () => Promise<void>;
  check: () => Promise<void>;
  call: () => Promise<void>;
  raise: (amount: number) => Promise<void>;
  allIn: () => Promise<void>;
}

/**
 * Hook to manage game state and actions
 *
 * @param table - Current table state from useTable
 * @param userId - Current user ID for permission checks
 * @returns {GameState & GameActions} Game state and action functions
 */
export function useGameState(table: Table | null, userId: string | null): GameState & GameActions {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract game state from table
  const hand = table?.hand ?? null;
  const currentPlayerPosition = hand?.currentPlayerPosition ?? null;
  const phase = hand?.phase ?? null;
  const pot = hand?.pot ?? 0;
  const communityCards = hand?.communityCards ?? [];

  // Start game action (host only)
  const startGame = useCallback(async () => {
    if (!table) {
      throw new Error('No table selected');
    }

    if (!userId) {
      throw new Error('User not authenticated');
    }

    if (table.hostId !== userId) {
      throw new Error('Only the host can start the game');
    }

    try {
      setLoading(true);
      setError(null);

      const startGameFn = httpsCallable(functions, 'startGameFunction');
      await startGameFn({ tableId: table.id });
    } catch (err) {
      console.error('Start game error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [table, userId]);

  // Player action wrapper
  const performAction = useCallback(
    async (action: 'fold' | 'check' | 'call' | 'raise' | 'allin', raiseAmount?: number) => {
      if (!table) {
        throw new Error('No table selected');
      }

      if (!userId) {
        throw new Error('User not authenticated');
      }

      if (!hand) {
        throw new Error('No hand in progress');
      }

      try {
        setLoading(true);
        setError(null);

        const playerActionFn = httpsCallable(functions, 'playerActionFunction');
        await playerActionFn({
          tableId: table.id,
          action,
          raiseAmount,
        });
      } catch (err) {
        console.error(`${action} error:`, err);
        setError(err as Error);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [table, userId, hand]
  );

  const fold = useCallback(() => performAction('fold'), [performAction]);
  const check = useCallback(() => performAction('check'), [performAction]);
  const call = useCallback(() => performAction('call'), [performAction]);
  const raise = useCallback((amount: number) => performAction('raise', amount), [performAction]);
  const allIn = useCallback(() => performAction('allin'), [performAction]);

  return {
    // State
    hand,
    currentPlayerPosition,
    phase,
    pot,
    communityCards,
    loading,
    error,
    // Actions
    startGame,
    fold,
    check,
    call,
    raise,
    allIn,
  };
}
