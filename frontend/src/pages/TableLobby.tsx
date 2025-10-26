/**
 * Table Lobby Page Component
 * Pre-game lobby where players wait before game starts
 */

import {
  Box,
  Container,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  useToast,
  Spinner,
  Badge,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTable } from '../hooks/useTable';
import PlayerList from '../components/Table/PlayerList';
import StartGameButton from '../components/Table/StartGameButton';

export default function TableLobby() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { table, loading, error, leaveTable } = useTable(tableId);
  const [isLeaving, setIsLeaving] = useState(false);

  // Redirect if no tableId
  useEffect(() => {
    if (!tableId) {
      navigate('/');
    }
  }, [tableId, navigate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load table',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });

      // Redirect to home if table not found
      if (error.message.includes('not found')) {
        setTimeout(() => navigate('/'), 2000);
      }
    }
  }, [error, navigate, toast]);

  const handleLeaveTable = async () => {
    if (!tableId) return;

    setIsLeaving(true);
    try {
      await leaveTable(tableId);
      toast({
        title: 'Left table',
        description: 'You have left the table',
        status: 'success',
        duration: 3000,
      });
      navigate('/');
    } catch (err) {
      console.error('Failed to leave table:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to leave table',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleCopyCode = () => {
    if (tableId) {
      navigator.clipboard.writeText(tableId);
      toast({
        title: 'Copied!',
        description: `Table code ${tableId} copied to clipboard`,
        status: 'success',
        duration: 2000,
      });
    }
  };

  const handleStartGame = async () => {
    // TODO: Implement start game logic
    toast({
      title: 'Coming soon',
      description: 'Start game functionality will be implemented in User Story 2',
      status: 'info',
      duration: 3000,
    });
  };

  if (loading) {
    return (
      <Container maxW="container.lg" py={20}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading table...</Text>
        </VStack>
      </Container>
    );
  }

  if (!table) {
    return (
      <Container maxW="container.lg" py={20}>
        <VStack spacing={4}>
          <Text>Table not found</Text>
          <Button onClick={() => navigate('/')}>Return to Home</Button>
        </VStack>
      </Container>
    );
  }

  const isHost = user?.uid === table.hostId;
  const playerCount = table.players.length;
  const canStartGame = isHost && playerCount >= 2;

  return (
    <Container maxW="container.lg" py={10}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            Table Lobby
          </Heading>
          <HStack justify="center" spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.500">
                Table Code
              </Text>
              <HStack>
                <Heading as="h2" size="2xl" fontFamily="mono">
                  {tableId}
                </Heading>
                <Button size="sm" onClick={handleCopyCode}>
                  Copy
                </Button>
              </HStack>
            </Box>
          </HStack>
          {table.status && (
            <Badge mt={2} colorScheme={table.status === 'waiting' ? 'yellow' : 'green'}>
              {table.status.toUpperCase()}
            </Badge>
          )}
        </Box>

        {/* Table Settings */}
        <Box p={6} bg="gray.800" borderRadius="lg" borderWidth={1} borderColor="gray.700">
          <Heading as="h3" size="md" mb={4}>
            Table Settings
          </Heading>
          <VStack align="stretch" spacing={2}>
            <HStack justify="space-between">
              <Text color="gray.400">Blinds:</Text>
              <Text fontWeight="bold">
                {table.settings.smallBlind}/{table.settings.bigBlind}
              </Text>
            </HStack>
            <HStack justify="space-between">
              <Text color="gray.400">Max Players:</Text>
              <Text fontWeight="bold">{table.settings.maxPlayers}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color="gray.400">Min Buy-in:</Text>
              <Text fontWeight="bold">{table.settings.minBuyIn}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color="gray.400">Max Stack:</Text>
              <Text fontWeight="bold">{table.settings.maxStack}</Text>
            </HStack>
            <HStack justify="space-between">
              <Text color="gray.400">Action Timer:</Text>
              <Text fontWeight="bold">{table.settings.actionTimer}s</Text>
            </HStack>
          </VStack>
        </Box>

        {/* Player List */}
        <Box>
          <HStack justify="space-between" mb={4}>
            <Heading as="h3" size="md">
              Players ({playerCount}/{table.settings.maxPlayers})
            </Heading>
          </HStack>
          <PlayerList players={table.players} hostId={table.hostId} currentUserId={user?.uid} />
        </Box>

        {/* Actions */}
        <VStack spacing={4}>
          {isHost ? (
            <StartGameButton
              onClick={handleStartGame}
              isDisabled={!canStartGame}
              tooltip={playerCount < 2 ? 'Need at least 2 players to start' : undefined}
            />
          ) : (
            <Text color="gray.400" fontSize="sm">
              Waiting for host to start the game...
            </Text>
          )}

          <Button
            variant="outline"
            colorScheme="red"
            onClick={handleLeaveTable}
            isLoading={isLeaving}
          >
            Leave Table
          </Button>
        </VStack>
      </VStack>
    </Container>
  );
}
