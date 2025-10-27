import { Box, Text, Circle } from '@chakra-ui/react';

interface ChipProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  count?: number;
}

const SIZE_CONFIG = {
  sm: { diameter: '30px', fontSize: 'xs', stackOffset: '3px' },
  md: { diameter: '40px', fontSize: 'sm', stackOffset: '4px' },
  lg: { diameter: '50px', fontSize: 'md', stackOffset: '5px' },
};

// Chip colors based on common casino chip denominations
function getChipColor(value: number): string {
  if (value >= 1000) return 'purple.500'; // Purple for 1000+
  if (value >= 500) return 'pink.500'; // Pink for 500
  if (value >= 100) return 'gray.800'; // Black for 100
  if (value >= 25) return 'green.500'; // Green for 25
  if (value >= 10) return 'blue.500'; // Blue for 10
  if (value >= 5) return 'red.500'; // Red for 5
  return 'white'; // White for 1
}

function getTextColor(value: number): string {
  // Black text for white chips (< 5), white text for all others
  if (value < 5) return 'black';
  return 'white';
}

/**
 * Poker chip component with stacking visualization
 */
export function Chip({ value, size = 'md', count = 1 }: ChipProps) {
  const config = SIZE_CONFIG[size];
  const chipColor = getChipColor(value);
  const textColor = getTextColor(value);

  // Format value for display
  const displayValue = value >= 1000 ? `${value / 1000}K` : value.toString();

  // Show stack of chips if count > 1
  if (count > 1) {
    const stackCount = Math.min(count, 5); // Max 5 visible chips in stack
    const chips = Array.from({ length: stackCount }, (_, i) => i);

    return (
      <Box position="relative" height={config.diameter} width={config.diameter}>
        {chips.map((_, index) => (
          <Circle
            key={index}
            size={config.diameter}
            bg={chipColor}
            borderWidth="3px"
            borderColor="white"
            position="absolute"
            bottom={`${index * parseInt(config.stackOffset)}px`}
            left="0"
            boxShadow="md"
            _before={{
              content: '""',
              position: 'absolute',
              width: '80%',
              height: '80%',
              borderRadius: 'full',
              borderWidth: '2px',
              borderColor: 'whiteAlpha.400',
            }}
          >
            {index === stackCount - 1 && (
              <>
                <Text
                  fontSize={config.fontSize}
                  fontWeight="bold"
                  color={textColor}
                  textShadow="0 1px 2px rgba(0,0,0,0.3)"
                >
                  {displayValue}
                </Text>
                {count > 5 && (
                  <Text
                    position="absolute"
                    top="-8px"
                    right="-8px"
                    fontSize="xs"
                    bg="gray.800"
                    color="white"
                    borderRadius="full"
                    minW="20px"
                    height="20px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontWeight="bold"
                    boxShadow="md"
                  >
                    {count}
                  </Text>
                )}
              </>
            )}
          </Circle>
        ))}
      </Box>
    );
  }

  // Single chip
  return (
    <Circle
      size={config.diameter}
      bg={chipColor}
      borderWidth="3px"
      borderColor="white"
      boxShadow="md"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        width: '80%',
        height: '80%',
        borderRadius: 'full',
        borderWidth: '2px',
        borderColor: 'whiteAlpha.400',
      }}
    >
      <Text
        fontSize={config.fontSize}
        fontWeight="bold"
        color={textColor}
        textShadow="0 1px 2px rgba(0,0,0,0.3)"
      >
        {displayValue}
      </Text>
    </Circle>
  );
}
