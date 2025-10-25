import { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  HStack,
  VStack,
  Text,
  Wrap,
  WrapItem,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { Card, Chip, Timer } from '../components';
import { Card as CardType } from '@shared/types/game';
import { createDeck, gilbertShannonReedsShuff } from '@shared/lib/poker/shuffler';
import { findBestHand } from '@shared/lib/poker/handEvaluator';

export function Demo() {
  const [deck, setDeck] = useState<CardType[]>(() => createDeck());
  const [playerHand, setPlayerHand] = useState<CardType[]>([]);
  const [communityCards, setCommunityCards] = useState<CardType[]>([]);
  const [handEval, setHandEval] = useState<string>('');
  const [showTimer, setShowTimer] = useState(false);

  const toast = useToast();

  const handleShuffle = () => {
    const shuffled = gilbertShannonReedsShuff(createDeck());
    setDeck(shuffled);
    setPlayerHand([]);
    setCommunityCards([]);
    setHandEval('');
    toast({
      title: 'Deck shuffled',
      description: 'Using Gilbert-Shannon-Reeds algorithm (7 riffle shuffles)',
      status: 'success',
      duration: 2000,
    });
  };

  const handleDeal = () => {
    if (deck.length < 9) {
      handleShuffle();
      return;
    }

    // Deal 2 hole cards + 5 community cards
    const newPlayerHand = deck.slice(0, 2);
    const newCommunityCards = deck.slice(2, 7);
    const remainingDeck = deck.slice(7);

    setPlayerHand(newPlayerHand);
    setCommunityCards(newCommunityCards);
    setDeck(remainingDeck);

    // Evaluate best hand
    const allCards = [...newPlayerHand, ...newCommunityCards];
    const evaluation = findBestHand(allCards);
    setHandEval(`${evaluation.handRank} (value: ${evaluation.value})`);

    toast({
      title: 'Cards dealt',
      description: '2 hole cards + 5 community cards',
      status: 'info',
      duration: 2000,
    });
  };

  const handleTimerComplete = () => {
    toast({
      title: 'Time expired!',
      status: 'warning',
      duration: 2000,
    });
    setShowTimer(false);
  };

  const handleStartTimer = () => {
    setShowTimer(true);
  };

  return (
    <Box maxW="1200px" mx="auto" p={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box>
          <Heading size="xl" mb={2}>
            Poker Demo
          </Heading>
          <Text color="gray.400">Test the shuffler, hand evaluator, and UI components</Text>
        </Box>

        {/* Controls */}
        <HStack spacing={4}>
          <Button onClick={handleShuffle} colorScheme="brand">
            Shuffle Deck
          </Button>
          <Button onClick={handleDeal} colorScheme="green">
            Deal Hand
          </Button>
          <Button onClick={handleStartTimer} colorScheme="orange">
            Start Timer
          </Button>
          <Text color="gray.500">Cards remaining: {deck.length}</Text>
        </HStack>

        <Divider />

        {/* Timer Demo */}
        {showTimer && (
          <Box>
            <Heading size="md" mb={4}>
              Action Timer
            </Heading>
            <Timer duration={30} onComplete={handleTimerComplete} size="lg" />
          </Box>
        )}

        {/* Chip Demo */}
        <Box>
          <Heading size="md" mb={4}>
            Poker Chips
          </Heading>
          <HStack spacing={6}>
            <VStack>
              <Chip value={1} />
              <Text fontSize="sm">$1</Text>
            </VStack>
            <VStack>
              <Chip value={5} />
              <Text fontSize="sm">$5</Text>
            </VStack>
            <VStack>
              <Chip value={25} />
              <Text fontSize="sm">$25</Text>
            </VStack>
            <VStack>
              <Chip value={100} />
              <Text fontSize="sm">$100</Text>
            </VStack>
            <VStack>
              <Chip value={500} />
              <Text fontSize="sm">$500</Text>
            </VStack>
            <VStack>
              <Chip value={1000} />
              <Text fontSize="sm">$1K</Text>
            </VStack>
            <VStack>
              <Chip value={100} count={5} size="md" />
              <Text fontSize="sm">5x $100</Text>
            </VStack>
            <VStack>
              <Chip value={25} count={10} size="md" />
              <Text fontSize="sm">10x $25</Text>
            </VStack>
          </HStack>
        </Box>

        <Divider />

        {/* Player Hand */}
        {playerHand.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>
              Your Hand
            </Heading>
            <HStack spacing={2}>
              {playerHand.map((card, i) => (
                <Card key={`player-${i}`} card={card} size="lg" />
              ))}
            </HStack>
          </Box>
        )}

        {/* Community Cards */}
        {communityCards.length > 0 && (
          <Box>
            <Heading size="md" mb={4}>
              Community Cards
            </Heading>
            <HStack spacing={2}>
              {communityCards.map((card, i) => (
                <Card key={`community-${i}`} card={card} size="lg" />
              ))}
            </HStack>
          </Box>
        )}

        {/* Hand Evaluation */}
        {handEval && (
          <Box p={4} bg="green.800" borderRadius="md" borderWidth="2px" borderColor="green.600">
            <Heading size="md" mb={2}>
              Best Hand
            </Heading>
            <Text fontSize="xl" fontWeight="bold">
              {handEval}
            </Text>
          </Box>
        )}

        {/* Card Back Demo */}
        <Box>
          <Heading size="md" mb={4}>
            Card Sizes & Face Down
          </Heading>
          <Wrap spacing={4}>
            <WrapItem>
              <VStack>
                <Card card={{ rank: 'A', suit: 'spades' }} size="sm" />
                <Text fontSize="sm">Small</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Card card={{ rank: 'K', suit: 'hearts' }} size="md" />
                <Text fontSize="sm">Medium</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Card card={{ rank: 'Q', suit: 'diamonds' }} size="lg" />
                <Text fontSize="sm">Large</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Card card={{ rank: 'J', suit: 'clubs' }} faceDown size="md" />
                <Text fontSize="sm">Face Down</Text>
              </VStack>
            </WrapItem>
          </Wrap>
        </Box>

        {/* All Suits Demo */}
        <Box>
          <Heading size="md" mb={4}>
            All Suits (Color-Blind Friendly)
          </Heading>
          <HStack spacing={2}>
            <Card card={{ rank: 'A', suit: 'spades' }} size="md" />
            <Card card={{ rank: 'K', suit: 'hearts' }} size="md" />
            <Card card={{ rank: 'Q', suit: 'diamonds' }} size="md" />
            <Card card={{ rank: 'J', suit: 'clubs' }} size="md" />
          </HStack>
        </Box>
      </VStack>
    </Box>
  );
}
