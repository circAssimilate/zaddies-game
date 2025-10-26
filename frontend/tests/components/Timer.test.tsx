import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { Timer } from '../../src/components/Timer';
import theme from '../../src/theme';

function renderWithChakra(component: React.ReactElement) {
  return render(<ChakraProvider theme={theme}>{component}</ChakraProvider>);
}

describe('Timer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should render with initial time', () => {
    renderWithChakra(<Timer duration={30} autoStart={false} />);
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('should countdown when autoStart is true', async () => {
    renderWithChakra(<Timer duration={5} autoStart={true} />);

    expect(screen.getByText('5')).toBeInTheDocument();

    // Advance time by 1 second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('4')).toBeInTheDocument();

    // Advance time by another second
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should call onComplete when timer reaches zero', async () => {
    const handleComplete = vi.fn();
    renderWithChakra(<Timer duration={2} autoStart={true} onComplete={handleComplete} />);

    expect(screen.getByText('2')).toBeInTheDocument();

    // Advance to completion
    await act(async () => {
      vi.advanceTimersByTime(2000);
    });

    expect(handleComplete).toHaveBeenCalledTimes(1);
  });

  it('should not start automatically when autoStart is false', () => {
    renderWithChakra(<Timer duration={10} autoStart={false} />);

    expect(screen.getByText('10')).toBeInTheDocument();

    // Advance time
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should still show 10
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render different sizes', () => {
    const { container: smallContainer } = renderWithChakra(
      <Timer duration={30} size="sm" autoStart={false} />
    );
    const { container: mediumContainer } = renderWithChakra(
      <Timer duration={30} size="md" autoStart={false} />
    );
    const { container: largeContainer } = renderWithChakra(
      <Timer duration={30} size="lg" autoStart={false} />
    );

    expect(smallContainer.firstChild).toBeDefined();
    expect(mediumContainer.firstChild).toBeDefined();
    expect(largeContainer.firstChild).toBeDefined();
  });

  it('should stop at zero', async () => {
    renderWithChakra(<Timer duration={1} autoStart={true} />);

    expect(screen.getByText('1')).toBeInTheDocument();

    // Advance to zero
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('0')).toBeInTheDocument();

    // Advance further - should stay at 0
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle long durations', () => {
    renderWithChakra(<Timer duration={300} autoStart={false} />);
    expect(screen.getByText('300')).toBeInTheDocument();
  });
});
