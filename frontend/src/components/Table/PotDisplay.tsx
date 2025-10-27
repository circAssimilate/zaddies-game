/**
 * PotDisplay Component
 * Displays the current pot and any side pots
 *
 * Shows:
 * - Main pot amount
 * - Side pots (if any) with eligible players
 * - Visual chip representation
 */

import { VStack, HStack, Text, Tooltip } from '@chakra-ui/react';
import { SidePot } from '@shared/types/game';
import { Chip } from '../Chip/Chip';

interface PotDisplayProps {
  mainPot: number;
  sidePots?: SidePot[];
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display pot information
 *
 * @param mainPot - Main pot amount
 * @param sidePots - Side pots (optional)
 * @param size - Display size
 */
export function PotDisplay({ mainPot, sidePots = [], size = 'md' }: PotDisplayProps) {
  const fontSize = size === 'sm' ? 'md' : size === 'md' ? 'xl' : '2xl';

  // Total pot including side pots
  const totalPot = mainPot + sidePots.reduce((sum, pot) => sum + pot.amount, 0);

  return (
    <VStack spacing={2} alignItems="justify">
      <HStack spacing={2}>
        {/* Chip visual - use highest denomination chip for display */}
        <Chip value={totalPot >= 1000 ? 1000 : totalPot >= 100 ? 100 : 25} size={size} count={3} />

        {/* Main pot amount */}
        <HStack spacing={2} alignItems="center">
          <Text fontSize={fontSize} fontWeight="bold" color="yellow.500" whiteSpace="nowrap">
            ${totalPot}
          </Text>
          <Text fontSize="xs" color="gray.500">
            Pot
          </Text>
        </HStack>
      </HStack>

      {/* Side pots (if any) */}
      {sidePots.length > 0 && (
        <VStack spacing={1} mt={2}>
          {sidePots.map((pot, index) => (
            <Tooltip
              key={index}
              label={`Eligible: ${pot.eligiblePlayers.length} player(s)`}
              hasArrow
              placement="top"
            >
              <HStack spacing={2} fontSize="xs" color="yellow.300" cursor="help">
                <Text>Side Pot {index + 1}:</Text>
                <Text fontWeight="bold">${pot.amount}</Text>
              </HStack>
            </Tooltip>
          ))}
        </VStack>
      )}
    </VStack>
  );
}
