# Data Model: Texas Hold'em Poker Game

**Feature**: 001-texas-holdem-poker
**Date**: 2025-10-25
**Storage**: Firebase Firestore (NoSQL document database)

## Overview

This document defines the data model for the poker game, optimized for Firebase Firestore's real-time synchronization capabilities. The model is denormalized for read performance and structured to support atomic transactions for game state updates.

## Design Principles

1. **Denormalization**: Embed frequently accessed data to minimize reads
2. **Atomic Updates**: Structure enables Firestore transactions for consistency
3. **Real-time Optimized**: Single document contains all data needed for UI rendering
4. **Security**: Sensitive data (hole cards) in separate subcollections with security rules
5. **Scalability**: Designed to stay within Firebase free tier limits

## Entities

### Player

Represents a user in the system with authentication and profile data.

**Collection**: `/players/{playerId}`

**Schema**:
```typescript
interface Player {
  id: string;                    // Firebase Auth UID
  username: string;              // Display name
  email: string;                 // From Firebase Auth
  createdAt: Timestamp;
  lastSeen: Timestamp;

  // Stats (optional for MVP)
  stats?: {
    totalChipsBought: number;
    totalChipsCashedOut: number;
    handsPlayed: number;
  };
}
```

**Validation Rules**:
- `id`: Required, matches Firebase Auth UID
- `username`: Required, 3-20 characters, alphanumeric + spaces
- `email`: Required, valid email format
- `createdAt`, `lastSeen`: Required, valid Firestore Timestamps

**State Transitions**:
- Created: On first authentication
- Updated: On each login (lastSeen), profile edits (username)
- Deleted: Never (soft delete if needed, but not in scope)

**Relationships**:
- One Player → Many Ledger Entries (via player ID)
- Many Players → Many Tables (via table membership)

---

### Ledger

Tracks chip transactions for transparency and debt accounting.

**Collection**: `/ledger/{playerId}/transactions/{transactionId}`

**Schema**:
```typescript
interface LedgerEntry {
  id: string;                    // Auto-generated
  playerId: string;              // Reference to Player
  type: 'buy' | 'cashout';       // Transaction type
  amount: number;                // Chip amount (positive for buy, negative for cashout)
  tableId: string | null;        // Table where transaction occurred (null for cashier)
  timestamp: Timestamp;
  runningBalance: number;        // Net debt (-) or credit (+) after this transaction
}
```

**Validation Rules**:
- `amount`: Must be > 0
- `type === 'buy'`: amount stored as negative (debt)
- `type === 'cashout'`: amount stored as positive (credit)
- `runningBalance`: Calculated server-side
- `tableId`: Optional, null for cashier transactions

**State Transitions**:
- Created: On chip buy or cash-out
- Updated: Never (immutable ledger)
- Deleted: Never (audit trail)

**Relationships**:
- Many Ledger Entries → One Player
- Ledger Entries may reference Table (optional)

**Aggregations**:
```typescript
// Computed on read
interface PlayerLedgerSummary {
  playerId: string;
  totalBought: number;          // Sum of all 'buy' transactions
  totalCashedOut: number;       // Sum of all 'cashout' transactions
  netBalance: number;           // totalCashedOut - totalBought (negative = owes money)
  transactionCount: number;
}
```

---

### Table

Represents a poker game instance with complete game state.

**Collection**: `/tables/{tableId}`

**Schema**:
```typescript
interface Table {
  id: string;                    // 4-digit code (e.g., "1234")
  hostId: string;                // Player ID of current host
  status: 'waiting' | 'playing' | 'ended';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Table configuration
  settings: {
    maxPlayers: number;          // Default 10
    minBuyIn: number;            // Chips required to sit down
    maxStack: number;            // Maximum chip stack (in big blinds, e.g., 200)
    maxDebtPerPlayer: number;    // Maximum debt allowed (default 1000)
    smallBlind: number;
    bigBlind: number;
    blindIncreaseInterval: number; // Minutes between blind increases
    actionTimer: number;         // Seconds per action
    showHandStrength: boolean;   // Show hand eval in personal view
  };

  // Players at table
  players: {
    [playerId: string]: {
      name: string;
      chips: number;             // Current chip stack
      position: number;          // Seat position (0-9)
      isSeated: boolean;         // True if seated, false if spectating
      isActive: boolean;         // True if in current hand
      hasActed: boolean;         // True if acted in current betting round
      currentBet: number;        // Chips bet in current round
      state: 'active' | 'folded' | 'allin' | 'waiting'; // Player hand state
      joinedAt: Timestamp;
    };
  };

  // Current hand state
  hand: Hand | null;             // Null when no hand in progress
}

interface Hand {
  handNumber: number;
  dealerPosition: number;        // Seat number of dealer button
  smallBlindPosition: number;
  bigBlindPosition: number;
  currentPlayerPosition: number; // Whose turn

  phase: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  pot: number;                   // Main pot
  sidePots: SidePot[];           // For all-in situations

  communityCards: Card[];        // 0-5 cards
  deck: Card[];                  // Remaining cards (server-side only)

  bettingRound: {
    currentBet: number;
    minRaise: number;
    playerActions: {
      [playerId: string]: 'fold' | 'call' | 'raise' | 'check' | 'allin';
    };
  };

  // Timing
  actionDeadline: Timestamp | null; // When current player must act
  blindIncreaseAt: Timestamp;    // When blinds increase next

  // History (for current hand only)
  actions: PlayerAction[];
}

interface Card {
  rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs';
}

interface SidePot {
  amount: number;
  eligiblePlayers: string[];     // Player IDs eligible to win this pot
}

interface PlayerAction {
  playerId: string;
  action: 'fold' | 'call' | 'raise' | 'check' | 'allin';
  amount: number;                // Bet amount (0 for fold/check)
  timestamp: Timestamp;
}
```

