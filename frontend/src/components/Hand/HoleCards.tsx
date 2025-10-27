/**
 * HoleCards Component
 * Displays player's private two-card hand
 *
 * This component subscribes to the player's hole cards via usePlayerHand
 * and renders them using the Card component. Handles loading and null states.
 */

import { HStack, Spinner, Text, VStack } from '@chakra-ui/react';
import { Card } from '../Card/Card';
import { usePlayerHand } from '../../hooks/usePlayerHand';

interface HoleCardsProps {
  tableId: string | null;
  handNumber: number | null;
  userId: string | null;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display player's hole cards
 *
 * @param tableId - Current table ID
 * @param handNumber - Current hand number
 * @param userId - Current user ID
 * @param size - Card size (sm, md, lg)
 */
export function HoleCards({ tableId, handNumber, userId, size = 'md' }: HoleCardsProps) {
  const { holeCards, loading, error } = usePlayerHand(tableId, handNumber, userId);

  // Error state
  if (error) {
    return (
      <VStack spacing={2}>
        <Text color="red.500" fontSize="sm">
          Error loading cards
        </Text>
        <Text color="gray.500" fontSize="xs">
          {error.message}
        </Text>
      </VStack>
    );
  }

  // Loading state
  if (loading) {
    return (
      <HStack spacing={2}>
        <Spinner size="sm" color="blue.500" />
        <Text color="gray.500" fontSize="sm">
          Loading cards...
        </Text>
      </HStack>
    );
  }

  // No cards (not in hand)
  if (!holeCards) {
    return (
      <HStack spacing={2}>
        <Card card={{ rank: 'A', suit: 'spades' }} faceDown size={size} />
        <Card card={{ rank: 'A', suit: 'spades' }} faceDown size={size} />
      </HStack>
    );
  }

  // Display hole cards
  return (
    <HStack spacing={2}>
      <Card card={holeCards[0]} size={size} />
      <Card card={holeCards[1]} size={size} />
    </HStack>
  );
}
