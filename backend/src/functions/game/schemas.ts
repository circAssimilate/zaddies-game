/**
 * Firestore Collection Schemas for Game Logic
 * Contract: specs/001-texas-holdem-poker/contracts/firestore-schema.md
 *
 * These schemas define the structure of documents in Firestore.
 * They are used for validation and type safety.
 */

import { Timestamp } from 'firebase-admin/firestore';
import type { PlayerState } from '@shared/types/player';
import type { TableSettings, TableStatus } from '@shared/types/table';
import type { Card } from '@shared/types/game';

// ============================================================================
// Player Schema
// ============================================================================

/**
 * Player document in /players/{playerId}
 * Contract: specs/001-texas-holdem-poker/contracts/firestore-schema.md
 */
export interface PlayerDocument {
  id: string; // Firebase Auth UID (immutable)
  username: string; // Display name (mutable)
  email: string; // From Firebase Auth (immutable)
  createdAt: Timestamp; // Account creation (immutable)
  lastSeen: Timestamp; // Last login (mutable)
  stats?: {
    totalChipsBought: number;
    totalChipsCashedOut: number;
    handsPlayed: number;
  };
}

/**
 * Validate Player document
 */
export function validatePlayerDocument(data: unknown): PlayerDocument {
  const player = data as Partial<PlayerDocument>;

  if (!player.id || typeof player.id !== 'string') {
    throw new Error('Player.id is required and must be a string');
  }

  if (!player.username || typeof player.username !== 'string') {
    throw new Error('Player.username is required and must be a string');
  }

  if (!player.email || typeof player.email !== 'string') {
    throw new Error('Player.email is required and must be a string');
  }

  if (!player.createdAt || !(player.createdAt instanceof Timestamp)) {
    throw new Error('Player.createdAt is required and must be a Timestamp');
  }

  if (!player.lastSeen || !(player.lastSeen instanceof Timestamp)) {
    throw new Error('Player.lastSeen is required and must be a Timestamp');
  }

  return player as PlayerDocument;
}

/**
 * Create default Player document
 */
export function createPlayerDocument(id: string, username: string, email: string): PlayerDocument {
  const now = Timestamp.now();

  return {
    id,
    username,
    email,
    createdAt: now,
    lastSeen: now,
    stats: {
      totalChipsBought: 0,
      totalChipsCashedOut: 0,
      handsPlayed: 0,
    },
  };
}

// ============================================================================
// Table Schema
// ============================================================================

/**
 * Table document in /tables/{tableId}
 * Contract: specs/001-texas-holdem-poker/contracts/firestore-schema.md
 */
export interface TableDocument {
  id: string; // 4-digit code (e.g., "1234")
  hostId: string; // Current host player ID
  status: TableStatus; // 'waiting' | 'playing' | 'ended'
  settings: TableSettings;
  players: PlayerState[]; // Array of players at table
  createdAt: Timestamp;
  hand: HandState | null; // Current hand state (null when not playing)
  blindLevel: number; // Current blind level (for tournaments)
  lastBlindIncrease: Timestamp | null; // When blinds last increased
}

/**
 * Hand state embedded in Table document
 * Contract: specs/001-texas-holdem-poker/data-model.md
 */
export interface HandState {
  handNumber: number;
  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  dealerPosition: number; // Seat number of dealer button
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentPlayerPosition: number; // Whose turn it is
  communityCards: Card[]; // 0-5 cards visible to all
  deck: Card[]; // Remaining cards (server-side only, not sent to clients)
  pot: number; // Main pot
  sidePots: SidePot[]; // For all-in situations

  // Betting round state
  bettingRound: {
    currentBet: number; // Current bet to match
    minRaise: number; // Minimum raise amount
    playerActions: {
      [playerId: string]: 'fold' | 'call' | 'raise' | 'check' | 'allin';
    };
  };

  // Timing
  actionDeadline: Timestamp | null; // When current player must act (null if no timer)
  blindIncreaseAt: Timestamp; // When blinds increase next

  // History (for current hand only)
  actions: ActionHistory[]; // Complete action history for replay/audit
}

export interface SidePot {
  amount: number;
  eligiblePlayers: string[]; // Player IDs
}

export interface ActionHistory {
  playerId: string;
  action: 'fold' | 'check' | 'call' | 'raise' | 'allin';
  amount: number;
  timestamp: Timestamp;
}

/**
 * Validate Table document
 */
