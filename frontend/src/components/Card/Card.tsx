import { Box, Text, VStack } from '@chakra-ui/react';
import { Card as CardType } from '@shared/types/game';

interface CardProps {
  card: CardType;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const SIZE_CONFIG = {
  sm: { width: '40px', height: '56px', fontSize: 'xs', iconSize: '12px' },
  md: { width: '60px', height: '84px', fontSize: 'md', iconSize: '18px' },
  lg: { width: '80px', height: '112px', fontSize: 'lg', iconSize: '24px' },
};

// Suit symbols
const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

/**
 * Playing card component with color-blind friendly styling
 */
export function Card({ card, faceDown = false, size = 'md', onClick }: CardProps) {
  const config = SIZE_CONFIG[size];

  if (faceDown) {
    return (
      <Box
        width={config.width}
        height={config.height}
        bg="blue.700"
        borderRadius="md"
        borderWidth="2px"
        borderColor="blue.800"
        display="flex"
        alignItems="center"
        justifyContent="center"
        cursor={onClick ? 'pointer' : 'default'}
        onClick={onClick}
        _hover={onClick ? { transform: 'scale(1.05)', transition: 'transform 0.2s' } : undefined}
        position="relative"
        overflow="hidden"
      >
        {/* Card back pattern */}
        <Box
          position="absolute"
          width="100%"
          height="100%"
          bgGradient="linear(to-br, blue.600, blue.800)"
          opacity={0.8}
        />
        <Box
          position="absolute"
          width="80%"
          height="80%"
          borderWidth="2px"
          borderColor="blue.400"
          borderRadius="sm"
        />
      </Box>
    );
  }

  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = `suits.${card.suit}`;

  return (
    <VStack
      width={config.width}
      height={config.height}
      bg="white"
      borderRadius="md"
      borderWidth="2px"
      borderColor="gray.300"
      spacing={0}
      padding={1}
      cursor={onClick ? 'pointer' : 'default'}
      onClick={onClick}
      _hover={onClick ? { transform: 'scale(1.05)', transition: 'transform 0.2s' } : undefined}
      position="relative"
    >
      {/* Top-left corner */}
      <VStack spacing={0} position="absolute" top={1} left={1} alignItems="flex-start">
        <Text fontSize={config.fontSize} fontWeight="bold" color={suitColor} lineHeight="1">
          {card.rank}
        </Text>
        <Text fontSize={config.iconSize} color={suitColor} lineHeight="1">
          {suitSymbol}
        </Text>
      </VStack>

      {/* Center suit symbol */}
      <Box flex="1" display="flex" alignItems="center" justifyContent="center">
        <Text fontSize={size === 'sm' ? '2xl' : size === 'md' ? '3xl' : '4xl'} color={suitColor}>
          {suitSymbol}
        </Text>
      </Box>

      {/* Bottom-right corner (rotated) */}
      <VStack
        spacing={0}
        position="absolute"
        bottom={1}
        right={1}
        alignItems="flex-end"
        transform="rotate(180deg)"
      >
        <Text fontSize={config.fontSize} fontWeight="bold" color={suitColor} lineHeight="1">
          {card.rank}
        </Text>
        <Text fontSize={config.iconSize} color={suitColor} lineHeight="1">
          {suitSymbol}
        </Text>
      </VStack>
    </VStack>
  );
}
