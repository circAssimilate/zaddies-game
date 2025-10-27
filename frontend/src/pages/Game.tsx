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

import {
  Box,
  Button,
  useToast,
  Spinner,
  VStack,
  Text,
  HStack,
  Stack,
  Flex,
} from '@chakra-ui/react';
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
  const { user, loading: authLoading } = useAuth();
  const { table, loading, error, leaveTable } = useTable(tableId, user?.uid);
  const [usernames, setUsernames] = useState<Map<string, string>>(new Map());
  const [loadingUsernames, setLoadingUsernames] = useState(false);

  // Redirect if not authenticated (wait for auth to load first)
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('[Game] Not authenticated, redirecting to home');
      navigate('/');
    }
  }, [authLoading, user, navigate]);

  // Redirect if no tableId
  useEffect(() => {
    if (!tableId) {
      navigate('/');
    }
  }, [tableId, navigate]);

  // Redirect to lobby if game hasn't started yet
  // Only redirect if we've successfully loaded the table and it's actually in waiting status
  useEffect(() => {
    console.log('[Game] Redirect check:', {
      loading,
      status: table?.status,
      tableId,
      hasUser: !!user,
    });

    // Don't redirect while still loading or if user isn't authenticated yet
    if (loading || !user) {
      console.log('[Game] Still loading or no user, skipping redirect check');
      return;
    }

    if (table && table.status === 'waiting') {
      console.log('[Game] Game not started, redirecting to lobby');
      navigate(`/table/${tableId}`);
    } else if (table && table.status === 'playing') {
      console.log('[Game] Game is playing, staying on game page');
    }
  }, [loading, table, tableId, navigate, user]);

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

        // Add usernames from Firestore documents
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          usernameMap.set(doc.id, data.username || data.email || `Player ${doc.id.slice(0, 6)}`);
        });

        // Add fallback names for players without Firestore documents
        table.players.forEach(p => {
          if (!usernameMap.has(p.id)) {
            usernameMap.set(p.id, `Player ${p.id.slice(0, 6)}`);
          }
        });

        setUsernames(usernameMap);
      } catch (err) {
        console.error('Failed to fetch usernames:', err);
        // Fallback: use formatted player IDs as display names
        const fallbackMap = new Map<string, string>();
        table.players.forEach(p => {
          fallbackMap.set(p.id, `Player ${p.id.slice(0, 6)}`);
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
    <Box position="relative" width="100%" height="100vh" overflow="scroll">
      <Stack
        direction={{ base: 'column', sm: 'row' }}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={10}
        spacing={1}
        p={2}
      >
        {/* Table info (top-left corner) */}
        <HStack spacing={2} zIndex={20} bg="blackAlpha.700" px={4} py={2} borderRadius="md">
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

        <Flex flex={1} />

        {/* Leave button (top-right corner) */}
        <Button
          colorScheme="red"
          variant="outline"
          size="sm"
          onClick={handleLeaveTable}
          zIndex={20}
          height="40px"
        >
          Leave Table
        </Button>
      </Stack>

      {/* Main table view */}
      <TableView table={table} userId={user.uid} usernames={usernames} />
    </Box>
  );
}
