# Research: Texas Hold'em Poker Game

**Feature**: 001-texas-holdem-poker
**Date**: 2025-10-25
**Status**: Complete

## Overview

This document captures research findings for implementing a web-based Texas Hold'em poker game using Firebase, TypeScript, React, and Vite. Research focuses on real-time multiplayer architecture, poker game logic implementation, color blind accessibility, and cost-effective Firebase usage patterns.

## Technology Decisions

### 1. Firebase for Real-Time Multiplayer

**Decision**: Use Firebase Firestore for real-time game state synchronization and Firebase Authentication for player identity.

**Rationale**:

- **Real-time Updates**: Firestore provides built-in real-time listeners that automatically sync game state across all connected clients without custom WebSocket implementation
- **Offline Support**: Firebase SDK handles offline scenarios with automatic reconnection
- **Security**: Firestore Security Rules provide server-side authorization without custom middleware
- **Serverless Backend**: Firebase Functions eliminate need for dedicated server infrastructure
- **Free Tier**: Spark plan supports small friend-group usage (50K reads/day, 20K writes/day, 10GB storage)
- **Scalability**: Can upgrade to Blaze plan (pay-as-you-go) if usage grows, but optimize for free tier

**Alternatives Considered**:

- **Socket.io + Node.js server**: More control but requires server management, higher complexity, hosting costs
- **Supabase**: Similar real-time features but less mature ecosystem, PostgreSQL may be overkill
- **PeerJS/WebRTC**: Peer-to-peer would eliminate server costs but complex NAT traversal, no authoritative server

**Implementation Notes**:

- Use Firestore transactions for atomic game state updates (prevent race conditions)
- Implement optimistic UI updates for responsiveness
- Structure Firestore documents for efficient querying (denormalize where beneficial)
- Use Firebase Emulator Suite for local development (free, offline testing)

### 2. Gilbert-Shannon-Reeds Shuffling Algorithm

**Decision**: Implement Gilbert-Shannon-Reeds (GSR) model for card shuffling in backend.

**Rationale**:

- **Realism**: GSR model simulates physical riffle shuffles, matching real casino shuffling
- **Mathematical Soundness**: Proven to produce statistically random permutations after 7 shuffles
- **Fairness**: Eliminates bias from poor shuffling algorithms (e.g., naive Fisher-Yates with weak PRNG)
- **Trust**: Players trust game fairness when shuffling matches real-world expectations

**Alternatives Considered**:

- **Fisher-Yates shuffle**: Simpler but doesn't model physical shuffling behavior
- **Crypto.getRandomValues()**: Good for randomness but doesn't provide GSR realism
- **Third-party RNG service**: Adds dependency, latency, potential costs

**Implementation Notes**:

```typescript
// backend/src/lib/poker/shuffler.ts
export function gilbertShannonReedsShuff(deck: Card[]): Card[] {
  const numShuffles = 7; // Standard number for full randomization
  let shuffled = [...deck];

  for (let i = 0; i < numShuffles; i++) {
    shuffled = riffleShuffle(shuffled);
  }

  return shuffled;
}

function riffleShuffle(deck: Card[]): Card[] {
  // Split deck at random point (binomial distribution)
  const splitPoint = binomialSplit(deck.length);
  const left = deck.slice(0, splitPoint);
  const right = deck.slice(splitPoint);

  // Interleave cards with realistic drop patterns
  return interleaveCards(left, right);
}
```

**References**:

- "Trailing the Dovetail Shuffle to its Lair" (Bayer & Diaconis, 1992)
- https://en.wikipedia.org/wiki/Gilbert%E2%80%93Shannon%E2%80%93Reeds_model

### 3. Color Blind Accessibility

**Decision**: Use color blind friendly palette with distinct hues and non-color-dependent suit identification.

**Rationale**:

- **Inclusivity**: ~8% of males have some form of color blindness (red-green most common)
- **Requirement**: Spec mandates 100% color blind accessibility
- **Best Practice**: Combine color with shape, pattern, or text to convey information

**Color Palette Selection**:

