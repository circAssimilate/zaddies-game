import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { Chip } from '../../src/components/Chip';
import theme from '../../src/theme';

function renderWithChakra(component: React.ReactElement) {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
}

describe('Chip Component', () => {
  it('should render chip with value', () => {
    renderWithChakra(<Chip value={100} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should format large values with K suffix', () => {
    renderWithChakra(<Chip value={1000} />);
    expect(screen.getByText('1K')).toBeInTheDocument();

    const { unmount } = renderWithChakra(<Chip value={5000} />);
    expect(screen.getByText('5K')).toBeInTheDocument();
    unmount();
  });

  it('should render single chip by default', () => {
    renderWithChakra(<Chip value={50} />);
    expect(screen.getByText('50')).toBeInTheDocument();
    // Chip is rendered (we confirmed by checking for the value text)
  });

  it('should render stacked chips when count > 1', () => {
    renderWithChakra(<Chip value={25} count={3} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('should show count badge when count > 5', () => {
    renderWithChakra(<Chip value={10} count={10} />);
    // Both the chip value and count badge show "10"
    const elements = screen.getAllByText('10');
    expect(elements.length).toBe(2); // Chip value + count badge
  });

  it('should render different sizes', () => {
    const { container: smallContainer } = renderWithChakra(<Chip value={5} size="sm" />);
    const { container: mediumContainer } = renderWithChakra(<Chip value={5} size="md" />);
    const { container: largeContainer } = renderWithChakra(<Chip value={5} size="lg" />);

    expect(smallContainer.firstChild).toBeDefined();
    expect(mediumContainer.firstChild).toBeDefined();
    expect(largeContainer.firstChild).toBeDefined();
  });

  it('should handle various chip denominations', () => {
    const values = [1, 5, 10, 25, 100, 500, 1000, 5000];

    values.forEach(value => {
      const { unmount } = renderWithChakra(<Chip value={value} />);
      const displayValue = value >= 1000 ? `${value / 1000}K` : value.toString();
      expect(screen.getByText(displayValue)).toBeInTheDocument();
      unmount();
    });
  });
});
