import { useEffect, useState } from 'react';
import { Box, Circle, CircularProgress, CircularProgressLabel, Text } from '@chakra-ui/react';

interface TimerProps {
  duration: number; // Total duration in seconds
  onComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  autoStart?: boolean;
  color?: string;
}

const SIZE_CONFIG = {
  sm: { diameter: '40px', fontSize: 'xs', thickness: '4px' },
  md: { diameter: '60px', fontSize: 'md', thickness: '6px' },
  lg: { diameter: '80px', fontSize: 'lg', thickness: '8px' },
};

/**
 * Countdown timer component for poker action timer
 */
export function Timer({
  duration,
  onComplete,
  size = 'md',
  autoStart = true,
  color = 'brand.500',
}: TimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);

  const config = SIZE_CONFIG[size];

  useEffect(() => {
    if (!isRunning) return;

    if (secondsLeft <= 0) {
      setIsRunning(false);
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, secondsLeft, onComplete]);

  const progress = (secondsLeft / duration) * 100;

  // Change color based on urgency
  const getColor = () => {
    if (secondsLeft <= 5) return 'status.error';
    if (secondsLeft <= 10) return 'status.warning';
    return color;
  };

  const currentColor = getColor();

  return (
    <Box position="relative" width={config.diameter} height={config.diameter}>
      <CircularProgress
        value={progress}
        size={config.diameter}
        thickness={config.thickness}
        color={currentColor}
        trackColor="gray.700"
        isIndeterminate={false}
      >
        <CircularProgressLabel>
          <Text fontSize={config.fontSize} fontWeight="bold" color={currentColor}>
            {secondsLeft}
          </Text>
        </CircularProgressLabel>
      </CircularProgress>

      {/* Pulse animation when time is running low */}
      {secondsLeft <= 5 && secondsLeft > 0 && (
        <Circle
          size={config.diameter}
          position="absolute"
          top="0"
          left="0"
          borderWidth="2px"
          borderColor={currentColor}
          animation="pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite"
          sx={{
            '@keyframes pulse': {
              '0%, 100%': {
                opacity: 1,
              },
              '50%': {
                opacity: 0.5,
              },
            },
          }}
        />
      )}
    </Box>
  );
}
