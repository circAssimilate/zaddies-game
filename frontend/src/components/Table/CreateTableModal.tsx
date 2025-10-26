/**
 * Create Table Modal Component
 * Modal for creating a new poker table with custom settings
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Text,
} from '@chakra-ui/react';
import { useState } from 'react';
import type { TableSettings } from '@shared/types/table';

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings?: Partial<TableSettings>) => Promise<void>;
  isLoading?: boolean;
}

export default function CreateTableModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateTableModalProps) {
  // Default settings
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [smallBlind, setSmallBlind] = useState(5);
  const [bigBlind, setBigBlind] = useState(10);
  const [minBuyIn, setMinBuyIn] = useState(100);
  const [maxStack, setMaxStack] = useState(2000);
  const [maxDebtPerPlayer, setMaxDebtPerPlayer] = useState(1000);
  const [actionTimer, setActionTimer] = useState(30);
  const [blindIncreaseInterval, setBlindIncreaseInterval] = useState(15);
  const [showHandStrength, setShowHandStrength] = useState(false);
  const [useCustomSettings, setUseCustomSettings] = useState(false);

  const handleCreate = async () => {
    const settings: Partial<TableSettings> | undefined = useCustomSettings
      ? {
          maxPlayers,
          smallBlind,
          bigBlind,
          minBuyIn,
          maxStack,
          maxDebtPerPlayer,
          actionTimer,
          blindIncreaseInterval,
          showHandStrength,
        }
      : undefined;

    await onCreate(settings);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="gray.800">Create Table</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Use Custom Settings Toggle */}
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="custom-settings" mb="0" color="gray.700">
                Use custom settings
              </FormLabel>
              <Switch
                id="custom-settings"
                isChecked={useCustomSettings}
                onChange={e => setUseCustomSettings(e.target.checked)}
              />
            </FormControl>

            {useCustomSettings && (
              <>
                <Text fontSize="sm" color="gray.600">
                  Customize your table settings below
                </Text>

                {/* Max Players */}
                <FormControl>
                  <FormLabel color="gray.700">Max Players</FormLabel>
                  <NumberInput
                    value={maxPlayers}
                    onChange={(_, val) => setMaxPlayers(val)}
                    min={2}
                    max={10}
                  >
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {/* Blinds */}
                <FormControl>
                  <FormLabel color="gray.700">Small Blind</FormLabel>
                  <NumberInput value={smallBlind} onChange={(_, val) => setSmallBlind(val)} min={1}>
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.700">Big Blind</FormLabel>
                  <NumberInput
                    value={bigBlind}
                    onChange={(_, val) => setBigBlind(val)}
                    min={smallBlind + 1}
                  >
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {/* Buy-in and Stack */}
                <FormControl>
                  <FormLabel color="gray.700">Minimum Buy-in</FormLabel>
                  <NumberInput value={minBuyIn} onChange={(_, val) => setMinBuyIn(val)} min={1}>
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.700">Maximum Stack</FormLabel>
                  <NumberInput
                    value={maxStack}
                    onChange={(_, val) => setMaxStack(val)}
                    min={minBuyIn}
                  >
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {/* Max Debt */}
                <FormControl>
                  <FormLabel color="gray.700">Max Debt Per Player</FormLabel>
                  <NumberInput
                    value={maxDebtPerPlayer}
                    onChange={(_, val) => setMaxDebtPerPlayer(val)}
                    min={0}
                  >
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {/* Timers */}
                <FormControl>
                  <FormLabel color="gray.700">Action Timer (seconds)</FormLabel>
                  <NumberInput
                    value={actionTimer}
                    onChange={(_, val) => setActionTimer(val)}
                    min={10}
                    max={120}
                  >
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                <FormControl>
                  <FormLabel color="gray.700">Blind Increase Interval (minutes)</FormLabel>
                  <NumberInput
                    value={blindIncreaseInterval}
                    onChange={(_, val) => setBlindIncreaseInterval(val)}
                    min={5}
                    max={60}
                  >
                    <NumberInputField color="gray.800" _placeholder={{ color: 'gray.500' }} />
                    <NumberInputStepper>
                      <NumberIncrementStepper color="gray.600" />
                      <NumberDecrementStepper color="gray.600" />
                    </NumberInputStepper>
                  </NumberInput>
                </FormControl>

                {/* Show Hand Strength */}
                <FormControl display="flex" alignItems="center">
                  <FormLabel htmlFor="show-hand-strength" mb="0" color="gray.700">
                    Show hand strength
                  </FormLabel>
                  <Switch
                    id="show-hand-strength"
                    isChecked={showHandStrength}
                    onChange={e => setShowHandStrength(e.target.checked)}
                  />
                </FormControl>
              </>
            )}

            {!useCustomSettings && (
              <Text fontSize="sm" color="gray.600">
                Default settings will be used (10 players, 5/10 blinds, 30s timer)
              </Text>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose} isDisabled={isLoading}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleCreate}
            isLoading={isLoading}
            loadingText="Creating..."
          >
            Create Table
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
