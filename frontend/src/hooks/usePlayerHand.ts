/**
 * usePlayerHand Hook
 * Fetches and manages player's private hole cards
 *
 * Hole cards are stored in a secure Firestore subcollection that only
 * the owning player can read. This hook subscribes to that data.
 */

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { Card } from '@shared/types/game';

export interface PlayerHandState {
  holeCards: [Card, Card] | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch player's private hole cards
 *
 * @param tableId - Current table ID
 * @param handNumber - Current hand number
 * @param userId - Current user ID
 * @returns {PlayerHandState} Player's hole cards and loading state
 */
export function usePlayerHand(
  tableId: string | null,
  handNumber: number | null,
  userId: string | null
): PlayerHandState {
  const [holeCards, setHoleCards] = useState<[Card, Card] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Reset state if prerequisites not met
    if (!tableId || !handNumber || !userId) {
      setHoleCards(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to player's hole cards
    // Path: /tables/{tableId}/hands/{handNumber}/playerHands/{playerId}
    const playerHandRef = doc(
      db,
      'tables',
      tableId,
      'hands',
      String(handNumber),
      'playerHands',
      userId
    );

    const unsubscribe = onSnapshot(
      playerHandRef,
      snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setHoleCards(data.holeCards as [Card, Card]);
        } else {
          // Player not dealt in yet, or hand ended
          setHoleCards(null);
        }
        setLoading(false);
      },
      err => {
        console.error('Player hand subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [tableId, handNumber, userId]);

  return {
    holeCards,
    loading,
    error,
  };
}
