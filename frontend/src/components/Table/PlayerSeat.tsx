/**
 * PlayerSeat Component
 * Displays a player's seat at the poker table
 *
 * Shows:
 * - Player name and avatar
 * - Chip count
 * - Current bet
 * - Status indicators (dealer, blinds, folded, all-in)
 * - Turn indicator
 */

import { Box, VStack, HStack, Text, Badge, Avatar } from '@chakra-ui/react';
import { PlayerState } from '@shared/types/player';
import { Chip } from '../Chip/Chip';

interface PlayerSeatProps {
  player: PlayerState;
  username: string; // From user profile
  isCurrentPlayer: boolean; // True if it's this player's turn
  isCurrentUser: boolean; // True if this is the logged-in user
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Display a player's seat at the table
 *
 * @param player - Player state from table
 * @param username - Player's display name
 * @param isCurrentPlayer - True if it's this player's turn
 * @param isCurrentUser - True if this is the logged-in user
 * @param size - Display size
 */
export function PlayerSeat({
  player,
  username,
  isCurrentPlayer,
  isCurrentUser,
  size = 'md',
}: PlayerSeatProps) {
  const avatarSize = size === 'sm' ? 'sm' : size === 'md' ? 'md' : 'lg';
  const fontSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';

  // Determine status color
  const getStatusColor = () => {
    if (player.status === 'folded') return 'gray.500';
    if (player.status === 'allin') return 'red.500';
    if (isCurrentPlayer) return 'green.500';
    return 'blue.500';
  };

  // Determine border color
  const borderColor = isCurrentPlayer ? 'green.400' : isCurrentUser ? 'blue.400' : 'gray.600';

  return (
    <Box
      position="relative"
      borderWidth="3px"
      borderColor={borderColor}
      borderRadius="lg"
      bg="gray.800"
      p={3}
      minW={size === 'sm' ? '120px' : size === 'md' ? '150px' : '180px'}
      boxShadow={isCurrentPlayer ? '0 0 20px rgba(72, 187, 120, 0.5)' : 'md'}
      opacity={player.status === 'folded' ? 0.6 : 1}
      transition="all 0.3s"
    >
      <VStack spacing={2} alignItems="flex-start">
        {/* Player info */}
        <HStack spacing={2} width="100%">
          <Avatar name={username} size={avatarSize} bg={getStatusColor()} />
          <VStack spacing={0} alignItems="flex-start" flex="1">
            <Text fontSize={fontSize} fontWeight="bold" color="white" noOfLines={1}>
              {username}
            </Text>
            <HStack spacing={1}>
              {/* Dealer button */}
              {player.isDealer && (
                <Badge colorScheme="orange" fontSize="xs">
                  D
                </Badge>
              )}
              {/* Small blind */}
              {player.isSmallBlind && (
                <Badge colorScheme="blue" fontSize="xs">
                  SB
                </Badge>
              )}
              {/* Big blind */}
              {player.isBigBlind && (
                <Badge colorScheme="purple" fontSize="xs">
                  BB
                </Badge>
              )}
              {/* Status badges */}
              {player.status === 'folded' && (
                <Badge colorScheme="gray" fontSize="xs">
                  Folded
                </Badge>
              )}
              {player.status === 'allin' && (
                <Badge colorScheme="red" fontSize="xs">
                  All In
                </Badge>
              )}
              {player.status === 'sitting' && (
                <Badge colorScheme="yellow" fontSize="xs">
                  Sitting
                </Badge>
              )}
            </HStack>
          </VStack>
        </HStack>

        {/* Chip count */}
        <HStack spacing={2} width="100%">
          <Chip value={player.chips >= 100 ? 100 : player.chips >= 25 ? 25 : 5} size={size} />
          <Text fontSize={fontSize} color="yellow.400" fontWeight="bold">
            ${player.chips}
          </Text>
        </HStack>

        {/* Current bet (if any) */}
        {player.currentBet > 0 && (
          <Box
            position="absolute"
            top="-12px"
            right="-12px"
            bg="green.500"
            borderRadius="full"
            px={2}
            py={1}
            boxShadow="md"
          >
            <Text fontSize="xs" fontWeight="bold" color="white">
              ${player.currentBet}
            </Text>
          </Box>
        )}

        {/* Turn indicator */}
        {isCurrentPlayer && (
          <Box
            position="absolute"
            top="-8px"
            left="50%"
            transform="translateX(-50%)"
            bg="green.400"
            borderRadius="md"
            px={2}
            py={1}
            boxShadow="lg"
          >
            <Text fontSize="xs" fontWeight="bold" color="white">
              YOUR TURN
            </Text>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
