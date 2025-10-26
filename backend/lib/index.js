// src/functions/index.ts
import admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';

// src/functions/game/createTable.ts
import { HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

// src/functions/game/schemas.ts
import { Timestamp } from 'firebase-admin/firestore';
function createPlayerDocument(id, username, email) {
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
function createTableDocument(tableId, hostId, settings) {
  const defaultSettings = {
    maxPlayers: 10,
    minBuyIn: 100,
    maxStack: 2e3,
    maxDebtPerPlayer: 1e3,
    smallBlind: 5,
    bigBlind: 10,
    blindIncreaseInterval: 15,
    // minutes
    actionTimer: 30,
    // seconds
    showHandStrength: false,
  };
  const finalSettings = {
    ...defaultSettings,
    ...settings,
  };
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
function createLedgerEntry(playerId, type, amount, runningBalance, tableId = null) {
  return {
    id: '',
    // Will be set by Firestore auto-ID
    playerId,
    type,
    amount,
    tableId,
    timestamp: Timestamp.now(),
    runningBalance,
  };
}

// src/lib/utils/codeGenerator.ts
async function generateTableCode(db, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Math.floor(1e3 + Math.random() * 9e3).toString();
    const tableDoc = await db.collection('tables').doc(code).get();
    if (!tableDoc.exists) {
      return code;
    }
  }
  throw new Error(`Unable to generate unique table code after ${maxAttempts} attempts`);
}

// src/functions/game/createTable.ts
async function createTable(data, context) {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated to create a table');
  }
  const userId = context.auth.uid;
  const db = getFirestore();
  try {
    if (data.settings) {
      validateTableSettings(data.settings);
    }
    const tableId = await generateTableCode(db);
    const tableDoc = createTableDocument(tableId, userId, data.settings);
    await db.collection('tables').doc(tableId).set(tableDoc);
    return {
      success: true,
      tableId,
      message: 'Table created successfully',
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
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
    if (error instanceof Error && error.message.includes('Unable to generate')) {
      throw new HttpsError(
        'resource-exhausted',
        'Unable to generate unique table code. Please try again.'
      );
    }
    throw new HttpsError('internal', 'Failed to create table');
  }
}
function validateTableSettings(settings) {
  if (!settings) return;
  if (settings.maxPlayers !== void 0) {
    if (settings.maxPlayers < 2 || settings.maxPlayers > 10) {
      throw new HttpsError('invalid-argument', 'Max players must be between 2 and 10');
    }
  }
  if (settings.bigBlind !== void 0 && settings.bigBlind <= 0) {
    throw new HttpsError('invalid-argument', 'Big blind must be positive');
  }
  if (settings.smallBlind !== void 0 && settings.smallBlind <= 0) {
    throw new HttpsError('invalid-argument', 'Small blind must be positive');
  }
  if (
    settings.smallBlind !== void 0 &&
    settings.bigBlind !== void 0 &&
    settings.smallBlind >= settings.bigBlind
  ) {
    throw new HttpsError('invalid-argument', 'Small blind must be less than big blind');
  }
  if (settings.minBuyIn !== void 0 && settings.minBuyIn <= 0) {
    throw new HttpsError('invalid-argument', 'Minimum buy-in must be positive');
  }
  if (settings.maxStack !== void 0 && settings.maxStack <= 0) {
    throw new HttpsError('invalid-argument', 'Maximum stack must be positive');
  }
  if (
    settings.maxStack !== void 0 &&
    settings.minBuyIn !== void 0 &&
    settings.maxStack < settings.minBuyIn
  ) {
    throw new HttpsError(
      'invalid-argument',
      'Maximum stack must be greater than or equal to minimum buy-in'
    );
  }
  if (settings.maxDebtPerPlayer !== void 0 && settings.maxDebtPerPlayer < 0) {
    throw new HttpsError('invalid-argument', 'Maximum debt per player cannot be negative');
  }
  if (settings.actionTimer !== void 0 && settings.actionTimer <= 0) {
    throw new HttpsError('invalid-argument', 'Action timer must be positive');
  }
  if (settings.blindIncreaseInterval !== void 0 && settings.blindIncreaseInterval <= 0) {
    throw new HttpsError('invalid-argument', 'Blind increase interval must be positive');
  }
}

// src/functions/game/joinTable.ts
import { HttpsError as HttpsError2 } from 'firebase-functions/v2/https';
import {
  getFirestore as getFirestore2,
  Timestamp as Timestamp2,
  FieldValue,
} from 'firebase-admin/firestore';
async function joinTable(data, context) {
  if (!context.auth) {
    throw new HttpsError2('unauthenticated', 'User must be authenticated to join a table');
  }
  const userId = context.auth.uid;
  const { tableId, buyInAmount } = data;
  const db = getFirestore2();
  try {
    if (!/^\d{4}$/.test(tableId)) {
      throw new HttpsError2('invalid-argument', 'Table code must be a 4-digit number');
    }
    if (buyInAmount <= 0) {
      throw new HttpsError2('invalid-argument', 'Buy-in amount must be positive');
    }
    const result = await db.runTransaction(async transaction => {
      const tableRef = db.collection('tables').doc(tableId);
      const tableDoc = await transaction.get(tableRef);
      if (!tableDoc.exists) {
        throw new HttpsError2('not-found', 'Table not found');
      }
      const table = tableDoc.data();
      if (table.status === 'ended') {
        throw new HttpsError2('failed-precondition', 'Cannot join a table that has ended');
      }
      if (table.players.length >= table.settings.maxPlayers) {
        throw new HttpsError2('failed-precondition', 'Table is full');
      }
      if (table.players.some(p => p.id === userId)) {
        throw new HttpsError2('already-exists', 'You are already at this table');
      }
      if (buyInAmount < table.settings.minBuyIn) {
        throw new HttpsError2(
          'invalid-argument',
          `Buy-in amount must be at least ${table.settings.minBuyIn}`
        );
      }
      if (buyInAmount > table.settings.maxStack) {
        throw new HttpsError2(
          'invalid-argument',
          `Buy-in amount cannot exceed ${table.settings.maxStack}`
        );
      }
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
      const newBalance = currentBalance - buyInAmount;
      if (Math.abs(newBalance) > table.settings.maxDebtPerPlayer) {
        throw new HttpsError2(
          'permission-denied',
          `This purchase would exceed the maximum debt limit of ${table.settings.maxDebtPerPlayer}`
        );
      }
      const playerRef = db.collection('players').doc(userId);
      const playerDoc = await transaction.get(playerRef);
      const occupiedPositions = new Set(table.players.map(p => p.position));
      let position = 0;
      for (let i = 0; i < table.settings.maxPlayers; i++) {
        if (!occupiedPositions.has(i)) {
          position = i;
          break;
        }
      }
      const playerState = {
        id: userId,
        position,
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
      transaction.update(tableRef, {
        players: FieldValue.arrayUnion(playerState),
      });
      if (!playerDoc.exists) {
        const email = context.auth?.token?.email || `${userId}@unknown`;
        const username = context.auth?.token?.name || `Player ${userId.slice(0, 6)}`;
        const newPlayer = createPlayerDocument(userId, username, email);
        transaction.set(playerRef, newPlayer);
      } else {
        transaction.update(playerRef, {
          lastSeen: Timestamp2.now(),
        });
      }
      const ledgerEntry = createLedgerEntry(
        userId,
        'buy',
        -buyInAmount,
        // Negative for chip purchase
        newBalance,
        tableId
      );
      const ledgerRef = db.collection('ledger').doc(userId).collection('transactions').doc();
      transaction.set(ledgerRef, {
        ...ledgerEntry,
        id: ledgerRef.id,
      });
      return { position, newBalance };
    });
    return {
      success: true,
      position: result.position,
      message: 'Successfully joined table',
    };
  } catch (error) {
    if (error instanceof HttpsError2) {
      throw error;
    }
    console.error('Error joining table:', error);
    throw new HttpsError2('internal', 'Failed to join table');
  }
}

// src/functions/game/leaveTable.ts
import { HttpsError as HttpsError3 } from 'firebase-functions/v2/https';
import { getFirestore as getFirestore3, Timestamp as Timestamp3 } from 'firebase-admin/firestore';
async function leaveTable(data, context) {
  if (!context.auth) {
    throw new HttpsError3('unauthenticated', 'User must be authenticated to leave a table');
  }
  const userId = context.auth.uid;
  const { tableId } = data;
  const db = getFirestore3();
  try {
    if (!/^\d{4}$/.test(tableId)) {
      throw new HttpsError3('invalid-argument', 'Table code must be a 4-digit number');
    }
    const result = await db.runTransaction(async transaction => {
      const tableRef = db.collection('tables').doc(tableId);
      const tableDoc = await transaction.get(tableRef);
      if (!tableDoc.exists) {
        throw new HttpsError3('not-found', 'Table not found');
      }
      const table = tableDoc.data();
      const playerIndex = table.players.findIndex(p => p.id === userId);
      if (playerIndex === -1) {
        throw new HttpsError3('failed-precondition', 'You are not at this table');
      }
      const player = table.players[playerIndex];
      const chipsToCashOut = player.chips;
      const updatedPlayers = table.players.filter(p => p.id !== userId);
      if (table.hand && !player.isFolded) {
        console.log(`Player ${userId} auto-folded when leaving table ${tableId}`);
      }
      let newHostId = table.hostId;
      if (table.hostId === userId && updatedPlayers.length > 0) {
        newHostId = updatedPlayers[0].id;
        console.log(`Host transferred from ${userId} to ${newHostId}`);
      }
      const tableUpdate = {
        players: updatedPlayers,
        hostId: newHostId,
      };
      if (updatedPlayers.length === 0) {
        tableUpdate.status = 'ended';
      }
      transaction.update(tableRef, tableUpdate);
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
      const newBalance = currentBalance + chipsToCashOut;
      const ledgerEntry = createLedgerEntry(
        userId,
        'cashout',
        chipsToCashOut,
        // Positive for cash out
        newBalance,
        tableId
      );
      const ledgerRef = db.collection('ledger').doc(userId).collection('transactions').doc();
      transaction.set(ledgerRef, {
        ...ledgerEntry,
        id: ledgerRef.id,
      });
      const playerRef = db.collection('players').doc(userId);
      transaction.update(playerRef, {
        lastSeen: Timestamp3.now(),
      });
      return { chipsCashedOut: chipsToCashOut, newBalance };
    });
    return {
      success: true,
      chipsCashedOut: result.chipsCashedOut,
      message: `Successfully left table. Cashed out ${result.chipsCashedOut} chips.`,
    };
  } catch (error) {
    if (error instanceof HttpsError3) {
      throw error;
    }
    console.error('Error leaving table:', error);
    throw new HttpsError3('internal', 'Failed to leave table');
  }
}

// src/functions/index.ts
admin.initializeApp();
var createTableFunction = onCall({ cors: true }, async request => {
  return createTable(request.data, request);
});
var joinTableFunction = onCall({ cors: true }, async request => {
  return joinTable(request.data, request);
});
var leaveTableFunction = onCall({ cors: true }, async request => {
  return leaveTable(request.data, request);
});
export { createTableFunction, joinTableFunction, leaveTableFunction };
//# sourceMappingURL=index.js.map
