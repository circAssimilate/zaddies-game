/**
 * ActionButtons Component
 * Displays available player actions during a hand
 *
 * Shows context-appropriate buttons:
 * - Fold (always available unless already folded)
 * - Check (if no bet to call)
 * - Call (if there's a bet to call)
 * - Raise (opens bet slider)
 * - All In (always available)
 */

import { HStack, Button, VStack, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { BetSlider } from './BetSlider';

interface ActionButtonsProps {
  // Available actions based on game state
  canCheck: boolean;
  canCall: boolean;
  callAmount: number;
  canRaise: boolean;
  minRaise: number;
  maxRaise: number; // Player's chip stack
  pot: number; // Current pot for slider
  // Action callbacks
  onFold: () => void;
  onCheck: () => void;
  onCall: () => void;
  onRaise: (amount: number) => void;
  onAllIn: () => void;
  // UI state
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Player action buttons
 *
 * @param canCheck - True if player can check (no bet to call)
 * @param canCall - True if there's a bet to call
 * @param callAmount - Amount to call
 * @param canRaise - True if player can raise
 * @param minRaise - Minimum raise amount
 * @param maxRaise - Maximum raise amount (player's chips)
 * @param onFold - Fold callback
 * @param onCheck - Check callback
 * @param onCall - Call callback
 * @param onRaise - Raise callback
 * @param onAllIn - All-in callback
 * @param disabled - Disable all buttons
 * @param loading - Show loading state
 */
export function ActionButtons({
  canCheck,
  canCall,
  callAmount,
  canRaise,
  minRaise,
  maxRaise,
  pot,
  onFold,
  onCheck,
  onCall,
  onRaise,
  onAllIn,
  disabled = false,
  loading = false,
}: ActionButtonsProps) {
  const [showRaiseInput, setShowRaiseInput] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(minRaise);

  const handleRaise = () => {
    onRaise(raiseAmount);
    setShowRaiseInput(false);
    setRaiseAmount(minRaise); // Reset for next time
  };

  const handleRaiseClick = () => {
    if (canRaise) {
      setShowRaiseInput(true);
      setRaiseAmount(minRaise);
    }
  };

  const handleCancelRaise = () => {
    setShowRaiseInput(false);
    setRaiseAmount(minRaise);
  };

  // If showing raise input
  if (showRaiseInput) {
    return (
      <VStack spacing={3} width="100%">
        <Text fontSize="sm" color="gray.400">
          Raise Amount
        </Text>
        <BetSlider
          min={minRaise}
          max={maxRaise}
          pot={pot}
          value={raiseAmount}
          onChange={setRaiseAmount}
          disabled={disabled}
        />
        <HStack spacing={2} width="100%">
          <Button
            colorScheme="red"
            variant="outline"
            onClick={handleCancelRaise}
            isDisabled={disabled || loading}
            flex="1"
          >
            Cancel
          </Button>
          <Button
            colorScheme="green"
            onClick={handleRaise}
            isDisabled={disabled || loading || raiseAmount < minRaise || raiseAmount > maxRaise}
            isLoading={loading}
            flex="1"
          >
            Raise ${raiseAmount}
          </Button>
        </HStack>
      </VStack>
    );
  }

  // Main action buttons
  return (
    <HStack spacing={2} width="100%" flexWrap="wrap">
      {/* Fold */}
      <Button
        colorScheme="red"
        variant="outline"
        onClick={onFold}
        isDisabled={disabled || loading}
        flex="1"
        minW="80px"
      >
        Fold
      </Button>

      {/* Check or Call */}
      {canCheck && (
        <Button
          colorScheme="blue"
          onClick={onCheck}
          isDisabled={disabled || loading}
          isLoading={loading}
          flex="1"
          minW="80px"
        >
          Check
        </Button>
      )}

      {canCall && (
        <Button
          colorScheme="green"
          onClick={onCall}
          isDisabled={disabled || loading}
          isLoading={loading}
          flex="1"
          minW="80px"
        >
          Call ${callAmount}
        </Button>
      )}

      {/* Raise */}
      {canRaise && (
        <Button
          colorScheme="orange"
          onClick={handleRaiseClick}
          isDisabled={disabled || loading}
          flex="1"
          minW="80px"
        >
          Raise
        </Button>
      )}

      {/* All In */}
      <Button
        colorScheme="purple"
        onClick={onAllIn}
        isDisabled={disabled || loading}
        isLoading={loading}
        flex="1"
        minW="80px"
      >
        All In
      </Button>
    </HStack>
  );
}
