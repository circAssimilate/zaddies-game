/**
 * Player List Component
 * Displays list of players at a table
 */

import {
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Avatar,
} from '@chakra-ui/react';
import type { PlayerState } from '@shared/types/player';

interface PlayerListProps {
  players: PlayerState[];
  hostId: string;
  currentUserId?: string;
}

export default function PlayerList({
  players,
  hostId,
  currentUserId,
}: PlayerListProps) {
  if (players.length === 0) {
    return (
      <Box p={8} textAlign="center" bg="gray.800" borderRadius="lg">
        <Text color="gray.400">No players yet</Text>
      </Box>
    );
  }

  // Sort players by position
  const sortedPlayers = [...players].sort((a, b) => a.position - b.position);

  return (
    <VStack spacing={2} align="stretch">
      {sortedPlayers.map((player) => (
        <Box
          key={player.id}
          p={4}
          bg={player.id === currentUserId ? 'brand.900' : 'gray.800'}
          borderRadius="lg"
          borderWidth={player.id === currentUserId ? 2 : 1}
          borderColor={player.id === currentUserId ? 'brand.500' : 'gray.700'}
        >
          <HStack justify="space-between">
            <HStack spacing={3}>
              {/* Avatar */}
              <Avatar
                size="sm"
                name={player.id}
                bg="brand.500"
              />

              {/* Player Info */}
              <Box>
                <HStack spacing={2}>
                  <Text fontWeight="bold">
                    Player {player.id.slice(0, 6)}
                    {player.id === currentUserId && ' (You)'}
                  </Text>
                  {player.id === hostId && (
                    <Badge colorScheme="purple">Host</Badge>
                  )}
                </HStack>
                <HStack spacing={2} fontSize="sm" color="gray.400">
                  <Text>Position: {player.position}</Text>
                  <Text>•</Text>
                  <Text>Chips: {player.chips}</Text>
                </HStack>
              </Box>
            </HStack>

            {/* Status Badge */}
            <Badge
              colorScheme={
                player.status === 'playing'
                  ? 'green'
                  : player.status === 'sitting'
                  ? 'yellow'
                  : 'gray'
              }
            >
              {player.status}
            </Badge>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
}