**Validation Rules**:
- `id`: Required, 4-digit numeric string, unique across active tables
- `settings.maxPlayers`: 2-10
- `settings.minBuyIn`: > 0
- `settings.maxStack`: > 0, typically in big blinds (e.g., 200 * bigBlind)
- `settings.blinds`: smallBlind = bigBlind / 2
- `players`: Max count = settings.maxPlayers
- `hand.communityCards`: Max 5 cards
- `hand.phase`: Must follow sequence (preflop → flop → turn → river → showdown)

**State Transitions**:
1. **Created** (`status: 'waiting'`): Host creates table
2. **Playing** (`status: 'playing'`): Host starts game with ≥2 players
3. **Ended** (`status: 'ended'`): All players leave or host ends game

**Hand Lifecycle**:
1. **Deal**: Create Hand, shuffle deck, deal hole cards, post blinds
2. **Preflop**: Betting round 1
3. **Flop**: Deal 3 community cards, betting round 2
4. **Turn**: Deal 1 community card, betting round 3
5. **River**: Deal 1 community card, betting round 4
6. **Showdown**: Evaluate hands, award pot(s)
7. **Cleanup**: Archive to HandHistory, reset for next hand

**Relationships**:
- One Table → Many Players (embedded)
- One Table → Many HandHistory entries
- Table references Players by ID

---

### PlayerHand

Stores private hole cards for each player. Separate subcollection for security.

**Collection**: `/tables/{tableId}/hands/{handNumber}/playerHands/{playerId}`

**Schema**:
```typescript
interface PlayerHand {
  playerId: string;
  holeCards: [Card, Card];       // Exactly 2 cards
  handNumber: number;            // Reference to parent Hand
}
```

**Validation Rules**:
- `holeCards`: Always exactly 2 cards
- Only readable by player with matching playerId (Firestore Security Rules)

**State Transitions**:
- Created: When hand is dealt
- Updated: Never (immutable once dealt)
- Deleted: When hand completes (moved to HandHistory if shown)

**Security**:
```javascript
// Firestore Security Rules
match /tables/{tableId}/hands/{handNumber}/playerHands/{playerId} {
  allow read: if request.auth.uid == playerId;
  allow write: if false; // Only backend functions
}
```

---

### HandHistory

Records completed hands for transparency and replay.

**Collection**: `/tables/{tableId}/history/{handNumber}`

**Schema**:
```typescript
interface HandHistoryEntry {
  handNumber: number;
  timestamp: Timestamp;

  // Final state
  pot: number;
  sidePots: SidePot[];
  communityCards: Card[];

  // Player results
  players: {
    [playerId: string]: {
      name: string;
      finalChips: number;        // Chip count after hand
      action: 'won' | 'lost' | 'folded';
      amountWon: number;         // 0 if not winner
      cards: Card[] | 'mucked';  // Shown cards or 'mucked'
      handRank: string | null;   // "Pair of Kings", "Flush", etc.
    };
  };

  // Action log
  actions: PlayerAction[];
}
```

**Validation Rules**:
- `handNumber`: Sequential, positive integer
- `communityCards`: 0-5 cards
- `players.cards`: Shown only if player reached showdown or chose to show

**State Transitions**:
- Created: When hand completes (showdown or all fold)
- Updated: Never (immutable history)
- Deleted: When table ends or history exceeds limit (keep last 50 hands)

