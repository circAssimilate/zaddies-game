import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import {
  setupTestEnvironment,
  clearFirestore,
  createAuthContext,
  createUnauthenticatedContext,
  initializeAdminForEmulator,
} from '../helpers/emulator';
import { createTable } from '../../src/functions/game/createTable';
import { joinTable } from '../../src/functions/game/joinTable';
import type { CreateTableRequest, JoinTableRequest } from '../../src/functions/game/types';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Combined Integration Tests for Table Management
 * Tests createTable and joinTable Cloud Functions
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * REQUIRES: Firebase emulators running (firestore on port 8080)
 */

describe('Table Management Integration Tests', () => {
  beforeEach(async () => {
    await setupTestEnvironment();
    await clearFirestore();
    initializeAdminForEmulator();
  });

  afterAll(async () => {
    await clearFirestore();
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  describe('createTable', () => {
    it('should create table with default settings', async () => {
      const userId = 'test-user-1';
      const request: CreateTableRequest = {};
      const context = createAuthContext(userId);

      const response = await createTable(request, context);

      expect(response.success).toBe(true);
      expect(response.tableId).toMatch(/^\d{4}$/);
      expect(response.message).toBeTruthy();

      const db = getFirestore();
      const tableDoc = await db.collection('tables').doc(response.tableId).get();
      expect(tableDoc.exists).toBe(true);

      const tableData = tableDoc.data();
      expect(tableData?.hostId).toBe(userId);
      expect(tableData?.status).toBe('waiting');
      expect(tableData?.players).toEqual([]);
    });

    it('should create table with custom settings', async () => {
      const userId = 'test-user-2';
      const request: CreateTableRequest = {
        settings: {
          bigBlind: 20,
          smallBlind: 10,
          maxPlayers: 6,
          actionTimer: 45,
        },
      };
      const context = createAuthContext(userId);

      const response = await createTable(request, context);

      expect(response.success).toBe(true);
      expect(response.tableId).toMatch(/^\d{4}$/);

      const db = getFirestore();
      const tableDoc = await db.collection('tables').doc(response.tableId).get();
      const tableData = tableDoc.data();

      expect(tableData?.settings.bigBlind).toBe(20);
      expect(tableData?.settings.smallBlind).toBe(10);
      expect(tableData?.settings.maxPlayers).toBe(6);
      expect(tableData?.settings.actionTimer).toBe(45);
    });

    it('should generate unique 4-digit codes for multiple tables', async () => {
      const userId = 'test-user-3';
      const tableIds = new Set<string>();
      const context = createAuthContext(userId);

      for (let i = 0; i < 5; i++) {
        const response = await createTable({}, context);
        tableIds.add(response.tableId);
      }

      expect(tableIds.size).toBe(5);
      tableIds.forEach(id => {
        expect(id).toMatch(/^\d{4}$/);
      });
    });

    it('should fail when unauthenticated', async () => {
      const request: CreateTableRequest = {};
      const context = createUnauthenticatedContext();

      await expect(createTable(request, context)).rejects.toThrow('User must be authenticated');
    });

    it('should fail with invalid maxPlayers', async () => {
      const userId = 'test-user-4';
      const request: CreateTableRequest = {
        settings: {
          maxPlayers: 1,
        },
      };
      const context = createAuthContext(userId);

      await expect(createTable(request, context)).rejects.toThrow(
        'Max players must be between 2 and 10'
      );
    });

    it('should fail when smallBlind > bigBlind', async () => {
      const userId = 'test-user-5';
      const request: CreateTableRequest = {
        settings: {
          smallBlind: 20,
          bigBlind: 10,
        },
      };
      const context = createAuthContext(userId);

      await expect(createTable(request, context)).rejects.toThrow();
    });

    it('should create table with correct schema', async () => {
      const userId = 'test-user-6';
      const request: CreateTableRequest = {};
      const context = createAuthContext(userId);

      const response = await createTable(request, context);

      const db = getFirestore();
      const tableDoc = await db.collection('tables').doc(response.tableId).get();
      const tableData = tableDoc.data();

      expect(tableData).toMatchObject({
        id: response.tableId,
        hostId: userId,
        status: 'waiting',
        players: [],
      });

      expect(tableData?.settings).toHaveProperty('maxPlayers');
      expect(tableData?.settings).toHaveProperty('smallBlind');
      expect(tableData?.settings).toHaveProperty('bigBlind');
      expect(tableData?.settings).toHaveProperty('minBuyIn');
      expect(tableData?.settings).toHaveProperty('actionTimer');
    });
  });

  describe('joinTable', () => {
    async function createTestTable(settings?: CreateTableRequest): Promise<string> {
      const hostContext = createAuthContext(`host-${Date.now()}`);
      const response = await createTable(settings || {}, hostContext);
      return response.tableId;
    }

    it('should join table with valid buy-in amount', async () => {
      const tableId = await createTestTable();
      const userId = `test-player-1-${Date.now()}`;
      const request: JoinTableRequest = {
        tableId,
        buyInAmount: 100,
      };
      const context = createAuthContext(userId);

      const response = await joinTable(request, context);

      expect(response.success).toBe(true);
      expect(response.position).toBeGreaterThanOrEqual(0);
      expect(response.position).toBeLessThan(10);
      expect(response.message).toBeTruthy();

      await new Promise(resolve => setTimeout(resolve, 50));

      const db = getFirestore();
      const tableDoc = await db.collection('tables').doc(tableId).get();
      const tableData = tableDoc.data();

      expect(tableData?.players.length).toBe(1);
      expect(tableData?.players[0].id).toBe(userId);
      expect(tableData?.players[0].chips).toBe(100);
      expect(tableData?.players[0].position).toBe(response.position);
    });

    it('should assign sequential seat positions', async () => {
      const tableId = await createTestTable();
      const timestamp = Date.now();
      const player1Id = `player-${timestamp}-1`;
      const player2Id = `player-${timestamp}-2`;

      const response1 = await joinTable(
        { tableId, buyInAmount: 100 },
        createAuthContext(player1Id)
      );

      const response2 = await joinTable(
        { tableId, buyInAmount: 100 },
        createAuthContext(player2Id)
      );

      expect(response1.position).toBe(0);
      expect(response2.position).toBe(1);

      const db = getFirestore();
      const tableDoc = await db.collection('tables').doc(tableId).get();
      const tableData = tableDoc.data();

      expect(tableData?.players.length).toBe(2);
      expect(tableData?.players[0].position).toBe(0);
      expect(tableData?.players[1].position).toBe(1);
    });

    it('should join with buy-in amount greater than minimum', async () => {
      const tableId = await createTestTable();
      const userId = `test-player-${Date.now()}-2`;
      const request: JoinTableRequest = {
        tableId,
        buyInAmount: 500,
      };
      const context = createAuthContext(userId);

      const response = await joinTable(request, context);

      expect(response.success).toBe(true);

      const db = getFirestore();
      const tableDoc = await db.collection('tables').doc(tableId).get();
      const tableData = tableDoc.data();

      expect(tableData?.players[0].chips).toBe(500);
    });

    it('should fail with not-found when table does not exist', async () => {
      const request: JoinTableRequest = {
        tableId: '9999',
        buyInAmount: 100,
      };
      const context = createAuthContext('test-user');

      await expect(joinTable(request, context)).rejects.toThrow('Table not found');
    });

    it('should fail when table is full', async () => {
      const timestamp = Date.now();
      const hostContext = createAuthContext(`host-user-${timestamp}`);
      const createResponse = await createTable({ settings: { maxPlayers: 2 } }, hostContext);
      const fullTableId = createResponse.tableId;

      await joinTable(
        { tableId: fullTableId, buyInAmount: 100 },
        createAuthContext(`player-${timestamp}-1`)
      );
      await joinTable(
        { tableId: fullTableId, buyInAmount: 100 },
        createAuthContext(`player-${timestamp}-2`)
      );

      await expect(
        joinTable(
          { tableId: fullTableId, buyInAmount: 100 },
          createAuthContext(`player-${timestamp}-3`)
        )
      ).rejects.toThrow('Table is full');
    });

    it('should fail with invalid buy-in amount', async () => {
      const tableId = await createTestTable();
      const request: JoinTableRequest = {
        tableId,
        buyInAmount: 50,
      };
      const context = createAuthContext('test-user');

      await expect(joinTable(request, context)).rejects.toThrow('Buy-in amount must be at least');
    });

    it('should fail when unauthenticated', async () => {
      const tableId = await createTestTable();
      const request: JoinTableRequest = {
        tableId,
        buyInAmount: 100,
      };
      const context = createUnauthenticatedContext();

      await expect(joinTable(request, context)).rejects.toThrow('User must be authenticated');
    });

    it('should fail when player already at table', async () => {
      const tableId = await createTestTable();
      const userId = `test-player-duplicate-${Date.now()}`;
      const request: JoinTableRequest = {
        tableId,
        buyInAmount: 100,
      };
      const context = createAuthContext(userId);

      await joinTable(request, context);

      await expect(joinTable(request, context)).rejects.toThrow('You are already at this table');
    });

    it('should fail with invalid table code format', async () => {
      const request: JoinTableRequest = {
        tableId: 'ABC',
        buyInAmount: 100,
      };
      const context = createAuthContext('test-user');

      await expect(joinTable(request, context)).rejects.toThrow(
        'Table code must be a 4-digit number'
      );
    });

    it('should create ledger transaction on successful join', async () => {
      const tableId = await createTestTable();
      const userId = `test-player-ledger-${Date.now()}`;
      const request: JoinTableRequest = {
        tableId,
        buyInAmount: 200,
      };
      const context = createAuthContext(userId);

      await joinTable(request, context);

      const db = getFirestore();
      const ledgerSnapshot = await db
        .collection('ledger')
        .doc(userId)
        .collection('transactions')
        .get();

      expect(ledgerSnapshot.empty).toBe(false);

      const transaction = ledgerSnapshot.docs[0].data();
      expect(transaction.type).toBe('buy');
      expect(transaction.amount).toBe(-200);
      expect(transaction.tableId).toBe(tableId);
    });
  });
});
