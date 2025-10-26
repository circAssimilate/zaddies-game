import { useState } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  Stack,
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
  // Auto-shuffle deck on page load to prevent unshuffled deals
  const [deck, setDeck] = useState<CardType[]>(() => gilbertShannonReedsShuff(createDeck()));
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
    <Box maxW="1200px" mx="auto" p={{ base: 4, md: 6, lg: 8 }}>
      <VStack spacing={{ base: 6, md: 8 }} align="stretch">
        {/* Header */}
        <Box>
          <Heading size={{ base: 'lg', md: 'xl' }} mb={2}>
            Poker Demo
          </Heading>
          <Text color="gray.400" fontSize={{ base: 'sm', md: 'md' }}>
            Test the shuffler, hand evaluator, and UI components
          </Text>
        </Box>

        <Divider />

        {/* Controls - Stack vertically on mobile, horizontally on tablet+ */}
        <Stack
          direction={{ base: 'column', md: 'row' }}
          spacing={4}
          align={{ base: 'stretch', md: 'center' }}
        >
          <Button onClick={handleShuffle} colorScheme="brand" size={{ base: 'md', md: 'md' }}>
            Shuffle Deck
          </Button>
          <Button onClick={handleDeal} colorScheme="green" size={{ base: 'md', md: 'md' }}>
            Deal Hand
          </Button>
          <Button onClick={handleStartTimer} colorScheme="orange" size={{ base: 'md', md: 'md' }}>
            Start Timer
          </Button>
          <Text color="gray.500" fontSize={{ base: 'sm', md: 'md' }}>
            Cards remaining: {deck.length}
          </Text>
        </Stack>

        {/* Timer Demo */}
        {showTimer && (
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
              Action Timer
            </Heading>
            <Timer duration={30} onComplete={handleTimerComplete} size="lg" />
          </Box>
        )}

        {/* Player Hand Banner */}
        {playerHand.length > 0 && (
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
              Your Hand
            </Heading>
            <Wrap spacing={2}>
              {playerHand.map((card, i) => (
                <WrapItem key={`player-${i}`}>
                  <Card card={card} size="lg" />
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}

        {/* Community Cards Banner */}
        {communityCards.length > 0 && (
          <Box>
            <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
              Community Cards
            </Heading>
            <Wrap spacing={2}>
              {communityCards.map((card, i) => (
                <WrapItem key={`community-${i}`}>
                  <Card card={card} size="lg" />
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}

        {/* Hand Evaluation Banner */}
        {handEval && (
          <Box
            p={{ base: 3, md: 4 }}
            bg="green.800"
            borderRadius="md"
            borderWidth="2px"
            borderColor="green.600"
          >
            <Heading size={{ base: 'sm', md: 'md' }} mb={2}>
              Best Hand
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold">
              {handEval}
            </Text>
          </Box>
        )}

        <Divider />

        {/* Chip Demo */}
        <Box>
          <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
            Poker Chips
          </Heading>
          <Wrap spacing={{ base: 4, md: 6 }}>
            <WrapItem>
              <VStack>
                <Chip value={1} />
                <Text fontSize="sm">$1</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={5} />
                <Text fontSize="sm">$5</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={25} />
                <Text fontSize="sm">$25</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={100} />
                <Text fontSize="sm">$100</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={500} />
                <Text fontSize="sm">$500</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={1000} />
                <Text fontSize="sm">$1K</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={100} count={5} size="md" />
                <Text fontSize="sm">5x $100</Text>
              </VStack>
            </WrapItem>
            <WrapItem>
              <VStack>
                <Chip value={25} count={10} size="md" />
                <Text fontSize="sm">10x $25</Text>
              </VStack>
            </WrapItem>
          </Wrap>
        </Box>

        <Divider />

        {/* Card Back Demo */}
        <Box>
          <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
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
          <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
            All Suits (Color-Blind Friendly)
          </Heading>
          <Wrap spacing={2}>
            <WrapItem>
              <Card card={{ rank: 'A', suit: 'spades' }} size="md" />
            </WrapItem>
            <WrapItem>
              <Card card={{ rank: 'K', suit: 'hearts' }} size="md" />
            </WrapItem>
            <WrapItem>
              <Card card={{ rank: 'Q', suit: 'diamonds' }} size="md" />
            </WrapItem>
            <WrapItem>
              <Card card={{ rank: 'J', suit: 'clubs' }} size="md" />
            </WrapItem>
          </Wrap>
        </Box>
      </VStack>
    </Box>
  );
}
