# Firebase Cloud Functions API Contract

**Feature**: 001-texas-holdem-poker
**Date**: 2025-10-25
**Version**: 1.0.0

## Overview

This document defines the Firebase Cloud Functions API contracts for game logic, cashier operations, and table management. All functions are HTTPS callable functions with type-safe contracts.

## Function Categories

1. **Table Management**: Create, join, configure tables
2. **Game Actions**: Player betting actions (fold, call, raise)
3. **Cashier**: Buy chips, cash out, view ledger
4. **Utility**: Generate shareable views, get hand history

---

## Table Management Functions

### `createTable`

Creates a new poker table with unique 4-digit code.

**Endpoint**: `https://us-central1-{project-id}.cloudfunctions.net/createTable`

**Request**:

```typescript
interface CreateTableRequest {
  settings?: Partial<TableSettings>; // Optional custom settings
}

interface TableSettings {
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
```

**Response**:

```typescript
interface CreateTableResponse {
  success: boolean;
  tableId: string; // 4-digit code (e.g., "1234")
  message: string;
}
```

**Errors**:

- `unauthenticated`: User not authenticated
- `resource-exhausted`: No available 4-digit codes (highly unlikely)
- `invalid-argument`: Invalid settings

**Example**:

```typescript
import { httpsCallable } from 'firebase/functions';

const createTable = httpsCallable(functions, 'createTable');
const result = await createTable({
  settings: {
    bigBlind: 20,
    smallBlind: 10,
    actionTimer: 45,
  },
});

console.log(`Table created: ${result.data.tableId}`);
```

---

### `joinTable`

Join an existing table with 4-digit code.

**Request**:

```typescript
interface JoinTableRequest {
  tableId: string; // 4-digit code
  buyInAmount: number; // Initial chips
}
```

**Response**:

```typescript
interface JoinTableResponse {
  success: boolean;
  position: number; // Assigned seat position (0-9)
  message: string;
}
```

**Errors**:

- `not-found`: Table doesn't exist
- `failed-precondition`: Table is full
- `invalid-argument`: buyInAmount < table.settings.minBuyIn
- `permission-denied`: Player has insufficient funds (ledger balance check)

**Validation**:

- Check table exists and status !== 'ended'
- Check player count < maxPlayers
- Check buyInAmount >= minBuyIn
- Check player ledger balance allows purchase (maxDebt limit)

---

### `leaveTable`

Leave a table (cash out chips automatically).

**Request**:

```typescript
interface LeaveTableRequest {
  tableId: string;
}
```

**Response**:

```typescript
interface LeaveTableResponse {
  success: boolean;
  chipsCashedOut: number;
  message: string;
}
```

**Side Effects**:

- Automatically fold if in active hand
- Cash out remaining chips to ledger
- If player was host, transfer to next player

---

### `updateTableSettings`

Update table configuration (host only).

**Request**:

```typescript
interface UpdateTableSettingsRequest {
  tableId: string;
  settings: Partial<TableSettings>;
}
```

**Response**:

```typescript
interface UpdateTableSettingsResponse {
  success: boolean;
  message: string;
}
```

**Errors**:

- `permission-denied`: Caller is not table host
- `failed-precondition`: Cannot update during active hand

---

### `startGame`

Start the game (host only, requires ≥2 players).

**Request**:

```typescript
interface StartGameRequest {
  tableId: string;
}
```

**Response**:

```typescript
interface StartGameResponse {
  success: boolean;
  handNumber: number; // First hand number (1)
  message: string;
}
```

**Side Effects**:

- Sets table.status = 'playing'
- Creates first hand, shuffles deck
- Deals hole cards, posts blinds

**Errors**:

- `permission-denied`: Not the host
- `failed-precondition`: < 2 players seated

---

## Game Action Functions

### `playerAction`

Execute a player action (fold, call, check, raise).

**Request**:

```typescript
interface PlayerActionRequest {
  tableId: string;
  action: 'fold' | 'call' | 'check' | 'raise' | 'allin';
  amount?: number; // Required for 'raise'
}
```

**Response**:

```typescript
interface PlayerActionResponse {
  success: boolean;
  newGameState: {
    phase: string; // Updated game phase
    pot: number;
    currentPlayer: string | null;
  };
  message: string;
}
```

**Validation**:

- Check it's player's turn (table.hand.currentPlayerPosition)
- Validate action is legal:
  - `call`: amount = currentBet - player.currentBet
  - `raise`: amount >= minRaise
  - `check`: currentBet === 0
  - `allin`: amount = player.chips
  - `fold`: always allowed

