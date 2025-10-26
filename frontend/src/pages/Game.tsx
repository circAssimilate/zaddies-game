/**
 * Game Page Component
 * Active poker game page
 *
 * Displays the poker table with:
 * - Live game state
 * - Player seats
 * - Community cards
 * - Player's hole cards
 * - Action buttons
 */

import { Box, Button, useToast, Spinner, VStack, Text, HStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTable } from '../hooks/useTable';
import { TableView } from '../components/Table/TableView';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export default function Game() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { table, loading, error, leaveTable } = useTable(tableId, user?.uid);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Redirect if no tableId
  useEffect(() => {
    if (!tableId) {
      navigate('/');
    }
  }, [tableId, navigate]);

  // Redirect to lobby if game hasn't started yet
  useEffect(() => {
    if (table && table.status === 'waiting') {
      navigate(`/table/${tableId}`);
    }
  }, [table, tableId, navigate]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load game',
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

  // Fetch usernames for all players
  useEffect(() => {
    if (!table || table.players.length === 0) return;

    const fetchUsernames = async () => {
      setLoadingUsernames(true);
      try {
        const playerIds = table.players.map(p => p.id);

        // Fetch user profiles from Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('__name__', 'in', playerIds));
        const snapshot = await getDocs(q);

        const usernameMap = new Map<string, string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          usernameMap.set(doc.id, data.username || data.email || 'Unknown');
        });

        setUsernames(usernameMap);
      } catch (err) {
        console.error('Failed to fetch usernames:', err);
        // Fallback: use player IDs as usernames
        const fallbackMap = new Map<string, string>();
        table.players.forEach(p => {
          fallbackMap.set(p.id, p.id.slice(0, 8));
        });
        setUsernames(fallbackMap);
      } finally {
        setLoadingUsernames(false);
      }
    };

    fetchUsernames();
  }, [table]);

  const handleLeaveTable = async () => {
    if (!tableId) return;

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
    }
  };

  // Loading state
  if (loading || loadingUsernames || !table || !user) {
    return (
      <Box
        width="100%"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.900"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text color="gray.400">Loading game...</Text>
        </VStack>
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box
        width="100%"
        height="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.900"
      >
        <VStack spacing={4}>
          <Text color="red.500" fontSize="xl">
            Error loading game
          </Text>
          <Text color="gray.400">{error.message}</Text>
          <Button colorScheme="blue" onClick={() => navigate('/')}>
            Return Home
          </Button>
        </VStack>
      </Box>
    );
  }

  return (
    <Box position="relative" width="100%" height="100vh" overflow="hidden">
      {/* Leave button (top-right corner) */}
      <Button
        position="absolute"
        top={4}
        right={4}
        colorScheme="red"
        variant="outline"
        size="sm"
        onClick={handleLeaveTable}
        zIndex={20}
      >
        Leave Table
      </Button>

      {/* Table info (top-left corner) */}
      <HStack
        position="absolute"
        top={4}
        left={4}
        spacing={2}
        zIndex={20}
        bg="blackAlpha.700"
        px={4}
        py={2}
        borderRadius="md"
      >
        <Text color="white" fontWeight="bold">
          Table {table.id}
        </Text>
        <Text color="gray.400" fontSize="sm">
          |
        </Text>
        <Text color="gray.400" fontSize="sm">
          {table.players.length}/{table.settings.maxPlayers} players
        </Text>
      </HStack>

      {/* Main table view */}
      <TableView table={table} userId={user.uid} usernames={usernames} />
    </Box>
  );
}
