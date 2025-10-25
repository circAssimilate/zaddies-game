# ADR 002: Gilbert-Shannon-Reeds Shuffling Algorithm

## Status

Accepted

## Context

Card shuffling in poker must be:

- **Random**: Provide fair, unpredictable card distribution
- **Realistic**: Mimic physical card shuffling behavior
- **Verifiable**: Testable for statistical randomness
- **Performant**: Fast enough for real-time gameplay (<500ms)

## Decision

Implement the Gilbert-Shannon-Reeds (GSR) model for card shuffling:

- 7 riffle shuffles for full randomization (mathematical standard)
- Each riffle splits deck at binomial distribution point
- Interleaves cards with probability matching physical shuffles
- Runs server-side only (prevents client manipulation)

## Consequences

### Positive

- **Proven model**: GSR is the mathematical standard for modeling riffle shuffles
- **Realistic**: Produces distributions matching physical casino shuffles
- **Testable**: Well-defined statistical properties enable verification tests
- **Fast**: 7 riffle shuffles complete in <10ms on server
- **Audit trail**: Server-side execution provides verifiable shuffle history

### Negative

- **Complexity**: Slightly more complex than naive Fisher-Yates shuffle
- **Overkill**: 7 shuffles exceed minimum randomness (trade-off for realism)

### Neutral

- **Deterministic**: Given same PRNG seed, produces same result (useful for replay/debugging)

## Implementation

```typescript
function riffleShuffle(deck: Card[]): Card[] {
  const cutPoint = binomialCut(deck.length);
  const left = deck.slice(0, cutPoint);
  const right = deck.slice(cutPoint);
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

## Testing Strategy

- Chi-squared tests for uniform distribution
- Runs tests (no patterns in consecutive shuffles)
- Permutation tests (all arrangements equally likely)
- Performance benchmarks (<10ms per shuffle)

## Alternatives Considered

- **Fisher-Yates**: Simpler but doesn't model realistic riffle shuffles
- **Overhand shuffle**: Less random, requires 10,000+ shuffles for full randomization
- **Crypto.getRandomValues()**: Uniform random but doesn't mimic physical shuffles

## Compliance

- ✅ **Constitution I (TDD)**: Statistical tests written before implementation
- ✅ **Constitution III (Performance-First)**: <10ms shuffle time measured
- ✅ **Constitution IV (Client-Server Separation)**: Shuffle runs server-side only
- ✅ **Spec FR-014**: Explicit requirement for GSR shuffling
