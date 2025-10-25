# Firestore Schema Contract

**Feature**: 001-texas-holdem-poker
**Date**: 2025-10-25
**Version**: 1.0.0

## Overview

This document defines the Firestore database schema as a contract between frontend and backend. All reads/writes must conform to these schemas. TypeScript interfaces are the source of truth.

## Collections

### `/players/{playerId}`

**Purpose**: User profile and authentication data

**Schema**:

```typescript
interface Player {
  id: string; // Firebase Auth UID (immutable)
  username: string; // Display name (mutable)
  email: string; // From Firebase Auth (immutable)
  createdAt: Timestamp; // Account creation (immutable)
  lastSeen: Timestamp; // Last login (mutable)
  stats?: {
    totalChipsBought: number;
    totalChipsCashedOut: number;
    handsPlayed: number;
  };
}
```

**Security Rules**:

```javascript
match /players/{playerId} {
  allow read: if request.auth.uid == playerId;
  allow create: if request.auth.uid == playerId;
  allow update: if request.auth.uid == playerId
                && request.resource.data.id == resource.data.id
                && request.resource.data.email == resource.data.email;
  allow delete: if false;
}
```

**Indexes**: None required (single document reads)

---

### `/ledger/{playerId}/transactions/{transactionId}`

**Purpose**: Immutable transaction history for debt tracking

**Schema**:

```typescript
interface LedgerEntry {
  id: string; // Auto-generated
  playerId: string; // Player reference
  type: 'buy' | 'cashout';
  amount: number; // Chips (buy=negative, cashout=positive)
  tableId: string | null;
  timestamp: Timestamp;
  runningBalance: number; // Cumulative balance
}
```

**Security Rules**:

```javascript
match /ledger/{playerId}/transactions/{transactionId} {
  allow read: if request.auth != null;  // All authenticated users can read (transparency)
  allow write: if false;  // Only backend functions
}
```

**Indexes**:

```json
{
  "collectionGroup": "transactions",
  "fields": [
    { "fieldPath": "playerId", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

---

### `/tables/{tableId}`

**Purpose**: Active game state with real-time synchronization

**Schema**: See data-model.md for complete `Table` interface

**Key Fields**:

- `id`: 4-digit string (e.g., "1234")
- `hostId`: Current host player ID
- `status`: 'waiting' | 'playing' | 'ended'
- `settings`: Table configuration
- `players`: Map of player states
- `hand`: Current hand state (null when not playing)

**Security Rules**:

```javascript
match /tables/{tableId} {
  // Players at table can read
  allow read: if request.auth.uid in resource.data.players;

  // Only backend functions can write
  allow write: if false;
}
```

**Indexes**:

```json
{
  "collectionGroup": "tables",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "createdAt", "order": "DESCENDING" }
  ]
}
```

---

### `/tables/{tableId}/hands/{handNumber}/playerHands/{playerId}`

**Purpose**: Private hole cards for security

**Schema**:

```typescript
interface PlayerHand {
  playerId: string;
  holeCards: [Card, Card];
  handNumber: number;
}
```

**Security Rules**:

```javascript
match /tables/{tableId}/hands/{handNumber}/playerHands/{playerId} {
  // Only the player can read their own hole cards
  allow read: if request.auth.uid == playerId;

  // Only backend functions can write
  allow write: if false;
}
```

**Indexes**: None (direct document access only)

---

### `/tables/{tableId}/history/{handNumber}`

**Purpose**: Completed hand records for transparency

**Schema**: See data-model.md for complete `HandHistoryEntry` interface

**Security Rules**:

```javascript
match /tables/{tableId}/history/{handNumber} {
  // Anyone at the table can read history
  allow read: if request.auth.uid in get(/databases/$(database)/documents/tables/$(tableId)).data.players;

  // Only backend functions can write
  allow write: if false;
}
```

**Indexes**:

```json
{
  "collectionGroup": "history",
  "fields": [{ "fieldPath": "handNumber", "order": "DESCENDING" }]
}
```

---

### `/shareableViews/{viewId}`

**Purpose**: Generated URLs for streaming/sharing

**Schema**:

```typescript
interface ShareableView {
  id: string;
  type: 'table' | 'hand';
  tableId: string;
  playerId: string | null;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  isPublic: boolean;
}
```

**Security Rules**:

```javascript
match /shareableViews/{viewId} {
  // Public views readable by anyone
  allow read: if resource.data.isPublic == true
              || request.auth.uid == resource.data.playerId;

  // Only backend functions can create
  allow create: if false;
  allow update, delete: if false;
}
```

**Indexes**: None required

---

## Real-Time Listeners

### Frontend Subscription Patterns

**Table State** (real-time):

```typescript
import { doc, onSnapshot } from 'firebase/firestore';

