import {
  collection,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './config';
import { Table, TableStatus, TableSettings } from '@shared/types/table';

const TABLES_COLLECTION = 'tables';

/**
 * Get reference to tables collection
 */
function getTablesCollection(): CollectionReference {
  return collection(db, TABLES_COLLECTION);
}

/**
 * Get reference to a specific table document
 */
function getTableRef(tableId: string): DocumentReference {
  return doc(db, TABLES_COLLECTION, tableId);
}

/**
 * Create a new table using Cloud Function
 * @param settings - Optional partial table settings
 * @returns Table ID (4-digit code)
 */
export async function createTable(settings?: Partial<TableSettings>): Promise<string> {
  const createTableFn = httpsCallable<
    { settings?: Partial<TableSettings> },
    { success: boolean; tableId: string; message: string }
  >(functions, 'createTableFunction');

  const result = await createTableFn({ settings });

  if (!result.data.success) {
    throw new Error(result.data.message || 'Failed to create table');
  }

  return result.data.tableId;
}

/**
 * Join a table using Cloud Function
 * @param tableId - 4-digit table code
 * @param buyInAmount - Initial chips to buy
 * @returns Assigned seat position
 */
export async function joinTable(tableId: string, buyInAmount: number): Promise<number> {
  const joinTableFn = httpsCallable<
    { tableId: string; buyInAmount: number },
    { success: boolean; position: number; message: string }
  >(functions, 'joinTableFunction');

  const result = await joinTableFn({ tableId, buyInAmount });

  if (!result.data.success) {
    throw new Error(result.data.message || 'Failed to join table');
  }

  return result.data.position;
}

/**
 * Leave a table using Cloud Function
 * @param tableId - 4-digit table code
 */
export async function leaveTable(tableId: string): Promise<void> {
  const leaveTableFn = httpsCallable<
    { tableId: string },
    { success: boolean; chipsCashedOut: number; message: string }
  >(functions, 'leaveTableFunction');

  const result = await leaveTableFn({ tableId });

  if (!result.data.success) {
    throw new Error(result.data.message || 'Failed to leave table');
  }
}

/**
 * Get table by ID
 * @param tableId - Table identifier
 * @returns Table or null if not found
 */
export async function getTable(tableId: string): Promise<Table | null> {
  const tableRef = getTableRef(tableId);
  const snapshot = await getDoc(tableRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
  } as Table;
}

/**
 * Update table data
 * @param tableId - Table identifier
 * @param updates - Partial table data to update
 */
export async function updateTable(
  tableId: string,
  updates: Partial<Omit<Table, 'id' | 'createdAt'>>
): Promise<void> {
  const tableRef = getTableRef(tableId);
  await updateDoc(tableRef, updates);
}

/**
 * Delete table
 * @param tableId - Table identifier
 */
export async function deleteTable(tableId: string): Promise<void> {
  const tableRef = getTableRef(tableId);
  await deleteDoc(tableRef);
}

/**
 * Get all active tables for a user (as host or player)
 * @param userId - User ID
 * @returns Array of tables
 */
export async function getUserTables(userId: string): Promise<Table[]> {
  const tablesRef = getTablesCollection();

  // Query for tables where user is host
  const hostQuery = query(tablesRef, where('hostId', '==', userId));
  const hostSnapshot = await getDocs(hostQuery);

  const tables: Table[] = [];

  hostSnapshot.forEach(doc => {
    const data = doc.data();
    tables.push({
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt?.toDate() || data.createdAt.toDate(),
    } as Table);
  });

  // Note: For tables where user is a player, we'd need to query differently
  // or maintain a separate index. For now, we just return host tables.

  return tables;
}

/**
 * Update table status
 * @param tableId - Table identifier
 * @param status - New status
 */
export async function updateTableStatus(tableId: string, status: TableStatus): Promise<void> {
  await updateTable(tableId, { status });
}
