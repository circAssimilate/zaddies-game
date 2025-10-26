/**
 * Cloud Function Request/Response Types
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 */

import type { TableSettings } from '@shared/types/table';

// ============================================================================
// Table Management Functions
// ============================================================================

/**
 * Create Table Request
 */
export interface CreateTableRequest {
  settings?: Partial<TableSettings>; // Optional custom settings
}

/**
 * Create Table Response
 */
export interface CreateTableResponse {
  success: boolean;
  tableId: string; // 4-digit code (e.g., "1234")
  message: string;
}

/**
 * Join Table Request
 */
export interface JoinTableRequest {
  tableId: string; // 4-digit code
  buyInAmount: number; // Initial chips
}

/**
 * Join Table Response
 */
export interface JoinTableResponse {
  success: boolean;
  position: number; // Assigned seat position (0-9)
  message: string;
}

/**
 * Leave Table Request
 */
export interface LeaveTableRequest {
  tableId: string;
}

/**
 * Leave Table Response
 */
export interface LeaveTableResponse {
  success: boolean;
  chipsCashedOut: number;
  message: string;
}

/**
 * Update Table Settings Request
 */
export interface UpdateTableSettingsRequest {
  tableId: string;
  settings: Partial<TableSettings>;
}

/**
 * Update Table Settings Response
 */
export interface UpdateTableSettingsResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Game Action Functions
// ============================================================================

/**
 * Start Game Request
 */
export interface StartGameRequest {
  tableId: string;
}

/**
 * Start Game Response
 */
export interface StartGameResponse {
  success: boolean;
  handNumber: number;
  message: string;
}

/**
 * Player Action Request
 */
export interface PlayerActionRequest {
  tableId: string;
  action: 'fold' | 'check' | 'call' | 'raise' | 'allin';
  raiseAmount?: number; // Required if action === 'raise'
}

/**
 * Player Action Response
 */
export interface PlayerActionResponse {
  success: boolean;
  message: string;
}

// ============================================================================
// Cashier Functions
// ============================================================================

/**
 * Buy Chips Request
 */
export interface BuyChipsRequest {
  amount: number;
  tableId?: string; // Optional: if buying at table
}

/**
 * Buy Chips Response
 */
export interface BuyChipsResponse {
  success: boolean;
  newBalance: number;
  message: string;
}

/**
 * Cash Out Request
 */
export interface CashOutRequest {
  amount: number;
  tableId?: string; // Optional: if cashing out from table
}

/**
 * Cash Out Response
 */
export interface CashOutResponse {
  success: boolean;
  newBalance: number;
  message: string;
}

/**
 * Get Ledger Request
 */
export interface GetLedgerRequest {
  playerId?: string; // Optional: defaults to current user
  limit?: number; // Optional: number of transactions to return
}

/**
 * Get Ledger Response
 */
export interface GetLedgerResponse {
  success: boolean;
  transactions: LedgerTransaction[];
  runningBalance: number;
  message: string;
}

export interface LedgerTransaction {
  id: string;
  playerId: string;
  type: 'buy' | 'cashout';
  amount: number;
  tableId: string | null;
  timestamp: Date;
  runningBalance: number;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate Shareable View Request
 */
export interface GenerateShareableViewRequest {
  tableId: string;
  viewType: 'table' | 'hand';
  showHandStrength?: boolean;
}

/**
 * Generate Shareable View Response
 */
export interface GenerateShareableViewResponse {
  success: boolean;
  viewId: string;
  url: string;
  expiresAt: Date;
  message: string;
}

/**
 * Get Hand History Request
 */
export interface GetHandHistoryRequest {
  tableId: string;
  limit?: number; // Default: 50
}

/**
 * Get Hand History Response
 */
export interface GetHandHistoryResponse {
  success: boolean;
  hands: HandHistoryEntry[];
  message: string;
}

export interface HandHistoryEntry {
  handNumber: number;
  winner: string;
  pot: number;
  winningHand: string;
  timestamp: Date;
}
