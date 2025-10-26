/**
 * Start Game Button Component
 * Button for host to start the game (visible only to host)
 */

import { Button, Tooltip } from '@chakra-ui/react';

interface StartGameButtonProps {
  onClick: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  tooltip?: string;
}

export default function StartGameButton({
  onClick,
  isDisabled = false,
  isLoading = false,
  tooltip,
}: StartGameButtonProps) {
  const button = (
    <Button
      size="lg"
      colorScheme="green"
      onClick={onClick}
      isDisabled={isDisabled}
      isLoading={isLoading}
      loadingText="Starting..."
      width="full"
    >
      Start Game
    </Button>
  );

  if (tooltip && isDisabled) {
    return (
      <Tooltip label={tooltip} placement="top">
        <span style={{ width: '100%' }}>{button}</span>
      </Tooltip>
    );
  }

  return button;
}
