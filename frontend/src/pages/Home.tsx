/**
 * Home Page Component
 * Main landing page for creating or joining tables
 */

import { Box, Container, Heading, VStack, Button, useDisclosure, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TableSettings } from '@shared/types/table';
import { useAuth } from '../hooks/useAuth';
import { useTable } from '../hooks/useTable';
import CreateTableModal from '../components/Table/CreateTableModal';
import JoinTableForm from '../components/Table/JoinTableForm';

export default function Home() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();
  const { createTable, joinTable } = useTable();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      signIn();
    }
  }, [authLoading, user, signIn]);

  const handleCreateTable = async (settings?: Partial<TableSettings>) => {
    setIsCreating(true);
    setError(null);
    try {
      const tableId = await createTable(settings);
      onClose();
      navigate(`/table/${tableId}`);
    } catch (err) {
      console.error('Failed to create table:', err);
      setError(err instanceof Error ? err.message : 'Failed to create table');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTable = async (tableId: string, buyInAmount: number) => {
    setIsJoining(true);
    setError(null);
    try {
      await joinTable(tableId, buyInAmount);
      navigate(`/table/${tableId}`);
    } catch (err) {
      console.error('Failed to join table:', err);
      setError(err instanceof Error ? err.message : 'Failed to join table');
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={4}>
          <Text>Loading...</Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={20}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4}>
            Zaddies Game - Texas Hold&apos;em
          </Heading>
          <Text fontSize="lg" color="gray.400">
            poker for dads
          </Text>
        </Box>

        <VStack spacing={6} align="stretch">
          {/* Create Table Button */}
          <Button
            size="lg"
            colorScheme="brand"
            onClick={onOpen}
            isLoading={isCreating}
            isDisabled={!user}
          >
            Create Table
          </Button>

          {/* Join Table Form */}
          <Box>
            <Text fontSize="md" mb={3} textAlign="center" color="gray.400">
              Or join an existing table
            </Text>
            <JoinTableForm onJoin={handleJoinTable} isLoading={isJoining} isDisabled={!user} />
          </Box>

          {/* Error Message */}
          {error && (
            <Box p={4} bg="red.900" borderRadius="md" borderWidth={1} borderColor="red.600">
              <Text color="red.200">{error}</Text>
            </Box>
          )}
        </VStack>

        {/* Create Table Modal */}
        <CreateTableModal
          isOpen={isOpen}
          onClose={onClose}
          onCreate={handleCreateTable}
          isLoading={isCreating}
        />
      </VStack>
    </Container>
  );
}
