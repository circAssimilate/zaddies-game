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

import { HStack, Text, VStack, Box } from '@chakra-ui/react';
import { Card as CardType } from '@shared/types/game';
import { Card } from '../Card/Card';

interface CommunityCardsProps {
  cards: CardType[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display community cards with burn cards
 *
 * @param cards - Community cards to display (0-5 cards)
 * @param size - Card size (sm, md, lg)
 *
 * Burn cards: 1 before flop, 1 before turn, 1 before river
 */
export function CommunityCards({ cards, size = 'md' }: CommunityCardsProps) {
  // Determine number of burn cards based on community cards shown
  // Preflop: 0 burns, Flop: 1 burn, Turn: 2 burns, River: 3 burns
  const burnCount = cards.length === 0 ? 0 : cards.length === 3 ? 1 : cards.length === 4 ? 2 : 3;

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
      {/* Below 660px: Stack burn cards above community cards, centered */}
      <VStack
        spacing="10px"
        width="100%"
        alignItems="center"
        display={{ base: 'flex', md: 'none' }}
      >
        {/* Burn cards (face-down, stacked with 10px offset, grayed out) */}
        {burnCount > 0 && (
          <Box
            position="relative"
            width={`${40 + burnCount * 10}px`}
            height="110px"
            flexShrink={0}
            opacity={0.6}
            filter="grayscale(30%)"
          >
            {[...Array(burnCount)].map((_, i) => (
              <Box key={`burn-${i}`} position="absolute" left={`${i * 10}px`} top="0" zIndex={i}>
                <Card card={{ rank: 'A', suit: 'spades' }} faceDown size={size} />
              </Box>
            ))}
          </Box>
        )}

        {/* Community cards */}
        <HStack spacing={2} flexWrap="wrap" justifyContent="center">
          {cards.map((card, index) => (
            <Card key={`${card.suit}-${card.rank}-${index}`} card={card} size={size} />
          ))}
          {/* Fill remaining slots with face-down cards */}
          {cards.length < 5 &&
            [...Array(5 - cards.length)].map((_, i) => (
              <Card
                key={`facedown-${i}`}
                card={{ rank: 'A', suit: 'spades' }}
                faceDown
                size={size}
              />
            ))}
        </HStack>
      </VStack>

      {/* Above 660px: Horizontal layout with burn cards on left */}
      <HStack
        spacing={5}
        alignItems="flex-start"
        justifyContent="center"
        display={{ base: 'none', md: 'flex' }}
      >
        {/* Burn cards (face-down, stacked with 10px offset, grayed out) */}
        {burnCount > 0 && (
          <Box
            position="relative"
            width={`${40 + burnCount * 10}px`}
            height="110px"
            flexShrink={0}
            opacity={0.6}
            filter="grayscale(30%)"
            mr="20px"
          >
            {[...Array(burnCount)].map((_, i) => (
              <Box key={`burn-${i}`} position="absolute" left={`${i * 10}px`} top="0" zIndex={i}>
                <Card card={{ rank: 'A', suit: 'spades' }} faceDown size={size} />
              </Box>
            ))}
          </Box>
        )}

        {/* Community cards */}
        <HStack spacing={2} flexWrap="nowrap">
          {cards.map((card, index) => (
            <Card key={`${card.suit}-${card.rank}-${index}`} card={card} size={size} />
          ))}
          {/* Fill remaining slots with face-down cards */}
          {cards.length < 5 &&
            [...Array(5 - cards.length)].map((_, i) => (
              <Card
                key={`facedown-${i}`}
                card={{ rank: 'A', suit: 'spades' }}
                faceDown
                size={size}
              />
            ))}
        </HStack>
      </HStack>

      {phase && (
        <Text color="gray.500" fontSize="sm">
          {phase}
        </Text>
      )}
    </VStack>
  );
}
