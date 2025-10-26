/**
 * Firebase Emulator Seed Data Script
 *
 * Populates the Firebase emulators with test data for development and testing.
 *
 * Usage:
 *   pnpm run seed-emulator
 *
 * Prerequisites:
 *   - Firebase emulators must be running (firebase emulators:start)
 *   - Run this script while emulators are active
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { Player, LedgerEntry } from '../../shared/types/player';
import type { Table, TableSettings } from '../../shared/types/table';
import type { PlayerState } from '../../shared/types/player';

// Initialize Firebase Admin SDK for emulators
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({ projectId: 'zaddies-game-demo' });
const db = getFirestore(app);

/**
 * Seed data configuration
 */
const SEED_PLAYERS = [
  {
    id: 'player-alice',
    username: 'Alice',
    email: 'alice@test.com',
  },
  {
    id: 'player-bob',
    username: 'Bob',
    email: 'bob@test.com',
  },
  {
    id: 'player-charlie',
    username: 'Charlie',
    email: 'charlie@test.com',
  },
  {
    id: 'player-diana',
    username: 'Diana',
    email: 'diana@test.com',
  },
  {
    id: 'player-eve',
    username: 'Eve',
    email: 'eve@test.com',
  },
];

const DEFAULT_TABLE_SETTINGS: TableSettings = {
  maxPlayers: 10,
  minBuyIn: 100,
  maxStack: 2000,
  maxDebtPerPlayer: 1000,
  smallBlind: 5,
  bigBlind: 10,
  blindIncreaseInterval: 15,
  actionTimer: 30,
  showHandStrength: false,
};

/**
 * Clear all existing data from emulator
 */
async function clearExistingData(): Promise<void> {
  console.log('🗑️  Clearing existing data...');

  const collections = ['players', 'tables', 'ledger'];

  for (const collectionName of collections) {
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`   ✓ Cleared ${snapshot.size} documents from ${collectionName}`);
  }
}

/**
 * Seed players collection
 */
async function seedPlayers(): Promise<void> {
  console.log('👥 Seeding players...');

  const batch = db.batch();
  const now = Timestamp.now();

  for (const seedPlayer of SEED_PLAYERS) {
    const player: Omit<Player, 'createdAt' | 'lastSeen'> & {
      createdAt: Timestamp;
      lastSeen: Timestamp;
    } = {
      id: seedPlayer.id,
      username: seedPlayer.username,
      email: seedPlayer.email,
      createdAt: now,
      lastSeen: now,
      stats: {
        totalChipsBought: 0,
        totalChipsCashedOut: 0,
        handsPlayed: 0,
      },
    };

    const playerRef = db.collection('players').doc(seedPlayer.id);
    batch.set(playerRef, player);
  }

  await batch.commit();
  console.log(`   ✓ Created ${SEED_PLAYERS.length} test players`);
}

/**
 * Seed tables collection
 */
async function seedTables(): Promise<void> {
  console.log('🎲 Seeding tables...');

  const now = Timestamp.now();

  // Table 1: Waiting for players (lobby state)
  const table1Players: PlayerState[] = [
    {
      id: 'player-alice',
      position: 0,
      chips: 500,
      status: 'sitting',
      isDealer: true,
      isSmallBlind: false,
      isBigBlind: false,
      currentBet: 0,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
    },
    {
      id: 'player-bob',
      position: 1,
      chips: 500,
      status: 'sitting',
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: false,
      currentBet: 0,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
    },
  ];

  const table1: Omit<Table, 'createdAt' | 'updatedAt'> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } = {
    id: '1234',
    hostId: 'player-alice',
    status: 'waiting',
    createdAt: now,
    updatedAt: now,
    settings: DEFAULT_TABLE_SETTINGS,
    players: table1Players,
    hand: null,
  };

  await db.collection('tables').doc('1234').set(table1);
  console.log('   ✓ Created table 1234 (waiting state)');

  // Table 2: Active game in progress
  const table2Players: PlayerState[] = [
    {
      id: 'player-charlie',
      position: 0,
      chips: 450,
      status: 'playing',
      isDealer: true,
      isSmallBlind: false,
      isBigBlind: false,
      currentBet: 0,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
    },
    {
      id: 'player-diana',
      position: 1,
      chips: 495,
      status: 'playing',
      isDealer: false,
      isSmallBlind: true,
      isBigBlind: false,
      currentBet: 5,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
    },
    {
      id: 'player-eve',
      position: 2,
      chips: 490,
      status: 'playing',
      isDealer: false,
      isSmallBlind: false,
      isBigBlind: true,
      currentBet: 10,
      hasActed: false,
      isFolded: false,
      isAllIn: false,
    },
  ];

  const table2: Omit<Table, 'createdAt' | 'updatedAt'> & {
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } = {
    id: '5678',
    hostId: 'player-charlie',
    status: 'playing',
    createdAt: now,
    updatedAt: now,
    settings: DEFAULT_TABLE_SETTINGS,
    players: table2Players,
    hand: {
      handNumber: 1,
      dealerPosition: 0,
      smallBlindPosition: 1,
      bigBlindPosition: 2,
      currentPlayerPosition: 0,
      phase: 'preflop',
      pot: 15,
      sidePots: [],
      communityCards: [],
      deck: [], // Would be populated with shuffled cards in real game
      bettingRound: {
        currentBet: 10,
        minRaise: 10,
        playerActions: {},
      },
      actionDeadline: Timestamp.fromDate(new Date(Date.now() + 30000)),
      blindIncreaseAt: Timestamp.fromDate(new Date(Date.now() + 15 * 60 * 1000)),
      actions: [],
    },
  };

  await db.collection('tables').doc('5678').set(table2);
  console.log('   ✓ Created table 5678 (active game)');
}

