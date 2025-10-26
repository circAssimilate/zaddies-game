/**
 * TableView Component
 * Main poker table display component
 *
 * Composes all table-related components:
 * - Player seats (up to 10 players)
 * - Community cards
 * - Pot display
 * - Player's hole cards
 * - Action buttons (when it's player's turn)
 */

import { Box, VStack, HStack, Grid, GridItem, Text } from '@chakra-ui/react';
import { Table } from '@shared/types/table';
import { PlayerState } from '@shared/types/player';
import { PlayerSeat } from './PlayerSeat';
import { CommunityCards } from './CommunityCards';
import { PotDisplay } from './PotDisplay';
import { HoleCards } from '../Hand/HoleCards';
import { ActionButtons } from '../Hand/ActionButtons';
import { useGameState } from '../../hooks/useGameState';

interface TableViewProps {
  table: Table;
  userId: string;
  usernames: Map<string, string>; // playerId -> username mapping
}

/**
 * Main poker table view
 *
 * @param table - Table state
 * @param userId - Current user ID
 * @param usernames - Player ID to username mapping
 */
export function TableView({ table, userId, usernames }: TableViewProps) {
  // Get game state and actions
  const {
    hand,
    currentPlayerPosition,
    phase,
    pot,
    communityCards,
    loading,
    error,
    fold,
    check,
    call,
    raise,
    allIn,
  } = useGameState(table, userId);

  // Get player's hole cards (for potential future use - currently displayed in HoleCards component)
  // const { holeCards } = usePlayerHand(
  //   table?.id ?? null,
  //   hand?.handNumber ?? null,
  //   userId
  // );

  // Find current user's player state
  const currentUser = table.players.find(p => p.id === userId);
  const isUserTurn = currentUser && currentUser.position === currentPlayerPosition;

  // Determine available actions
  const currentBet = hand?.bettingRound?.currentBet ?? 0;
  const userCurrentBet = currentUser?.currentBet ?? 0;
  const callAmount = currentBet - userCurrentBet;

  const canCheck = callAmount === 0;
  const canCall = callAmount > 0;
  const canRaise = (currentUser?.chips ?? 0) > callAmount;
  const minRaise = hand?.bettingRound?.minRaise ?? 0;
  const maxRaise = (currentUser?.chips ?? 0) - callAmount;

  // Layout player seats around the table
  // For simplicity, using a grid layout (can be enhanced with circular positioning)
  const renderPlayerSeats = () => {
    return table.players.map((player: PlayerState) => (
      <GridItem key={player.id}>
        <PlayerSeat
          player={player}
          username={usernames.get(player.id) ?? 'Unknown'}
          isCurrentPlayer={player.position === currentPlayerPosition}
          isCurrentUser={player.id === userId}
          size="md"
        />
      </GridItem>
    ));
  };

  return (
    <Box
      width="100%"
      height="100vh"
      bg="green.900"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      overflow="hidden"
    >
      {/* Poker table surface */}
      <Box
        width="90%"
        maxWidth="1200px"
        height="80%"
        maxHeight="800px"
        bg="green.800"
        borderRadius="50%"
        borderWidth="8px"
        borderColor="brown.700"
        position="relative"
        boxShadow="inset 0 0 50px rgba(0,0,0,0.5)"
      >
        {/* Center area - Community cards and pot */}
        <VStack
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          spacing={4}
          zIndex={2}
        >
          <CommunityCards cards={communityCards} size="lg" />
          <PotDisplay mainPot={pot} sidePots={hand?.sidePots ?? []} size="lg" />
          {phase && (
            <Text fontSize="lg" fontWeight="bold" color="yellow.300">
              {phase.toUpperCase()}
            </Text>
          )}
        </VStack>

        {/* Player seats - arranged around the table */}
        <Grid
          templateColumns="repeat(4, 1fr)"
          gap={4}
          position="absolute"
          width="100%"
          height="100%"
          padding={8}
        >
          {renderPlayerSeats()}
        </Grid>
      </Box>

      {/* Bottom panel - Player's cards and actions */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="gray.900"
        borderTopWidth="2px"
        borderColor="gray.700"
        p={4}
        zIndex={10}
      >
        <VStack spacing={3}>
          {/* Player's hole cards */}
          <HStack spacing={4} width="100%" justifyContent="center">
            <Text fontSize="sm" color="gray.400">
              Your Cards:
            </Text>
            <HoleCards
              tableId={table?.id ?? null}
              handNumber={hand?.handNumber ?? null}
              userId={userId}
              size="lg"
            />
          </HStack>

          {/* Action buttons (only when it's user's turn) */}
          {isUserTurn && hand && (
            <ActionButtons
              canCheck={canCheck}
              canCall={canCall}
              callAmount={callAmount}
              canRaise={canRaise}
              minRaise={minRaise}
              maxRaise={maxRaise}
              pot={pot}
              onFold={fold}
              onCheck={check}
              onCall={call}
              onRaise={raise}
              onAllIn={allIn}
              disabled={loading}
              loading={loading}
            />
          )}

          {/* Status message when not user's turn */}
          {!isUserTurn && hand && (
            <Text fontSize="sm" color="gray.500">
              Waiting for other players...
            </Text>
          )}

          {/* Error message */}
          {error && (
            <Text fontSize="sm" color="red.500">
              Error: {error.message}
            </Text>
          )}
        </VStack>
      </Box>
    </Box>
  );
}