**Relationships**:
- Many HandHistory → One Table

---

### ShareableView

Generates URLs for table and personal hand views.

**Collection**: `/shareableViews/{viewId}`

**Schema**:
```typescript
interface ShareableView {
  id: string;                    // Auto-generated unique ID
  type: 'table' | 'hand';
  tableId: string;
  playerId: string | null;       // Null for table view, playerId for hand view
  createdAt: Timestamp;
  expiresAt: Timestamp;          // Auto-delete after expiration (e.g., 24 hours)

  // Access control
  isPublic: boolean;             // If false, requires auth
}
```

**Validation Rules**:
- `type === 'table'`: playerId must be null
- `type === 'hand'`: playerId must be set
- `expiresAt`: createdAt + 24 hours (configurable)

**State Transitions**:
- Created: When player generates shareable link
- Updated: Never
- Deleted: Automatically via Firestore TTL or manual cleanup function

**Relationships**:
- Many ShareableViews → One Table
- ShareableView → One Player (for hand views)

---

## Firestore Indexes

Required composite indexes for efficient querying:

```json
{
  "indexes": [
    {
      "collectionGroup": "tables",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ledger",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "playerId", "order": "ASCENDING" },
        { "fieldPath": "timestamp", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "history",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "tableId", "order": "ASCENDING" },
        { "fieldPath": "handNumber", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Data Access Patterns

### Read Operations

1. **Load Table State** (real-time listener):
   ```typescript
   onSnapshot(doc(db, 'tables', tableId), (snapshot) => {
     const table = snapshot.data() as Table;
     // Render UI
   });
   ```

2. **Get Player Ledger**:
   ```typescript
   const ledgerQuery = query(
     collectionGroup(db, 'transactions'),
     where('playerId', '==', playerId),
     orderBy('timestamp', 'desc')
   );
   const snapshot = await getDocs(ledgerQuery);
   ```

3. **Get Hand History**:
   ```typescript
   const historyQuery = query(
     collection(db, `tables/${tableId}/history`),
     orderBy('handNumber', 'desc'),
     limit(50)
   );
   ```

### Write Operations

1. **Player Action** (Firebase Function):
   ```typescript
   await runTransaction(db, async (transaction) => {
     const tableRef = doc(db, 'tables', tableId);
     const table = await transaction.get(tableRef);

     // Validate action, update game state
     const updatedTable = processPlayerAction(table.data(), action);

     transaction.update(tableRef, updatedTable);
   });
   ```

2. **Buy Chips** (Firebase Function):
   ```typescript
   const batch = writeBatch(db);

   // Update player chips in table
   batch.update(doc(db, 'tables', tableId), {
     [`players.${playerId}.chips`]: increment(amount)
   });

   // Create ledger entry
   batch.set(doc(collection(db, `ledger/${playerId}/transactions`)), {
     type: 'buy',
     amount: -amount,
     tableId,
     timestamp: serverTimestamp(),
     runningBalance: newBalance
   });

   await batch.commit();
   ```

## Estimated Storage Usage

Based on 10 concurrent tables, 6 players each, 100 hands per session:

- **Players**: 50 players × 0.5KB = 25KB
- **Tables**: 10 tables × 50KB (with embedded players, hand state) = 500KB
- **Ledger**: 50 players × 100 transactions × 0.3KB = 1.5MB
- **HandHistory**: 10 tables × 50 hands × 5KB = 2.5MB
- **ShareableViews**: 50 views × 0.2KB = 10KB

**Total**: ~4.5MB per active session
**Monthly**: Assuming 20 sessions = 90MB (well within 1GB free tier)

## Denormalization Trade-offs

**Embedded Players in Table**:
- **Pros**: Single read for full table state, real-time updates, reduced queries
- **Cons**: Duplicate player names (acceptable for small scale)
- **Decision**: Denormalize - read performance critical for real-time gameplay

**Hand History Storage**:
- **Pros**: Complete audit trail, replay capability
- **Cons**: Storage accumulation
- **Decision**: Limit to last 50 hands per table, cleanup function for old tables

## Backup and Recovery

- **Firebase Backups**: Enable automatic daily backups (free tier: 7-day retention)
- **Critical Data**: Ledger transactions (immutable, full audit trail)
- **Non-Critical**: Active game state (ephemeral, recreatable)

## Summary

Data model optimized for Firebase Firestore real-time capabilities with denormalization for read performance. Security enforced via Firestore Rules for hole card privacy. Estimated storage well within free tier limits. All entities validated with clear state transitions and relationships.

**Next Steps**: Define API contracts (Firebase Functions and Firestore document schemas) in contracts/ directory.
