import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  DocumentReference,
  CollectionReference,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';
import { Table, TableStatus, TableSettings } from '../../../../../shared/types/table';

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
 * Create a new table
 * @param tableId - Unique table identifier
 * @param hostId - User ID of the host
 * @param settings - Table settings
 * @returns Created table
 */
export async function createTable(
  tableId: string,
  hostId: string,
  settings: TableSettings
): Promise<Table> {
  const tableRef = getTableRef(tableId);

  const table: Table = {
    id: tableId,
    hostId,
    settings,
    status: 'waiting',
    players: [],
    createdAt: new Date(),
    currentHand: null,
  };

  // Convert Date to Firestore Timestamp
  const tableData = {
    ...table,
    createdAt: Timestamp.fromDate(table.createdAt),
  };

  await setDoc(tableRef, tableData);

  return table;
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