/**
 * Seed ledger entries
 */
async function seedLedger(): Promise<void> {
  console.log('💰 Seeding ledger entries...');

  const now = Timestamp.now();
  let count = 0;

  // Alice's ledger
  const aliceLedger1: Omit<LedgerEntry, 'timestamp'> & { timestamp: Timestamp } = {
    id: 'ledger-alice-1',
    playerId: 'player-alice',
    type: 'buy',
    amount: 500,
    tableId: '1234',
    timestamp: now,
    runningBalance: -500,
  };

  await db
    .collection('ledger')
    .doc('player-alice')
    .collection('transactions')
    .doc('ledger-alice-1')
    .set(aliceLedger1);
  count++;

  // Bob's ledger
  const bobLedger1: Omit<LedgerEntry, 'timestamp'> & { timestamp: Timestamp } = {
    id: 'ledger-bob-1',
    playerId: 'player-bob',
    type: 'buy',
    amount: 500,
    tableId: '1234',
    timestamp: now,
    runningBalance: -500,
  };

  await db
    .collection('ledger')
    .doc('player-bob')
    .collection('transactions')
    .doc('ledger-bob-1')
    .set(bobLedger1);
  count++;

  // Charlie's ledger (multiple transactions)
  const charlieLedger1: Omit<LedgerEntry, 'timestamp'> & { timestamp: Timestamp } = {
    id: 'ledger-charlie-1',
    playerId: 'player-charlie',
    type: 'buy',
    amount: 500,
    tableId: '5678',
    timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
    runningBalance: -500,
  };

  const charlieLedger2: Omit<LedgerEntry, 'timestamp'> & { timestamp: Timestamp } = {
    id: 'ledger-charlie-2',
    playerId: 'player-charlie',
    type: 'cashout',
    amount: 200,
    tableId: null,
    timestamp: Timestamp.fromDate(new Date(Date.now() - 1800000)), // 30 min ago
    runningBalance: -300,
  };

  await db
    .collection('ledger')
    .doc('player-charlie')
    .collection('transactions')
    .doc('ledger-charlie-1')
    .set(charlieLedger1);

  await db
    .collection('ledger')
    .doc('player-charlie')
    .collection('transactions')
    .doc('ledger-charlie-2')
    .set(charlieLedger2);
  count += 2;

  // Diana's ledger
  const dianaLedger1: Omit<LedgerEntry, 'timestamp'> & { timestamp: Timestamp } = {
    id: 'ledger-diana-1',
    playerId: 'player-diana',
    type: 'buy',
    amount: 500,
    tableId: '5678',
    timestamp: now,
    runningBalance: -500,
  };

  await db
    .collection('ledger')
    .doc('player-diana')
    .collection('transactions')
    .doc('ledger-diana-1')
    .set(dianaLedger1);
  count++;

  // Eve's ledger
  const eveLedger1: Omit<LedgerEntry, 'timestamp'> & { timestamp: Timestamp } = {
    id: 'ledger-eve-1',
    playerId: 'player-eve',
    type: 'buy',
    amount: 500,
    tableId: '5678',
    timestamp: now,
    runningBalance: -500,
  };

  await db
    .collection('ledger')
    .doc('player-eve')
    .collection('transactions')
    .doc('ledger-eve-1')
    .set(eveLedger1);
  count++;

  console.log(`   ✓ Created ${count} ledger entries`);
}

/**
 * Main seed function
 */
async function seedEmulator(): Promise<void> {
  console.log('\n🌱 Starting Firebase Emulator Seeding\n');

  try {
    await clearExistingData();
    console.log();

    await seedPlayers();
    console.log();

    await seedTables();
    console.log();

    await seedLedger();
    console.log();

    console.log('✅ Seeding completed successfully!\n');
    console.log('📊 Seed Data Summary:');
    console.log('   - Players: 5 (Alice, Bob, Charlie, Diana, Eve)');
    console.log('   - Tables: 2');
    console.log('     • Table 1234: Waiting lobby (Alice, Bob)');
    console.log('     • Table 5678: Active game (Charlie, Diana, Eve)');
    console.log('   - Ledger entries: 6 transactions');
    console.log('\n🌐 Access Emulator UI: http://localhost:4000');
    console.log('   - Firestore: http://localhost:4000/firestore');
    console.log('   - Auth: http://localhost:4000/auth\n');
  } catch (error) {
    console.error('\n❌ Error seeding data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the seeder
seedEmulator();