export function validateTableDocument(data: unknown): TableDocument {
  const table = data as Partial<TableDocument>;

  if (!table.id || !/^\d{4}$/.test(table.id)) {
    throw new Error('Table.id must be a 4-digit string');
  }

  if (!table.hostId || typeof table.hostId !== 'string') {
    throw new Error('Table.hostId is required and must be a string');
  }

  if (!table.status || !['waiting', 'playing', 'ended'].includes(table.status)) {
    throw new Error('Table.status must be one of: waiting, playing, ended');
  }

  if (!table.settings) {
    throw new Error('Table.settings is required');
  }

  if (!Array.isArray(table.players)) {
    throw new Error('Table.players must be an array');
  }

  if (!table.createdAt || !(table.createdAt instanceof Timestamp)) {
    throw new Error('Table.createdAt is required and must be a Timestamp');
  }

  return table as TableDocument;
}

/**
 * Create default Table document
 */
export function createTableDocument(
  tableId: string,
  hostId: string,
  settings?: Partial<TableSettings>
): TableDocument {
  const defaultSettings: TableSettings = {
    maxPlayers: 10,
    minBuyIn: 100,
    maxStack: 2000,
    maxDebtPerPlayer: 1000,
    smallBlind: 5,
    bigBlind: 10,
    blindIncreaseInterval: 15, // minutes
    actionTimer: 30, // seconds
    showHandStrength: false,
  };

  const finalSettings: TableSettings = {
    ...defaultSettings,
    ...settings,
  };

  // Validate settings
  if (finalSettings.smallBlind >= finalSettings.bigBlind) {
    throw new Error('Small blind must be less than big blind');
  }

  if (finalSettings.maxPlayers < 2 || finalSettings.maxPlayers > 10) {
    throw new Error('Max players must be between 2 and 10');
  }

  if (finalSettings.minBuyIn <= 0) {
    throw new Error('Min buy-in must be positive');
  }

  if (finalSettings.maxStack < finalSettings.minBuyIn) {
    throw new Error('Max stack must be greater than min buy-in');
  }

  const now = Timestamp.now();

  return {
    id: tableId,
    hostId,
    status: 'waiting',
    settings: finalSettings,
    players: [],
    createdAt: now,
    hand: null,
    blindLevel: 1,
    lastBlindIncrease: null,
  };
}

// ============================================================================
// Ledger Schema
// ============================================================================

/**
 * Ledger entry document in /ledger/{playerId}/transactions/{transactionId}
 * Contract: specs/001-texas-holdem-poker/contracts/firestore-schema.md
 */
export interface LedgerEntryDocument {
  id: string; // Auto-generated
  playerId: string; // Player reference
  type: 'buy' | 'cashout';
  amount: number; // Chips (buy=negative, cashout=positive)
  tableId: string | null;
  timestamp: Timestamp;
  runningBalance: number; // Cumulative balance
}

/**
 * Create ledger entry
 */
export function createLedgerEntry(
  playerId: string,
  type: 'buy' | 'cashout',
  amount: number,
  runningBalance: number,
  tableId: string | null = null
): LedgerEntryDocument {
  return {
    id: '', // Will be set by Firestore auto-ID
    playerId,
    type,
    amount,
    tableId,
    timestamp: Timestamp.now(),
    runningBalance,
  };
}

// ============================================================================
// Player Hand Schema (Private hole cards)
// ============================================================================

/**
 * Player hand document in /tables/{tableId}/hands/{handNumber}/playerHands/{playerId}
 * Contract: specs/001-texas-holdem-poker/contracts/firestore-schema.md
 */
export interface PlayerHandDocument {
  playerId: string;
  holeCards: [Card, Card];
  handNumber: number;
}

/**
 * Create player hand document
 */
export function createPlayerHandDocument(
  playerId: string,
  holeCards: [Card, Card],
  handNumber: number
): PlayerHandDocument {
  return {
    playerId,
    holeCards,
    handNumber,
  };
}

// ============================================================================
// Hand History Schema
// ============================================================================

/**
 * Hand history entry in /tables/{tableId}/history/{handNumber}
 * Contract: specs/001-texas-holdem-poker/contracts/firestore-schema.md
 */
export interface HandHistoryDocument {
  handNumber: number;
  winnerId: string;
  pot: number;
  winningHand: string;
  communityCards: Card[];
  timestamp: Timestamp;
  players: {
    id: string;
    holeCards: [Card, Card] | null; // null if folded before showdown
    finalChips: number;
  }[];
}

/**
 * Create hand history document
 */
export function createHandHistoryDocument(
  handNumber: number,
  winnerId: string,
  pot: number,
  winningHand: string,
  communityCards: Card[],
  players: { id: string; holeCards: [Card, Card] | null; finalChips: number }[]
): HandHistoryDocument {
  return {
    handNumber,
    winnerId,
    pot,
    winningHand,
    communityCards,
    timestamp: Timestamp.now(),
    players,
  };
}
