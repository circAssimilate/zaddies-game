/**
 * useTable Hook
 * Real-time table state listener and actions
 */

import { useState, useEffect } from 'react';
import { Table } from '@shared/types/table';
import { subscribeToTable } from '../services/firebase/listeners';
import {
  createTable as createTableFn,
  joinTable as joinTableFn,
  leaveTable as leaveTableFn,
} from '../services/firebase/tables';

export interface TableState {
  table: Table | null;
  loading: boolean;
  error: Error | null;
}

export interface TableActions {
  createTable: (settings?: Partial<Table['settings']>) => Promise<string>;
  joinTable: (tableId: string, buyInAmount: number) => Promise<number>;
  leaveTable: (tableId: string) => Promise<void>;
}

/**
 * Hook to manage table state with real-time updates
 * @param tableId - Optional table ID to subscribe to
 * @param userId - Optional user ID to check authentication before subscribing
 * @returns {TableState & TableActions} Table state and actions
 */
export function useTable(tableId?: string, userId?: string | null): TableState & TableActions {
  const [table, setTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(!!tableId); // Loading if tableId provided
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    console.log('[useTable] Effect running:', { tableId, userId });

    if (!tableId) {
      console.log('[useTable] No tableId, returning');
      setTable(null);
      setLoading(false);
      return;
    }

    // Wait for authentication before subscribing
    if (userId === undefined) {
      // Auth state not yet determined, keep loading
      console.log('[useTable] userId undefined, waiting for auth');
      setLoading(true);
      return;
    }

    if (userId === null) {
      // User not authenticated
      console.log('[useTable] userId null, user not authenticated');
      setError(new Error('You must be signed in to view this table'));
      setLoading(false);
      return;
    }

    console.log('[useTable] Setting up subscription for table:', tableId);
    setLoading(true);
    setError(null);

    // Subscribe to real-time table updates
    const unsubscribe = subscribeToTable(
      tableId,
      updatedTable => {
        console.log('[useTable] Table update:', {
          tableId,
          status: updatedTable?.status,
          hasHand: !!updatedTable?.hand,
        });
        setTable(updatedTable);
        setLoading(false);
      },
      err => {
        console.error('Table subscription error:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup subscription
    return () => unsubscribe();
  }, [tableId, userId]);

  const createTable = async (settings?: Partial<Table['settings']>): Promise<string> => {
    try {
      setLoading(true);
      setError(null);
      const newTableId = await createTableFn(settings);
      return newTableId;
    } catch (err) {
      console.error('Create table error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const joinTable = async (targetTableId: string, buyInAmount: number): Promise<number> => {
    try {
      setLoading(true);
      setError(null);
      const position = await joinTableFn(targetTableId, buyInAmount);
      return position;
    } catch (err) {
      console.error('Join table error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveTable = async (targetTableId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await leaveTableFn(targetTableId);
      setTable(null); // Clear table state after leaving
    } catch (err) {
      console.error('Leave table error:', err);
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    table,
    loading,
    error,
    createTable,
    joinTable,
    leaveTable,
  };
}