**Side Effects**:

- Update player state (chips, currentBet, hasActed)
- Update pot, sidePots if all-in
- Advance to next player or next phase
- If showdown, evaluate hands and distribute pot
- Record action in hand.actions

**Errors**:

- `permission-denied`: Not player's turn
- `invalid-argument`: Invalid action or amount
- `failed-precondition`: Hand not in progress

**Example**:

```typescript
const playerAction = httpsCallable(functions, 'playerAction');

// Raise to 50 chips
await playerAction({
  tableId: '1234',
  action: 'raise',
  amount: 50,
});
```

---

## Cashier Functions

### `buyChips`

Purchase chips and add to ledger as debt.

**Request**:

```typescript
interface BuyChipsRequest {
  amount: number;
  tableId?: string; // Optional: if buying at table
}
```

**Response**:

```typescript
interface BuyChipsResponse {
  success: boolean;
  newBalance: number; // Chips player now has
  ledgerBalance: number; // Running debt balance
  message: string;
}
```

**Validation**:

- Check amount > 0
- Check player ledger balance + amount <= maxDebtPerPlayer
- If tableId provided, check player is seated at table
- If at table, check newChips <= maxStack

**Side Effects**:

- Create ledger transaction (type: 'buy', amount: -amount)
- If at table, update table.players[playerId].chips

**Errors**:

- `invalid-argument`: amount <= 0
- `resource-exhausted`: Would exceed maxDebt limit

---

### `cashOut`

Cash out chips and reduce ledger debt.

**Request**:

```typescript
interface CashOutRequest {
  amount: number;
}
```

**Response**:

```typescript
interface CashOutResponse {
  success: boolean;
  newBalance: number;
  ledgerBalance: number;
  message: string;
}
```

**Validation**:

- Check player has sufficient chips (not seated at table)
- Check amount > 0

**Side Effects**:

- Create ledger transaction (type: 'cashout', amount: +amount)
- Reduce player chip balance

**Errors**:

- `failed-precondition`: Player is seated at a table
- `invalid-argument`: Insufficient chips

---

### `getLedger`

Get player's transaction history and summary.

**Request**:

```typescript
interface GetLedgerRequest {
  playerId?: string; // Optional: get another player's ledger (transparency)
  limit?: number; // Default: 100
}
```

**Response**:

```typescript
interface GetLedgerResponse {
  transactions: LedgerEntry[];
  summary: {
    totalBought: number;
    totalCashedOut: number;
    netBalance: number; // Positive = owed money, negative = owes money
    transactionCount: number;
  };
}
```

**Notes**:

- Ledger is public for transparency (all players can see all balances)
- Useful for settling up after game sessions

---

## Utility Functions

### `generateShareableView`

Generate URL for shareable table or hand view.

**Request**:

```typescript
interface GenerateShareableViewRequest {
  type: 'table' | 'hand';
  tableId: string;
  playerId?: string; // Required if type === 'hand'
}
```

**Response**:

```typescript
interface GenerateShareableViewResponse {
  success: boolean;
  viewId: string;
  url: string; // Full URL to shareable view
  expiresAt: Timestamp;
}
```

**Side Effects**:

- Creates ShareableView document
- Returns URL like: `https://{domain}/share/{viewId}`

---

### `getHandHistory`

Get hand history for a table.

**Request**:

```typescript
interface GetHandHistoryRequest {
  tableId: string;
  limit?: number; // Default: 50
}
```

**Response**:

```typescript
interface GetHandHistoryResponse {
  hands: HandHistoryEntry[];
  total: number;
}
```

---

## Background Functions

### `cleanupOldTables` (Scheduled)

Runs daily to delete ended tables older than 7 days.

**Trigger**: Firebase Scheduled Function (cron: `0 2 * * *` - 2 AM daily)

**Logic**:

```typescript
export const cleanupOldTables = functions.pubsub.schedule('0 2 * * *').onRun(async context => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const oldTables = await db
    .collection('tables')
    .where('status', '==', 'ended')
    .where('updatedAt', '<', Timestamp.fromMillis(sevenDaysAgo))
    .get();

  const batch = db.batch();
  oldTables.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  console.log(`Cleaned up ${oldTables.size} old tables`);
});
```

---

### `autoFoldOnTimeout` (Realtime Trigger)

Automatically folds player when action timer expires.

