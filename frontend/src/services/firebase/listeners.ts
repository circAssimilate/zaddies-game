import { doc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import { Table } from '../../../../../shared/types/table';
import { Player } from '../../../../../shared/types/player';

/**
 * Subscribe to real-time updates for a table
 * @param tableId - Table ID
 * @param onUpdate - Callback when table updates
 * @param onError - Callback when error occurs (optional)
 * @returns Unsubscribe function
 */
export function subscribeToTable(
  tableId: string,
  onUpdate: (table: Table | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const tableRef = doc(db, 'tables', tableId);

  return onSnapshot(
    tableRef,
    snapshot => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }

      const data = snapshot.data();
      const table: Table = {
        ...data,
        createdAt: data.createdAt.toDate(),
      } as Table;

      onUpdate(table);
    },
    error => {
      console.error('Error subscribing to table:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Subscribe to real-time updates for a player
 * @param playerId - Player ID
 * @param onUpdate - Callback when player updates
 * @param onError - Callback when error occurs (optional)
 * @returns Unsubscribe function
 */
export function subscribeToPlayer(
  playerId: string,
  onUpdate: (player: Player | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const playerRef = doc(db, 'players', playerId);

  return onSnapshot(
    playerRef,
    snapshot => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }

      const player = snapshot.data() as Player;
      onUpdate(player);
    },
    error => {
      console.error('Error subscribing to player:', error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Helper to manage multiple subscriptions
 */
export class SubscriptionManager {
  private subscriptions: Map<string, Unsubscribe> = new Map();

  /**
   * Add a subscription with a key
   * @param key - Unique key for this subscription
   * @param unsubscribe - Unsubscribe function
   */
  add(key: string, unsubscribe: Unsubscribe): void {
    // Unsubscribe from existing subscription with this key if it exists
    this.remove(key);
    this.subscriptions.set(key, unsubscribe);
  }

  /**
   * Remove a specific subscription
   * @param key - Key of subscription to remove
   */
  remove(key: string): void {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  /**
   * Remove all subscriptions
   */
  removeAll(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  /**
   * Get number of active subscriptions
   */
  get count(): number {
    return this.subscriptions.size;
  }
}
