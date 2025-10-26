/**
 * CommunityCards Component
 * Displays the shared community cards (flop, turn, river)
 *
 * Shows up to 5 community cards based on current hand phase:
 * - Preflop: No cards
 * - Flop: 3 cards
 * - Turn: 4 cards
 * - River: 5 cards
 */

import { HStack, Text, VStack } from '@chakra-ui/react';
import { Card as CardType } from '@shared/types/game';
import { Card } from '../Card/Card';

interface CommunityCardsProps {
  cards: CardType[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display community cards
 *
 * @param cards - Community cards to display (0-5 cards)
 * @param size - Card size (sm, md, lg)
 */
export function CommunityCards({ cards, size = 'md' }: CommunityCardsProps) {
  // No cards yet (preflop)
  if (cards.length === 0) {
    return (
      <VStack spacing={2}>
        <HStack spacing={2}>
          {[...Array(5)].map((_, i) => (
            <Card key={i} card={{ rank: 'A', suit: 'spades' }} faceDown size={size} />
          ))}
        </HStack>
        <Text color="gray.500" fontSize="sm">
          Preflop
        </Text>
      </VStack>
    );
  }

  // Determine phase based on card count
  const phase =
    cards.length === 3 ? 'Flop' : cards.length === 4 ? 'Turn' : cards.length === 5 ? 'River' : '';

  return (
    <VStack spacing={2}>
      <HStack spacing={2}>
        {cards.map((card, index) => (
          <Card key={`${card.suit}-${card.rank}-${index}`} card={card} size={size} />
        ))}
        {/* Fill remaining slots with face-down cards */}
        {cards.length < 5 &&
          [...Array(5 - cards.length)].map((_, i) => (
            <Card key={`facedown-${i}`} card={{ rank: 'A', suit: 'spades' }} faceDown size={size} />
          ))}
      </HStack>
      {phase && (
        <Text color="gray.500" fontSize="sm">
          {phase}
        </Text>
      )}
    </VStack>
  );
}
