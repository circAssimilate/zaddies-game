// Shared player types for Texas Hold'em Poker

export type PlayerState = 'active' | 'folded' | 'allin' | 'waiting';

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

export interface TablePlayer {
  name: string;
  chips: number; // Current chip stack
  position: number; // Seat position (0-9)
  isSeated: boolean; // True if seated, false if spectating
  isActive: boolean; // True if in current hand
  hasActed: boolean; // True if acted in current betting round
  currentBet: number; // Chips bet in current round
  state: PlayerState; // Player hand state
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