- **Primary Colors**: Blue (#0066CC) and Orange (#FF9500) - maximally distinct for all color vision types
- **Avoid**: Red/Green combinations (indistinguishable to deuteranopia/protanopia)
- **High Contrast**: Minimum 4.5:1 contrast ratio (WCAG AA standard)

**Card Suit Representation**:

- **Spades ♠**: Black + filled shape
- **Hearts ♥**: Red + filled shape + "H" letter indicator
- **Diamonds ♦**: Red + hollow shape + "D" letter indicator
- **Clubs ♣**: Black + filled shape + "C" letter indicator

**UI Element Colors**:

- **Player Turn Indicator**: Blue border + pulsing animation
- **Action Buttons**:
  - Fold: Gray with red accent
  - Call/Check: Blue
  - Raise: Orange
- **Chip Values**: Text labels + distinct patterns/textures
- **Status Indicators**: Icons + text (not color alone)

**Implementation with Chakra UI**:

```typescript
// frontend/src/theme/colors.ts
export const colorBlindFriendlyTheme = {
  colors: {
    primary: {
      500: '#0066CC', // Blue
      600: '#0052A3',
    },
    secondary: {
      500: '#FF9500', // Orange
      600: '#CC7700',
    },
    success: '#00AA00', // Distinct green
    warning: '#FFD700', // Gold
    danger: '#CC0000', // Distinct red
    // Suits
    spades: '#000000',
    clubs: '#003300',
    hearts: '#CC0000',
    diamonds: '#CC6600',
  },
};
```

**References**:

- https://www.smashingmagazine.com/2016/06/improving-color-accessibility-for-color-blind-users/
- https://davidmathlogic.com/colorblind/

### 4. Firebase Free Tier Optimization

**Decision**: Architect for Firebase Spark plan limits while maintaining performance.

**Rationale**:

- **Cost Constraint**: Spec requires cheapest tier only
- **Usage Limits**:
  - Firestore: 50K reads/day, 20K writes/day, 1GB storage, 10GB/month network egress
  - Functions: 125K invocations/month, 40K GB-seconds compute
  - Hosting: 10GB storage, 360MB/day transfer
- **Expected Load**: 10-50 concurrent players across 10 tables = well within limits

**Optimization Strategies**:

1. **Read Reduction**:
   - Use real-time listeners instead of polling (1 read per document change vs. continuous reads)
   - Cache static data client-side (card images, rules)
   - Denormalize data to reduce query complexity (e.g., embed player names in table doc)

2. **Write Reduction**:
   - Batch writes where possible (e.g., pot distribution + hand history in single transaction)
   - Debounce non-critical updates (e.g., action timer countdown every second vs. every 100ms)
   - Use local state for UI-only changes (e.g., button hover states)

3. **Storage Optimization**:
   - Delete old table sessions after game ends (cleanup function)
   - Limit hand history to last 50 hands per table
   - Store minimal data (IDs instead of full objects where possible)

4. **Function Optimization**:
   - Keep functions lightweight (cold start < 1s)
   - Use single function with routing instead of many functions
   - Minimize dependencies to reduce deployment size

5. **Monitoring**:
   - Firebase Console usage dashboard
   - Alert at 80% of quota limits
   - Implement rate limiting if approaching limits

**Implementation**:

```typescript
// backend/src/functions/index.ts
export const gameActions = functions.https.onCall(async (data, context) => {
  const { action, tableId, playerId, amount } = data;

  // Single function handles all game actions (reduces function count)
  switch (action) {
    case 'fold':
      return handleFold(tableId, playerId);
    case 'call':
      return handleCall(tableId, playerId);
    case 'raise':
      return handleRaise(tableId, playerId, amount);
    default:
      throw new functions.https.HttpsError('invalid-argument', 'Unknown action');
  }
});
```

### 5. Vite + TypeScript + Vitest Stack

**Decision**: Use Vite for build tooling, TypeScript for type safety, Vitest for testing.

**Rationale**:

- **Vite Benefits**:
  - Ultra-fast HMR (Hot Module Replacement) for development
  - Optimized production builds with Rollup
  - Built-in code splitting and tree shaking
  - ESM-first approach (modern JS standards)
  - Smaller bundle sizes than Create React App

- **TypeScript Benefits**:
  - Type safety prevents runtime errors
  - Better IDE support (autocomplete, refactoring)
  - Self-documenting code (types as documentation)
  - Enforces contracts between frontend/backend

- **Vitest Benefits**:
  - Vite-native (shares Vite config, same transforms)
  - Fast test execution (parallel, watch mode)
  - Jest-compatible API (easy migration if needed)
  - Built-in coverage reporting

**Alternatives Considered**:

- **Create React App**: Slower builds, webpack-based, more configuration
- **Next.js**: Overkill for SPA, server-side rendering not needed
- **Jest**: Requires separate configuration, slower than Vitest with Vite

**Implementation Notes**:

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          chakra: ['@chakra-ui/react', '@emotion/react'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
```

### 6. Chakra UI Component Library

**Decision**: Use Chakra UI for component library with Emotion for CSS-in-JS.

**Rationale**:

- **Accessibility**: Built-in ARIA attributes, keyboard navigation
- **Theming**: Powerful theme customization (perfect for color blind palette)
- **Responsive**: Mobile-first design system
- **Performance**: Optimized styled-components with Emotion
- **Developer Experience**: Intuitive API, great TypeScript support

**Alternatives Considered**:

- **Material-UI**: Heavier bundle, less flexible theming
- **Ant Design**: Gaming aesthetic doesn't match, larger bundle
- **Tailwind CSS**: More manual work, no pre-built accessible components

**Implementation Strategy**:

```typescript
// frontend/src/theme/components.ts
export const cardComponent = {
  baseStyle: {
    borderRadius: 'md',
    border: '2px solid',
    borderColor: 'gray.700',
    p: 2,
    minW: '60px',
    minH: '84px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'xl',
    fontWeight: 'bold',
  },
  variants: {
    spades: {
      bg: 'white',
      color: 'spades',
    },
    hearts: {
      bg: 'white',
      color: 'hearts',
      _after: {
        content: '"H"',
        fontSize: 'xs',
        position: 'absolute',
        bottom: 1,
        right: 1,
      },
    },
    // ... diamonds, clubs
  },
};
```

### 7. TDD with Vitest and Firebase Emulator

**Decision**: Implement strict TDD using Vitest for unit/integration tests and Firebase Emulator for backend testing.

**Rationale**:

- **Constitution Requirement**: TDD is non-negotiable
- **Quality**: Tests written first ensure requirements are understood
- **Confidence**: Safe refactoring with comprehensive test coverage
- **Firebase Emulator**: Free local testing without consuming quota or requiring network

**Test Strategy**:

1. **Unit Tests** (backend poker logic):
   - Hand evaluator (test all hand rankings)
   - Pot calculator (test side pots, split pots)
   - Shuffler (test randomness distribution)
   - Game engine (test state transitions)

2. **Integration Tests** (Firebase Functions):
   - Player actions (fold, call, raise) with emulated Firestore
   - Table creation/joining
   - Cashier operations (buy-in, cash-out)

3. **Component Tests** (frontend):
   - React components with Testing Library
   - User interactions (button clicks, form submissions)
   - State management hooks

**Implementation**:

```typescript
// backend/tests/unit/handEvaluator.test.ts
import { describe, it, expect } from 'vitest';
import { evaluateHand } from '../../src/lib/poker/handEvaluator';

describe('Hand Evaluator', () => {
  it('should identify royal flush', () => {
    const cards = [
      { rank: 'A', suit: 'spades' },
      { rank: 'K', suit: 'spades' },
      { rank: 'Q', suit: 'spades' },
      { rank: 'J', suit: 'spades' },
      { rank: '10', suit: 'spades' },
    ];
    const result = evaluateHand(cards);
    expect(result.handRank).toBe('Royal Flush');
    expect(result.value).toBe(10); // Highest rank
  });

  // ... more tests for each hand type
});
```

### 8. SLC (Simple, Lovable, Complete) Phasing

**Decision**: Implement in SLC phases to deliver value incrementally.

**Rationale**:

- **Spec Requirement**: Phased approach mandated
- **Risk Reduction**: Early feedback, course correction
- **Motivation**: Working software maintains team morale
- **User Value**: Friends can start playing sooner

**Phase Breakdown**:

**Phase 1 - Simple** (MVP for 2 players):

- Create/join table with 4-digit code
- Basic 2-player Texas Hold'em (no blinds increase, fixed blinds)
- Manual chip tracking (simple buy-in/cash-out)
- No shareable views, no hand history
- Desktop-only

**Phase 2 - Lovable** (Full multiplayer):

- Support 2-10 players at table
- Blind increase timers
- Cashier ledger with transaction history
- Hand history (last 20 hands)
- Mobile responsive design
- Color blind accessibility enhancements

**Phase 3 - Complete** (All features):

- Shareable table/hand views
- Configurable table settings (debt limits, stack limits)
- Host transfer on disconnect
- Performance optimizations
- ADR documentation

**Implementation**:
Each phase is independently deployable and testable. No phase depends on future phases.

## Best Practices Research

### Firestore Data Modeling for Real-Time Games

**Pattern**: Denormalized, read-optimized document structure.

**Table Document**:

```typescript
{
  id: string; // 4-digit code
  hostId: string;
  players: {
    [playerId: string]: {
      name: string;
      chips: number;
      position: number;
      isActive: boolean;
    };
  };
  gameState: {
    phase: 'waiting' | 'playing' | 'showdown' | 'ended';
    currentPlayerId: string | null;
    pot: number;
    communityCards: Card[];
    dealerPosition: number;
    smallBlind: number;
    bigBlind: number;
  };
  settings: {
    maxPlayers: number;
    minBuyIn: number;
    maxDebt: number;
    maxStack: number;
    actionTimer: number;
    blindTimer: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Rationale**: Single document contains all data needed to render table UI, minimizing reads.

### Security Rules for Poker Game

**Pattern**: Server-authoritative rules, client read-only for own data.

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players can read their own data
    match /players/{playerId} {
      allow read: if request.auth.uid == playerId;
      allow write: if false; // Only backend functions can write
    }

    // Tables can be read by participants
    match /tables/{tableId} {
      allow read: if request.auth.uid in resource.data.players;
      allow write: if false; // Only backend functions can write
    }

    // Ledger is read-only for all players (transparency)
    match /ledger/{playerId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

**Rationale**: Prevents client-side cheating, ensures all game logic runs server-side.

## Open Questions (Resolved During Research)

~~1. How to prevent card visibility exploits in Firestore?~~

- **Resolution**: Use Firestore Security Rules to prevent reading opponent hands. Store hole cards in subcollection with player-specific read rules.

~~2. How to handle Firebase quota limits for real-time updates?~~

- **Resolution**: Optimize with read reduction strategies (see Section 4). Monitor usage dashboard.

~~3. Gilbert-Shannon-Reeds implementation complexity?~~

- **Resolution**: Moderate complexity (~100 lines). Well-documented algorithm with TypeScript implementation examples available.

~~4. Color blind testing approach?~~

- **Resolution**: Use Chrome DevTools color blindness simulation + manual testing with color blind users from friend group.

## References

1. Firebase Documentation: https://firebase.google.com/docs
2. Chakra UI: https://chakra-ui.com/
3. Vitest: https://vitest.dev/
4. "Mathematics of Poker" (Chen & Ankenman, 2006)
5. "Trailing the Dovetail Shuffle to its Lair" (Bayer & Diaconis, 1992)
6. WCAG 2.1 Color Contrast Guidelines: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
7. Simple, Lovable, Complete: https://longform.asmartbear.com/slc/
8. Firebase Emulator Suite: https://firebase.google.com/docs/emulator-suite

## Summary

All major technical decisions documented. No unresolved NEEDS CLARIFICATION items. Ready to proceed to Phase 1 (Design & Contracts).

**Key Takeaways**:

1. Firebase provides robust real-time infrastructure within free tier limits
2. Gilbert-Shannon-Reeds shuffling is implementable and adds realism
3. Color blind accessibility requires multi-modal information encoding (color + shape + text)
4. TDD with Vitest + Firebase Emulator enables confident development
5. SLC phasing delivers value incrementally while managing complexity