const unsubscribe = onSnapshot(
  doc(db, 'tables', tableId),
  snapshot => {
    const table = snapshot.data() as Table;
    updateUI(table);
  },
  error => {
    console.error('Table listener error:', error);
  }
);
```

**Player Hole Cards** (real-time):

```typescript
const unsubscribe = onSnapshot(
  doc(db, `tables/${tableId}/hands/${handNumber}/playerHands/${playerId}`),
  snapshot => {
    const playerHand = snapshot.data() as PlayerHand;
    displayHoleCards(playerHand.holeCards);
  }
);
```

**Ledger Transactions** (query):

```typescript
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const q = query(
  collection(db, `ledger/${playerId}/transactions`),
  orderBy('timestamp', 'desc'),
  limit(100)
);

const snapshot = await getDocs(q);
const transactions = snapshot.docs.map(doc => doc.data() as LedgerEntry);
```

---

## Write Operations (Backend Only)

All write operations are performed via Firebase Cloud Functions to ensure:

1. **Atomicity**: Transactions prevent race conditions
2. **Validation**: Server-side business logic enforcement
3. **Security**: Clients cannot manipulate game state

See `api-functions.md` for function contracts.

---

## Data Validation

### Server-Side Validation (Firebase Functions)

```typescript
// Example validation for table settings
function validateTableSettings(settings: Table['settings']): void {
  if (settings.maxPlayers < 2 || settings.maxPlayers > 10) {
    throw new Error('maxPlayers must be between 2 and 10');
  }

  if (settings.minBuyIn <= 0) {
    throw new Error('minBuyIn must be positive');
  }

  if (settings.smallBlind * 2 !== settings.bigBlind) {
    throw new Error('bigBlind must be 2x smallBlind');
  }

  if (settings.maxStack <= 0) {
    throw new Error('maxStack must be positive');
  }
}
```

### Client-Side Validation (Frontend)

```typescript
// Pre-validate before calling backend function
function validatePlayerAction(action: PlayerAction, table: Table): boolean {
  const player = table.players[action.playerId];

  if (!player || !player.isActive) {
    return false;
  }

  if (action.action === 'raise' && action.amount < table.hand.bettingRound.minRaise) {
    return false;
  }

  if (action.amount > player.chips) {
    return false; // Cannot bet more than you have
  }

  return true;
}
```

---

## Schema Versioning

**Current Version**: 1.0.0

**Migration Strategy**:

- Schema changes require MINOR version bump
- Breaking changes require MAJOR version bump
- Use Firestore document version field for migration tracking

**Future Considerations**:

- If schema changes, add `schemaVersion` field to documents
- Backend functions check version and apply migrations
- Client detects outdated schema and prompts refresh

---

## Performance Optimization

### Read Optimization

1. **Denormalization**: Player names embedded in table document
2. **Single Document Reads**: Table state in one document (not split)
3. **Listeners**: Use real-time listeners instead of polling

### Write Optimization

1. **Batch Writes**: Group related updates (e.g., pot distribution + ledger update)
2. **Transactions**: Atomic updates for consistency (e.g., player action + game state)
3. **Minimal Updates**: Only update changed fields (use `update()` not `set()`)

**Example Optimized Write**:

```typescript
await runTransaction(db, async transaction => {
  const tableRef = doc(db, 'tables', tableId);
  const table = await transaction.get(tableRef);

  // Only update specific fields
  transaction.update(tableRef, {
    'hand.currentPlayerPosition': nextPlayerPosition,
    'hand.pot': newPotAmount,
    [`players.${playerId}.chips`]: increment(-betAmount),
    updatedAt: serverTimestamp(),
  });
});
```

---

## Monitoring and Quotas

### Read/Write Tracking

Monitor Firestore usage in Firebase Console:

- **Target**: < 40K reads/day (80% of free tier limit)
- **Target**: < 15K writes/day (75% of free tier limit)

**Alert Triggers**:

- 80% of daily quota: Warning notification
- 90% of daily quota: Rate limiting consideration
- 95% of daily quota: Disable new table creation

### Storage Monitoring

- **Target**: < 800MB (80% of 1GB free tier)
- **Cleanup**: Auto-delete old hand history (keep last 50 hands per table)
- **Cleanup**: Delete ended tables after 7 days

---

## Summary

Firestore schema contract defines all data structures, security rules, indexes, and access patterns. All writes are server-authoritative via Cloud Functions. Real-time listeners provide responsive UI updates. Performance optimized for free tier Firebase usage.

**Contract Compliance**:

- ✅ All documents conform to TypeScript interfaces
- ✅ Security rules enforce read/write permissions
- ✅ Indexes support efficient queries
- ✅ Write operations are server-side only
- ✅ Performance targets within free tier limits

**Next**: See `api-functions.md` for Firebase Cloud Function contracts.
