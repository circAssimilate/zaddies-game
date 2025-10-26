// Shared player types for Texas Hold'em Poker

export interface Player {
  id: string; // Firebase Auth UID (immutable)
  username: string; // Display name (mutable)
  email: string; // From Firebase Auth (immutable)
  createdAt: Date;
  lastSeen: Date;
  stats?: PlayerStats;
}

export interface PlayerStats {
  totalChipsBought: number;
  totalChipsCashedOut: number;
  handsPlayed: number;
}

/**
 * Player state at a table
 * Used in backend schemas and frontend components
 */
export interface PlayerState {
  id: string;
  position: number; // Seat position (0-9)
  chips: number; // Current chip stack
  status: 'sitting' | 'playing' | 'folded' | 'allin';
  isDealer: boolean;
  isSmallBlind: boolean;
  isBigBlind: boolean;
  currentBet: number; // Chips bet in current round
  hasActed: boolean; // True if acted in current betting round
  isFolded: boolean;
  isAllIn: boolean;
}

/**
 * @deprecated Use PlayerState instead
 */
export interface TablePlayer {
  name: string;
  chips: number; // Current chip stack
  position: number; // Seat position (0-9)
  isSeated: boolean; // True if seated, false if spectating
  isActive: boolean; // True if in current hand
  hasActed: boolean; // True if acted in current betting round
  currentBet: number; // Chips bet in current round
  state: 'active' | 'folded' | 'allin' | 'waiting'; // Player hand state
  joinedAt: Date;
}

export interface LedgerEntry {
  id: string; // Auto-generated
  playerId: string; // Player reference
  type: 'buy' | 'cashout';
  amount: number; // Chips (buy=negative, cashout=positive)
  tableId: string | null;
  timestamp: Date;
  runningBalance: number; // Cumulative balance
}
