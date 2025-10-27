/**
 * BetSlider Component
 * Interactive slider for selecting bet/raise amounts
 *
 * Features:
 * - Smooth slider from min to max
 * - Quick bet buttons (min, 1/3 pot, 1/2 pot, pot, max)
 * - Visual feedback of selected amount
 */

import {
  VStack,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  Text,
} from '@chakra-ui/react';

interface BetSliderProps {
  min: number; // Minimum bet/raise
  max: number; // Maximum (player's chips)
  pot: number; // Current pot size for pot-based buttons
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * Bet/raise amount slider
 *
 * @param min - Minimum bet amount
 * @param max - Maximum bet amount (player's chip stack)
 * @param pot - Current pot size
 * @param value - Current selected value
 * @param onChange - Value change callback
 * @param disabled - Disable interaction
 */
export function BetSlider({ min, max, pot, value, onChange, disabled = false }: BetSliderProps) {
  // Quick bet amounts
  const quickBets = [
    { label: 'Min', value: min },
    { label: '1/3 Pot', value: Math.min(Math.floor(pot / 3), max) },
    { label: '1/2 Pot', value: Math.min(Math.floor(pot / 2), max) },
    { label: 'Pot', value: Math.min(pot, max) },
    { label: 'Max', value: max },
  ].filter(bet => bet.value >= min && bet.value <= max); // Only show valid bets

  return (
    <VStack spacing={3} width="100%">
      {/* Amount display */}
      <Text fontSize="2xl" fontWeight="bold" color="green.400">
        ${value}
      </Text>

      {/* Slider */}
      <Slider
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={onChange}
        isDisabled={disabled}
        focusThumbOnChange={false}
      >
        <SliderTrack bg="gray.700">
          <SliderFilledTrack bg="green.400" />
        </SliderTrack>
        <SliderThumb boxSize={6} bg="green.500" />
      </Slider>

      {/* Range labels */}
      <HStack width="100%" justifyContent="space-between" fontSize="xs" color="gray.500">
        <Text>${min}</Text>
        <Text>${max}</Text>
      </HStack>

      {/* Quick bet buttons */}
      <HStack spacing={2} width="100%" flexWrap="wrap" justifyContent="center">
        {quickBets.map(bet => (
          <Button
            key={bet.label}
            size="sm"
            variant="outline"
            colorScheme="green"
            onClick={() => onChange(bet.value)}
            isDisabled={disabled}
            minW="60px"
          >
            {bet.label}
          </Button>
        ))}
      </HStack>
    </VStack>
  );
}
