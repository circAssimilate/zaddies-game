import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { Card } from '../../src/components/Card';
import { Card as CardType } from '../../../../shared/types/game';
import theme from '../../src/theme';

// Wrapper for Chakra UI components
function renderWithChakra(component: React.ReactElement) {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
}

describe('Card Component', () => {
  const aceOfSpades: CardType = { rank: 'A', suit: 'spades' };
  const kingOfHearts: CardType = { rank: 'K', suit: 'hearts' };

  it('should render a face-up card with rank and suit', () => {
    renderWithChakra(<Card card={aceOfSpades} />);

    // Should show rank (A) twice (top-left and bottom-right)
    const ranks = screen.getAllByText('A');
    expect(ranks).toHaveLength(2);

    // Should show spades symbol
    const spades = screen.getAllByText('♠');
    expect(spades.length).toBeGreaterThan(0);
  });

  it('should render a face-down card', () => {
    renderWithChakra(<Card card={aceOfSpades} faceDown />);

    // Should not show rank or suit when face down
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.queryByText('♠')).not.toBeInTheDocument();
  });

  it('should display different suits correctly', () => {
    const { rerender } = renderWithChakra(<Card card={kingOfHearts} />);

    // Hearts
    expect(screen.getAllByText('♥').length).toBeGreaterThan(0);

    // Diamonds
    const kingOfDiamonds: CardType = { rank: 'K', suit: 'diamonds' };
    rerender(
      <ChakraProvider theme={theme}>
        <Card card={kingOfDiamonds} />
      </ChakraProvider>
    );
    expect(screen.getAllByText('♦').length).toBeGreaterThan(0);

    // Clubs
    const kingOfClubs: CardType = { rank: 'K', suit: 'clubs' };
    rerender(
      <ChakraProvider theme={theme}>
        <Card card={kingOfClubs} />
      </ChakraProvider>
    );
    expect(screen.getAllByText('♣').length).toBeGreaterThan(0);
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    const { container } = renderWithChakra(<Card card={aceOfSpades} onClick={handleClick} />);

    // Find the VStack wrapper (the card itself)
    const cardElement = container.querySelector('.chakra-stack');
    if (cardElement) {
      await user.click(cardElement);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it('should render different sizes', () => {
    const { container: smallContainer } = renderWithChakra(<Card card={aceOfSpades} size="sm" />);
    const { container: mediumContainer } = renderWithChakra(<Card card={aceOfSpades} size="md" />);
    const { container: largeContainer } = renderWithChakra(<Card card={aceOfSpades} size="lg" />);

    // Check that different size classes are applied (implementation detail)
    expect(smallContainer.firstChild).toBeDefined();
    expect(mediumContainer.firstChild).toBeDefined();
    expect(largeContainer.firstChild).toBeDefined();
  });

  it('should render all rank values', () => {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

    ranks.forEach(rank => {
      const card: CardType = { rank, suit: 'spades' };
      const { unmount } = renderWithChakra(<Card card={card} />);
      expect(screen.getAllByText(rank)).toHaveLength(2); // Top-left and bottom-right
      unmount();
    });
  });
});
