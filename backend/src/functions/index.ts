/**
 * Firebase Cloud Functions entry point
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Note: Functions are deployed using esbuild which bundles to lib/index.js
 */

import admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { createTable } from './game/createTable';
import { joinTable } from './game/joinTable';
import { leaveTable } from './game/leaveTable';

// Initialize Firebase Admin
admin.initializeApp();

// ============================================================================
// Table Management Functions
// ============================================================================

/**
 * Create Table
 * Creates a new poker table with unique 4-digit code
 */
export const createTableFunction = onCall({ cors: true }, async request => {
  return createTable(request.data, request);
});

/**
 * Join Table
 * Join an existing table with 4-digit code
 */
export const joinTableFunction = onCall({ cors: true }, async request => {
  return joinTable(request.data, request);
});

/**
 * Leave Table
 * Leave a table and automatically cash out chips
 */
export const leaveTableFunction = onCall({ cors: true }, async request => {
  return leaveTable(request.data, request);
});

// TODO: Export additional functions as they are implemented
// - startGame
// - playerAction
// - buyChips
// - cashOut
// - getLedger
// - generateShareableView
// - getHandHistory
