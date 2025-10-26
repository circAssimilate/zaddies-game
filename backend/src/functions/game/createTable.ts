/**
 * createTable Cloud Function
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Creates a new poker table with unique 4-digit code
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import type { CreateTableRequest, CreateTableResponse } from './types';
import { createTableDocument } from './schemas';
import { generateTableCode } from '../../lib/utils/codeGenerator';

/**
 * Create Table Function
 * @param data - CreateTableRequest
 * @param context - Call context with auth
 * @returns CreateTableResponse
 */
export async function createTable(
  data: CreateTableRequest,
  context: { auth?: { uid: string } }
): Promise<CreateTableResponse> {
  // Validate authentication
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to create a table');
  }

  const userId = context.auth.uid;
  const db = getFirestore();

  try {
    // Validate settings if provided
    if (data.settings) {
      validateTableSettings(data.settings);
    }

    // Generate unique 4-digit table code
    const tableId = await generateTableCode(db);

    // Create table document
    const tableDoc = createTableDocument(tableId, userId, data.settings);

    // Save to Firestore
    await db.collection('tables').doc(tableId).set(tableDoc);

    return {
      success: true,
      tableId,
      message: 'Table created successfully',
    };
  } catch (error) {
    // Handle specific errors
    if (error instanceof HttpsError) {
      throw error;
    }

    // Handle validation errors
    if (error instanceof Error && error.message.includes('blind')) {
      throw new HttpsError('invalid-argument', error.message);
    }

    if (error instanceof Error && error.message.includes('players')) {
      throw new HttpsError('invalid-argument', error.message);
    }

    if (error instanceof Error && error.message.includes('buy-in')) {
      throw new HttpsError('invalid-argument', error.message);
    }

    if (error instanceof Error && error.message.includes('stack')) {
      throw new HttpsError('invalid-argument', error.message);
    }

    // Handle code generation exhaustion
    if (error instanceof Error && error.message.includes('Unable to generate')) {
      throw new HttpsError(
        'resource-exhausted',
        'Unable to generate unique table code. Please try again.'
      );
    }

    // Generic error
    throw new HttpsError('internal', 'Failed to create table');
  }
}

/**
 * Validate table settings
 * @param settings - Partial table settings
 * @throws HttpsError if settings are invalid
 */
function validateTableSettings(settings: CreateTableRequest['settings']) {
  if (!settings) return;

  // Validate maxPlayers
  if (settings.maxPlayers !== undefined) {
    if (settings.maxPlayers < 2 || settings.maxPlayers > 10) {
      throw new HttpsError('invalid-argument', 'Max players must be between 2 and 10');
    }
  }

  // Validate blinds
  if (settings.bigBlind !== undefined && settings.bigBlind <= 0) {
    throw new HttpsError('invalid-argument', 'Big blind must be positive');
  }

  if (settings.smallBlind !== undefined && settings.smallBlind <= 0) {
    throw new HttpsError('invalid-argument', 'Small blind must be positive');
  }

  // Validate small blind < big blind
  if (
    settings.smallBlind !== undefined &&
    settings.bigBlind !== undefined &&
    settings.smallBlind >= settings.bigBlind
  ) {
    throw new HttpsError('invalid-argument', 'Small blind must be less than big blind');
  }

  // Validate minBuyIn
  if (settings.minBuyIn !== undefined && settings.minBuyIn <= 0) {
    throw new HttpsError('invalid-argument', 'Minimum buy-in must be positive');
  }

  // Validate maxStack
  if (settings.maxStack !== undefined && settings.maxStack <= 0) {
    throw new HttpsError('invalid-argument', 'Maximum stack must be positive');
  }

  // Validate maxStack >= minBuyIn
  if (
    settings.maxStack !== undefined &&
    settings.minBuyIn !== undefined &&
    settings.maxStack < settings.minBuyIn
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Maximum stack must be greater than or equal to minimum buy-in'
    );
  }

  // Validate maxDebtPerPlayer
  if (settings.maxDebtPerPlayer !== undefined && settings.maxDebtPerPlayer < 0) {
    throw new HttpsError('invalid-argument', 'Maximum debt per player cannot be negative');
  }

  // Validate actionTimer
  if (settings.actionTimer !== undefined && settings.actionTimer <= 0) {
    throw new HttpsError('invalid-argument', 'Action timer must be positive');
  }

  // Validate blindIncreaseInterval
  if (settings.blindIncreaseInterval !== undefined && settings.blindIncreaseInterval <= 0) {
    throw new HttpsError('invalid-argument', 'Blind increase interval must be positive');
  }
}
