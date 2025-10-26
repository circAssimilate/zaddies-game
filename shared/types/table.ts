// Shared table types for Texas Hold'em Poker

import { Hand } from './game';
import { TablePlayer } from './player';

export type TableStatus = 'waiting' | 'playing' | 'ended';

export interface TableSettings {
  maxPlayers: number; // Default: 10
  minBuyIn: number; // Default: 100
  maxStack: number; // Default: 200 * bigBlind
  maxDebtPerPlayer: number; // Default: 1000
  smallBlind: number; // Default: 5
  bigBlind: number; // Default: 10
  blindIncreaseInterval: number; // Default: 15 (minutes)
  actionTimer: number; // Default: 30 (seconds)
  showHandStrength: boolean; // Default: false
}

export interface Table {
  id: string; // 4-digit code (e.g., "1234")
  hostId: string; // Player ID of current host
  status: TableStatus;
  createdAt: Date;
  updatedAt: Date;

  settings: TableSettings;
  players: Record<string, TablePlayer>; // Map of player ID to player state
  hand: Hand | null; // Null when no hand in progress
}

export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  maxPlayers: 10,
  minBuyIn: 100,
  maxStack: 2000, // 200 * default big blind (10)
  maxDebtPerPlayer: 1000,
  smallBlind: 5,
  bigBlind: 10,
  blindIncreaseInterval: 15,
  actionTimer: 30,
  showHandStrength: false,
};
