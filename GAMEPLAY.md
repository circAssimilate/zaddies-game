# Zaddies Game - Gameplay & Rules

> Documentation of Texas Hold'em rules, game mechanics, and implementation logic

## Table of Contents

1. [Game Overview](#1-game-overview)
2. [Texas Hold'em Rules](#2-texas-holdem-rules)
3. [Hand Rankings](#3-hand-rankings)
4. [Hand Comparison Logic](#4-hand-comparison-logic)
5. [Tie Breaking Rules](#5-tie-breaking-rules)
6. [Shuffling & Randomness](#6-shuffling--randomness)
7. [Game Flow & Phases](#7-game-flow--phases)
8. [Betting Rules](#8-betting-rules)
9. [Special Rules & Edge Cases](#9-special-rules--edge-cases)

---

## 1. Game Overview

Zaddies Game is a web-based Texas Hold'em poker game designed for friend groups. It implements **Vegas-style rules** with transparent chip tracking but no real money transactions.

### Key Features

- **Table Access**: Join tables with simple 4-digit codes
- **Cashier System**: Transparent ledger tracking chip debt without real money
- **Shareable Views**: Stream-friendly URLs for Discord/OBS
- **Security**: Server-authoritative game logic prevents cheating
- **Accessibility**: 100% color blind friendly design

### What Makes This Different

- **No Rake**: Unlike casinos, no chips are taken from pots. The ledger reflects 100% of player activity.
- **Friend Group Focus**: Private tables, transparent debt tracking, designed for one trusted group.
- **Reliability Over Aesthetics**: Functionality and accessibility prioritized over visual polish.

---

## 2. Texas Hold'em Rules

Zaddies Game implements standard Texas Hold'em poker rules as played in Las Vegas casinos.

### Basic Flow

1. **Blinds Posted**: Small blind and big blind are automatically posted before each hand
2. **Hole Cards Dealt**: Each player receives 2 private cards (hole cards)
3. **Betting Rounds**: Players can fold, call, or raise in turn
4. **Community Cards**: 5 shared cards are revealed progressively (flop, turn, river)
5. **Showdown**: Best 5-card hand wins the pot

### Player Count

- **Minimum**: 2 players required to start
- **Maximum**: 10 players per table (standard Texas Hold'em)

### Dealing In Rules (Vegas Standard)

- **New Players**: Must wait until the big blind position before being dealt into a hand
- **First Hand**: Players post the big blind when dealt in for the first time
- **Mid-Game Join**: Cannot join while a hand is in progress

---

## 3. Hand Rankings

Poker hands are ranked from strongest to weakest. All hands use exactly **5 cards**.

| Rank | Hand Name       | Description                                   | Example               |
| ---- | --------------- | --------------------------------------------- | --------------------- |
| 10   | Royal Flush     | A-K-Q-J-10 all of the same suit               | A♠ K♠ Q♠ J♠ 10♠  |
| 9    | Straight Flush  | Five consecutive ranks, all same suit         | 9♥ 8♥ 7♥ 6♥ 5♥   |
| 8    | Four of a Kind  | Four cards of the same rank                   | 8♦ 8♣ 8♠ 8♥ K♠   |
| 7    | Full House      | Three of a kind + a pair                      | Q♦ Q♣ Q♠ 5♥ 5♣   |
| 6    | Flush           | Five cards of the same suit (not consecutive) | A♠ J♠ 9♠ 6♠ 3♠   |
| 5    | Straight        | Five consecutive ranks (mixed suits)          | 9♦ 8♣ 7♠ 6♥ 5♦   |
| 4    | Three of a Kind | Three cards of the same rank                  | 7♠ 7♥ 7♦ K♣ 2♠   |
| 3    | Two Pair        | Two pairs of different ranks                  | J♠ J♦ 4♥ 4♣ A♠   |
| 2    | Pair            | Two cards of the same rank                    | 10♥ 10♦ K♠ 8♣ 3♦ |
| 1    | High Card       | No matching cards                             | A♠ Q♦ 9♣ 7♠ 4♥   |

### Special Notes

- **Ace Value**: Aces are high (value 14) by default, but can be low in A-2-3-4-5 straights
- **Best 5 Cards**: Players use their best 5-card combination from 7 available cards (2 hole + 5 community)

**Implementation**: `shared/constants/gameRules.ts:6-34`

---

## 4. Hand Comparison Logic

### How Hands Are Compared

When comparing two poker hands, the system uses a **numeric value** where higher is always better.

**Q: How does a straight flush of diamonds compare to a straight flush of clubs?**

**A: Suits do NOT matter.** Only card ranks (2, 3, ..., J, Q, K, A) determine hand strength.

### The Numeric Value System

Each hand is assigned a numeric value for direct comparison:

```
value = (hand_rank_tier × 100,000,000) + (primary_values) + (kickers)
```

- **Hand Rank Tier**: Royal Flush (9) > Straight Flush (8) > Four of a Kind (7) > ... > High Card (0)
- **Primary Values**: The key cards (pairs, trips, quads) encoded in higher digits
- **Kickers**: Remaining cards encoded in lower digits for tie-breaking

### Example: Comparing Two Flushes

- **Hand A**: A♦ J♦ 9♦ 6♦ 3♦ (Ace-high flush, diamonds)
- **Hand B**: A♣ J♣ 9♣ 6♣ 3♣ (Ace-high flush, clubs)

**Result**: **Tie (split pot)** - Both hands have identical ranks. Suits are ignored.

- **Hand C**: K♠ Q♠ J♠ 9♠ 7♠ (King-high flush, spades)

**Result**: **Hand A and B beat Hand C** - Ace-high beats King-high regardless of suit.

### What About Suits?

**Suits play NO role in hand comparison.**

Evidence from the code:

- The `calculateHandValue()` function only encodes card ranks, never suits
- The `isFlush()` helper checks if all cards share a suit, but doesn't encode which suit
- All comparison tests verify that hands with identical ranks but different suits have equal value

**Implementation**: `shared/lib/poker/handEvaluator.ts:134-154`

---

## 5. Tie Breaking Rules

When two players have the same hand type, the winner is determined by comparing **card values** (ranks).

### Rank Values

```
2=2, 3=3, 4=4, 5=5, 6=6, 7=7, 8=8, 9=9, 10=10, J=11, Q=12, K=13, A=14
```

### Tie-Breaking Examples

#### Four of a Kind

- **A♠ A♥ A♦ A♣ K♠** beats **K♠ K♥ K♦ K♣ A♠**
- Quads rank is compared first (Aces = 14 > Kings = 13)
- If quads are equal, kicker is compared

#### Full House

- **A♠ A♥ A♦ K♣ K♠** beats **K♠ K♥ K♦ A♣ A♠**
- Trips rank is compared first (Aces full = stronger)
- "Aces full of Kings" beats "Kings full of Aces"

#### Flush

- **A♠ J♠ 9♠ 6♠ 3♠** beats **K♦ Q♦ J♦ 9♦ 7♦**
- All 5 cards compared in descending order
- First card that differs determines the winner

#### Straight

- **10♦ 9♣ 8♠ 7♥ 6♦** beats **9♠ 8♥ 7♦ 6♣ 5♠**
- Compared by highest card in the straight
- Exception: A-2-3-4-5 (wheel) is the lowest straight

#### Two Pair

- **J♠ J♦ 4♥ 4♣ A♠** beats **J♣ J♥ 4♦ 4♠ K♣**
- Higher pair compared first
- If tied, lower pair compared
- If still tied, kicker compared (A > K in this example)

#### Pair

- **A♠ A♦ K♣ Q♠ J♥** beats **A♣ A♥ K♦ Q♣ 10♠**
- Pair rank compared first (both have Aces, so tied)
- Kickers compared in descending order: K=K, Q=Q, J > 10

#### High Card

- **A♠ K♦ Q♣ J♠ 9♥** beats **A♣ K♥ Q♦ J♣ 8♠**
- All 5 cards compared in descending order
- First difference determines winner (9 > 8)

### True Ties (Split Pot)

If all 5 cards have identical ranks, **the pot is split equally**.

**Example**:

- Board: A♠ A♦ K♣ K♠ Q♥
- Player 1: 10♠ 2♣ (best hand: A-A-K-K-Q)
- Player 2: 9♦ 7♥ (best hand: A-A-K-K-Q)

**Result**: Split pot - both players use the board for their best 5-card hand.

**Implementation**:

- Hand comparison: `shared/lib/poker/handEvaluator.ts:134-154`
- Test cases: `backend/tests/unit/handEvaluator.test.ts`

---

## 6. Shuffling & Randomness

### Algorithm: Gilbert-Shannon-Reeds (GSR)

Zaddies Game uses the **Gilbert-Shannon-Reeds model**, the mathematical standard for simulating riffle shuffles.

### How It Works

1. **Riffle Shuffle**: Split the deck at a random point (binomial distribution), then interleave the two halves
2. **Repeat 7 Times**: Mathematical proof shows 7 riffle shuffles fully randomize a 52-card deck

### Why GSR?

- **Proven Randomness**: Bayer & Diaconis (1992) proved 7 shuffles achieve full randomization
- **Realistic**: Mimics physical casino shuffles (not just uniform random)
- **Testable**: Well-defined statistical properties enable verification
- **Fast**: Completes in <10ms on server

### Implementation Details

```typescript
function riffleShuffle(deck: Card[]): Card[] {
  // 1. Cut deck at binomial distribution point (mean = n/2)
  const cutPoint = calculateBinomialCut(deck.length);

  // 2. Split into two piles
  const left = deck.slice(0, cutPoint);
  const right = deck.slice(cutPoint);

  // 3. Interleave cards probabilistically
  return interleave(left, right);
}

export function gilbertShannonReedsShuff(deck: Card[]): Card[] {
  let shuffled = [...deck];
  for (let i = 0; i < 7; i++) {
    shuffled = riffleShuffle(shuffled);
  }
  return shuffled;
}
```

**Code**: `shared/lib/poker/shuffler.ts:20-89`

### Security

- **Server-Side Only**: All shuffling happens on the server
- **Client Cannot Manipulate**: Players never see or influence the shuffle
- **Audit Trail**: Server logs provide verifiable shuffle history

### Learn More

- [ADR 002: Gilbert-Shannon-Reeds Shuffling Algorithm](docs/adr/002-gilbert-shannon-reeds.md)
- [Original Paper: Bayer & Diaconis (1992)](https://projecteuclid.org/euclid.aoap/1177005705)

---

## 7. Game Flow & Phases

### Hand Progression

Each poker hand follows this sequence:

```
1. Pre-Flop
   ├─ Post blinds (small blind, big blind)
   ├─ Deal 2 hole cards to each player
   └─ Betting round (starting left of big blind)

2. Flop
   ├─ Deal 3 community cards face-up
   └─ Betting round (starting left of dealer button)

3. Turn
   ├─ Deal 1 community card face-up (4 total)
   └─ Betting round

4. River
   ├─ Deal 1 community card face-up (5 total)
   └─ Betting round

5. Showdown
   ├─ Players reveal cards (or muck)
   ├─ Best 5-card hand wins
   └─ Pot awarded to winner(s)

6. Cleanup
   ├─ Dealer button rotates clockwise
   └─ Start next hand
```

### Betting Round Flow

In each betting round, players act in turn (clockwise from the action position):

1. **Check**: Pass action to next player (only if no bet placed)
2. **Bet**: Place chips into the pot
3. **Call**: Match the current bet
4. **Raise**: Increase the current bet
5. **Fold**: Discard hand and forfeit pot

**Betting continues** until all active players have either:

- Matched the current bet, OR
- Folded, OR
- Gone all-in

### Dealer Button & Blinds

- **Dealer Button**: Rotates clockwise after each hand
- **Small Blind**: Posted by player left of dealer button
- **Big Blind**: Posted by player left of small blind
- **Action Order**: Starts left of big blind pre-flop, left of dealer button post-flop

---

## 8. Betting Rules

### Blinds

- **Small Blind**: Typically half the big blind (configurable by table host)
- **Big Blind**: Minimum bet amount for the table (configurable)
- **Blind Increases**: Automatically increase on a timer (default 15 minutes, configurable)

### Bet Sizing

- **Minimum Bet**: Equal to the big blind
- **Minimum Raise**: Must be at least the size of the previous bet or raise
- **No Maximum**: Pot-limit and no-limit structures supported (table configurable)

### All-In Rules

- **All-In**: A player can bet all their remaining chips at any time
- **Short All-In**: If a player goes all-in for less than the current bet, they can only win the main pot up to their all-in amount
- **Side Pots**: Created automatically when players go all-in for different amounts

**Example**:

```
Main Pot: $100 (Players A, B, C all contributed)
Player A: All-in for $20
Player B: Calls with $50
Player C: Calls with $50

Result:
- Main Pot: $60 (A can win this: $20 × 3 players)
- Side Pot: $60 (Only B and C eligible: $30 × 2 players)
```

**Implementation**: `shared/lib/poker/potCalculator.ts`

### Action Timer

- **Default**: 30 seconds per action (configurable by table host)
- **Auto-Fold**: If timer expires, player's hand is automatically folded
- **Visual Warning**: Timer countdown displayed to all players

---

## 9. Special Rules & Edge Cases

### Dealing In (Vegas Standard)

**Q: Can a new player join mid-hand?**

**A: No.** Players must wait until a hand completes, then wait until the **big blind position** before being dealt in.

**Q: What if I sit down between hands?**

**A: You must post the big blind** when it reaches your position. Only then will you receive cards.

### Showdown & Card Reveal

Following Vegas rules:

- **Winner by Fold**: If all opponents fold, the winner can **show or muck** their cards (optional)
- **Called at Showdown**: If called, you **must show** your cards to claim the pot
- **All-In Players**: Must show cards at showdown (cannot muck)
- **Losing Hands**: Can muck without showing (if not required to show)

**Hand History**: Only publicly shown cards are recorded. Mucked cards remain private.

### Disconnections

- **Mid-Hand**: Player's hand is automatically folded
- **Reconnection**: Player can rejoin their table within 15 seconds
- **Table Persistence**: Game state is maintained during disconnection

### Host Privileges

- **Host Leaves**: Privileges automatically transfer to the next player (longest-seated or first in seat order)
- **Settings Changes**: Only the host can modify table settings
- **Mid-Hand Changes**: Settings changes take effect at the start of the next hand (not mid-hand)

### Chip Limits

- **Minimum Buy-In**: Configurable by table host (prevents players sitting with too few chips)
- **Maximum Stack Size**: Configurable by table host (default: 200 big blinds)
- **Maximum Debt**: Configurable per player (default: $1000) - prevents unlimited debt accumulation

### Split Pots

- **Identical Hands**: Pot is split equally between all players with the best hand
- **Odd Chips**: Any odd chips (cents) are awarded to the player closest to the dealer button

### Edge Cases

- **Only One Player Remains**: Table stays open but game cannot start until 2+ players present
- **Blind > Stack**: If blinds exceed a player's stack, they go all-in for their remaining chips
- **4-Digit Code Collision**: System ensures all active table codes are unique
- **Rake**: **None taken** - 100% of chips bet are returned to players via the pot

---

## For Technical Implementation Details

- [Feature Specification](specs/001-texas-holdem-poker/spec.md)
- [Implementation Plan](specs/001-texas-holdem-poker/plan.md)
- [Data Model](specs/001-texas-holdem-poker/data-model.md)
- [Architecture Decision Records](docs/adr/)
- [Hand Evaluator Code](shared/lib/poker/handEvaluator.ts)
- [Shuffler Code](shared/lib/poker/shuffler.ts)
- [Game Rules Constants](shared/constants/gameRules.ts)

---

## Questions or Clarifications?

This documentation reflects the **current implementation** of Zaddies Game. If you encounter behavior that differs from this guide, please verify against the codebase and open an issue.

**Key Principle**: When in doubt, Vegas rules apply. This game implements standard Texas Hold'em as played in Las Vegas casinos, with the exception of **no rake** being taken from pots.
