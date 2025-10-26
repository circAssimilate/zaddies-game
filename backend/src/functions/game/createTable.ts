/**
 * createTable Cloud Function
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * Creates a new poker table with unique 4-digit code and auto-joins the creator
 */

import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { CreateTableRequest, CreateTableResponse } from './types';
import { createTableDocument, createPlayerDocument, createLedgerEntry } from './schemas';
import { generateTableCode } from '../../lib/utils/codeGenerator';
import type { PlayerState } from '@shared/types/player';

/**
 * Create Table Function
 * @param data - CreateTableRequest
 * @param context - Call context with auth
 * @returns CreateTableResponse
 */
export async function createTable(
  data: CreateTableRequest,
  context: { auth?: { uid: string; token?: { email?: string; name?: string } } }
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

    // Auto-join the creator with minimum buy-in using a transaction
    const result = await db.runTransaction(async transaction => {
      const tableRef = db.collection('tables').doc(tableId);

      // Get player's current ledger balance
      const ledgerSnapshot = await transaction.get(
        db
          .collection('ledger')
          .doc(userId)
          .collection('transactions')
          .orderBy('timestamp', 'desc')
          .limit(1)
      );

      let currentBalance = 0;
      if (!ledgerSnapshot.empty) {
        const lastTransaction = ledgerSnapshot.docs[0].data();
        currentBalance = lastTransaction.runningBalance || 0;
      }

      // Use minimum buy-in for auto-join
      const buyInAmount = tableDoc.settings.minBuyIn;

      // Calculate new balance after purchase
      const newBalance = currentBalance - buyInAmount;

      // Validate debt limit
      if (Math.abs(newBalance) > tableDoc.settings.maxDebtPerPlayer) {
        throw new HttpsError(
          'permission-denied',
          `Creating this table would exceed the maximum debt limit of ${tableDoc.settings.maxDebtPerPlayer}`
        );
      }

      // Get player document
      const playerRef = db.collection('players').doc(userId);
      const playerDoc = await transaction.get(playerRef);

      // Create player state for the creator (position 0)
      const playerState: PlayerState = {
        id: userId,
        position: 0,
        chips: buyInAmount,
        status: 'sitting',
        isDealer: false,
        isSmallBlind: false,
        isBigBlind: false,
        currentBet: 0,
        hasActed: false,
        isFolded: false,
        isAllIn: false,
      };

      // Add player to table document
      const tableWithPlayer = {
        ...tableDoc,
        players: [playerState],
      };

      // Save table with creator as first player
      transaction.set(tableRef, tableWithPlayer);

      // Create or update player document
      if (!playerDoc.exists) {
        // Create new player document
        const email = context.auth?.token?.email || `${userId}@unknown`;
        const username = context.auth?.token?.name || `Player ${userId.slice(0, 6)}`;

        const newPlayer = createPlayerDocument(userId, username, email);
        transaction.set(playerRef, newPlayer);
      } else {
        // Update lastSeen timestamp
        transaction.update(playerRef, {
          lastSeen: Timestamp.now(),
        });
      }

      // Create ledger transaction
      const ledgerEntry = createLedgerEntry(
        userId,
        'buy',
        -buyInAmount, // Negative for chip purchase
        newBalance,
        tableId
      );

      const ledgerRef = db.collection('ledger').doc(userId).collection('transactions').doc();

      transaction.set(ledgerRef, {
        ...ledgerEntry,
        id: ledgerRef.id,
      });

      return { tableId, newBalance };
    });

    return {
      success: true,
      tableId: result.tableId,
      message: 'Table created successfully and you have been seated',
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
    console.error('Error creating table:', error);
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