**Trigger**: Firestore onCreate for `/tables/{tableId}`

**Logic**:

```typescript
export const autoFoldOnTimeout = functions.firestore
  .document('tables/{tableId}')
  .onUpdate(async (change, context) => {
    const table = change.after.data() as Table;

    if (!table.hand || !table.hand.actionDeadline) {
      return;
    }

    const now = Date.now();
    const deadline = table.hand.actionDeadline.toMillis();

    if (now > deadline) {
      // Auto-fold current player
      const currentPlayerId = getCurrentPlayerId(table);
      await processPlayerAction(tableId, currentPlayerId, 'fold');
    }
  });
```

---

## Error Handling

### Standard Error Codes

All functions use Firebase Functions error codes:

```typescript
import { HttpsError } from 'firebase-functions/v2/https';

// Invalid input
throw new HttpsError('invalid-argument', 'Amount must be positive');

// User not authenticated
throw new HttpsError('unauthenticated', 'Must be signed in');

// Permission denied
throw new HttpsError('permission-denied', 'Only host can start game');

// Resource not found
throw new HttpsError('not-found', 'Table does not exist');

// Precondition failed
throw new HttpsError('failed-precondition', 'Table is full');

// Quota exceeded
throw new HttpsError('resource-exhausted', 'Maximum debt limit reached');
```

### Client Error Handling

```typescript
try {
  const result = await createTable({ settings: { bigBlind: 20 } });
} catch (error) {
  if (error.code === 'unauthenticated') {
    // Redirect to login
  } else if (error.code === 'invalid-argument') {
    // Show validation error
    console.error(error.message);
  } else {
    // Generic error
    console.error('Unexpected error:', error);
  }
}
```

---

## Rate Limiting

### Firebase Functions Quotas (Free Tier)

- **Invocations**: 125,000/month
- **Compute Time**: 40,000 GB-seconds/month
- **Egress**: 5GB/month

**Expected Usage** (10 concurrent tables, 6 players each, 1 hour sessions):

- createTable: ~10/day
- joinTable: ~60/day
- playerAction: ~600/day (10 actions per hand × 10 hands per player × 6 players)
- buyChips/cashOut: ~100/day

**Total**: ~770 invocations/day = 23,100/month (well within limits)

### Rate Limiting Implementation

For abuse prevention:

```typescript
// Simple rate limiter (per-player)
const rateLimits = new Map<string, number[]>();

function checkRateLimit(
  playerId: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const requests = rateLimits.get(playerId) || [];

  // Remove old requests outside window
  const recentRequests = requests.filter(time => now - time < windowMs);

  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  recentRequests.push(now);
  rateLimits.set(playerId, recentRequests);
  return true;
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

Test business logic in isolation:

```typescript
// backend/tests/unit/gameEngine.test.ts
import { describe, it, expect } from 'vitest';
import { processPlayerAction } from '../../src/lib/poker/gameEngine';

describe('Game Engine', () => {
  it('should fold player and advance to next', async () => {
    const table = createMockTable();
    const result = await processPlayerAction(table, 'player1', 'fold');

    expect(result.players.player1.state).toBe('folded');
    expect(result.hand.currentPlayerPosition).toBe(1); // Next player
  });
});
```

### Integration Tests (Firebase Emulator)

Test functions against emulated Firestore:

```typescript
// backend/tests/integration/createTable.test.ts
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('createTable function', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        host: 'localhost',
        port: 8080,
      },
    });
  });

  it('should create table with unique code', async () => {
    const createTable = testEnv.wrap(functions.createTable);
    const result = await createTable({ settings: {} });

    expect(result.data.success).toBe(true);
    expect(result.data.tableId).toMatch(/^\d{4}$/);
  });
});
```

---

## Deployment

### GitHub Actions CI/CD

On push/merge to `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Firebase

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: zaddies-game
```

**Required Secrets**:

- `FIREBASE_SERVICE_ACCOUNT`: Service account JSON for deployment

---

## Summary

API contract defines all Firebase Cloud Functions with type-safe interfaces, error handling, rate limiting, and deployment via GitHub Actions. All game logic is server-authoritative. Testing strategy uses Vitest + Firebase Emulator.

**Contract Compliance**:

- ✅ All functions have TypeScript contracts
- ✅ Error codes standardized
- ✅ Rate limiting implemented
- ✅ Testing strategy defined
- ✅ GitHub Actions deployment configured

**Next**: See `quickstart.md` for development setup and deployment instructions.
