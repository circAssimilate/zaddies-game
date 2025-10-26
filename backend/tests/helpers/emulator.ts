/**
 * Firebase Emulator Test Helpers
 * Sets up connections to Firebase emulators for integration testing
 */

import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  type RulesTestContext,
} from '@firebase/rules-unit-testing';
import type { Firestore } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin';

let testEnv: RulesTestEnvironment | null = null;
let adminInitialized = false;

/**
 * Initialize Firebase Admin SDK to use emulators
 */
export function initializeAdminForEmulator(): void {
  if (adminInitialized) {
    return;
  }

  // Set emulator environment variables BEFORE initializing admin
  process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
  process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

  // Initialize Admin SDK
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: 'test-project',
    });
  }

  adminInitialized = true;
}

/**
 * Initialize test environment with Firebase emulators
 */
export async function setupTestEnvironment(): Promise<RulesTestEnvironment> {
  if (testEnv) {
    return testEnv;
  }

  // Initialize Admin SDK for emulator
  initializeAdminForEmulator();

  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      host: '127.0.0.1',
      port: 8080,
    },
  });

  return testEnv;
}

/**
 * Get authenticated test context
 */
export async function getAuthenticatedContext(userId: string): Promise<RulesTestContext> {
  const env = await setupTestEnvironment();
  return env.authenticatedContext(userId);
}

/**
 * Get unauthenticated test context
 */
export async function getUnauthenticatedContext(): Promise<RulesTestContext> {
  const env = await setupTestEnvironment();
  return env.unauthenticatedContext();
}

/**
 * Clear all Firestore data in test environment using Admin SDK
 */
export async function clearFirestore(): Promise<void> {
  initializeAdminForEmulator();
  const db = admin.firestore();

  // Clear ledger subcollections first (must be done before parent docs)
  const ledgerSnapshot = await db.collection('ledger').get();
  for (const doc of ledgerSnapshot.docs) {
    const transactionsSnapshot = await doc.ref.collection('transactions').get();
    const transBatch = db.batch();
    transactionsSnapshot.docs.forEach(transDoc => {
      transBatch.delete(transDoc.ref);
    });
    await transBatch.commit();
  }

  // Clear top-level collections
  const batch = db.batch();

  // Clear tables
  const tablesSnapshot = await db.collection('tables').get();
  tablesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear players
  const playersSnapshot = await db.collection('players').get();
  playersSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Clear ledger parent docs
  ledgerSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  // Small delay to ensure deletes are processed by emulator
  await new Promise(resolve => setTimeout(resolve, 100));
}

/**
 * Get Firestore instance for test context
 */
export function getFirestore(context: RulesTestContext): Firestore {
  return context.firestore() as unknown as Firestore;
}

/**
 * Cleanup test environment
 */
export async function cleanupTestEnvironment(): Promise<void> {
  if (testEnv) {
    await testEnv.cleanup();
    testEnv = null;
  }
}

/**
 * Helper to create mock auth context for Cloud Function calls
 */
export function createAuthContext(userId: string, email?: string, name?: string) {
  return {
    auth: {
      uid: userId,
      token: {
        email: email || `${userId}@test.com`,
        name: name || `Test User ${userId}`,
      },
    },
  };
}

/**
 * Helper to create unauthenticated context for Cloud Function calls
 */
export function createUnauthenticatedContext() {
  return {
    auth: undefined,
  };
}
