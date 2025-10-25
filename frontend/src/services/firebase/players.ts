import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  DocumentReference,
  CollectionReference,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';
import { Player, LedgerEntry } from '../../../../../shared/types/player';

const PLAYERS_COLLECTION = 'players';
const LEDGER_COLLECTION = 'ledger';

/**
 * Get reference to players collection
 */
function getPlayersCollection(): CollectionReference {
  return collection(db, PLAYERS_COLLECTION);
}

/**
 * Get reference to a specific player document
 */
function getPlayerRef(playerId: string): DocumentReference {
  return doc(db, PLAYERS_COLLECTION, playerId);
}

/**
 * Get reference to ledger collection
 */
function getLedgerCollection(): CollectionReference {
  return collection(db, LEDGER_COLLECTION);
}

/**
 * Create or update player profile
 * @param playerId - User ID
 * @param name - Player's display name
 * @returns Player
 */
export async function upsertPlayer(playerId: string, name: string): Promise<Player> {
  const playerRef = getPlayerRef(playerId);
  const snapshot = await getDoc(playerRef);

  if (snapshot.exists()) {
    // Update existing player
    const data = snapshot.data();
    const player: Player = {
      id: playerId,
      name,
      balance: data.balance || 0,
    };
    await updateDoc(playerRef, { name });
    return player;
  } else {
    // Create new player
    const player: Player = {
      id: playerId,
      name,
      balance: 0,
    };
    await setDoc(playerRef, player);
    return player;
  }
}

/**
 * Get player by ID
 * @param playerId - User ID
 * @returns Player or null if not found
 */
export async function getPlayer(playerId: string): Promise<Player | null> {
  const playerRef = getPlayerRef(playerId);
  const snapshot = await getDoc(playerRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Player;
}

/**
 * Update player balance
 * @param playerId - User ID
 * @param balance - New balance
 */
export async function updatePlayerBalance(playerId: string, balance: number): Promise<void> {
  const playerRef = getPlayerRef(playerId);
  await updateDoc(playerRef, { balance });
}

/**
 * Record a ledger entry (buy-in or cash-out)
 * @param playerId - User ID
 * @param type - 'buy' or 'cashout'
 * @param amount - Amount in chips
 * @param tableId - Table ID (null for cash-outs)
 * @param runningBalance - Player's balance after this transaction
 * @returns Created ledger entry
 */
export async function recordLedgerEntry(
  playerId: string,
  type: 'buy' | 'cashout',
  amount: number,
  tableId: string | null,
  runningBalance: number
): Promise<LedgerEntry> {
  const ledgerRef = getLedgerCollection();

  const entry: Omit<LedgerEntry, 'id'> = {
    playerId,
    type,
    amount,
    tableId,
    timestamp: new Date(),
    runningBalance,
  };

  // Convert Date to Firestore Timestamp
  const entryData = {
    ...entry,
    timestamp: Timestamp.fromDate(entry.timestamp),
  };

  const docRef = await addDoc(ledgerRef, entryData);

  return {
    id: docRef.id,
    ...entry,
  };
}

/**
 * Get ledger entries for a player
 * @param playerId - User ID
 * @param limit - Maximum number of entries to return (optional)
 * @returns Array of ledger entries (newest first)
 */
export async function getPlayerLedger(playerId: string, limit?: number): Promise<LedgerEntry[]> {
  const ledgerRef = getLedgerCollection();

  let q = query(ledgerRef, where('playerId', '==', playerId), orderBy('timestamp', 'desc'));

  const snapshot = await getDocs(q);
  const entries: LedgerEntry[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    entries.push({
      id: doc.id,
      ...data,
      timestamp: data.timestamp.toDate(),
    } as LedgerEntry);
  });

  return limit ? entries.slice(0, limit) : entries;
}

/**
 * Get all ledger entries for a table
 * @param tableId - Table ID
 * @returns Array of ledger entries
 */
export async function getTableLedger(tableId: string): Promise<LedgerEntry[]> {
  const ledgerRef = getLedgerCollection();

  const q = query(ledgerRef, where('tableId', '==', tableId), orderBy('timestamp', 'asc'));

  const snapshot = await getDocs(q);
  const entries: LedgerEntry[] = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    entries.push({
      id: doc.id,
      ...data,
      timestamp: data.timestamp.toDate(),
    } as LedgerEntry);
  });

  return entries;
}

/**
 * Calculate total buy-ins for a player
 * @param playerId - User ID
 * @returns Total amount bought in
 */
export async function getPlayerTotalBuyIns(playerId: string): Promise<number> {
  const entries = await getPlayerLedger(playerId);
  return entries
    .filter(entry => entry.type === 'buy')
    .reduce((sum, entry) => sum + entry.amount, 0);
}

/**
 * Calculate total cash-outs for a player
 * @param playerId - User ID
 * @returns Total amount cashed out
 */
export async function getPlayerTotalCashOuts(playerId: string): Promise<number> {
  const entries = await getPlayerLedger(playerId);
  return entries
    .filter(entry => entry.type === 'cashout')
    .reduce((sum, entry) => sum + entry.amount, 0);
}
