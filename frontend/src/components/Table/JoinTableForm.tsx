/**
 * Join Table Form Component
 * Form for joining an existing table with code and buy-in amount
 */

import {
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState } from 'react';

interface JoinTableFormProps {
  onJoin: (tableId: string, buyInAmount: number) => Promise<void>;
  isLoading?: boolean;
  isDisabled?: boolean;
}

export default function JoinTableForm({
  onJoin,
  isLoading = false,
  isDisabled = false,
}: JoinTableFormProps) {
  const [tableCode, setTableCode] = useState('');
  const [buyInAmount, setBuyInAmount] = useState(100);
  const [codeError, setCodeError] = useState('');
  const [amountError, setAmountError] = useState('');

  const validateCode = (code: string): boolean => {
    if (!code) {
      setCodeError('Table code is required');
      return false;
    }

    if (!/^\d{4}$/.test(code)) {
      setCodeError('Code must be 4 digits');
      return false;
    }

    setCodeError('');
    return true;
  };

  const validateAmount = (amount: number): boolean => {
    if (!amount || amount <= 0) {
      setAmountError('Buy-in must be positive');
      return false;
    }

    setAmountError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isCodeValid = validateCode(tableCode);
    const isAmountValid = validateAmount(buyInAmount);

    if (!isCodeValid || !isAmountValid) {
      return;
    }

    try {
      await onJoin(tableCode, buyInAmount);
      // Reset form on success
      setTableCode('');
      setBuyInAmount(100);
    } catch (err) {
      // Error will be handled by parent component
      console.error('Join table error:', err);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits, max 4 characters
    if (/^\d{0,4}$/.test(value)) {
      setTableCode(value);
      if (value.length === 4) {
        setCodeError('');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <VStack spacing={4} align="stretch">
        {/* Table Code Input */}
        <FormControl isInvalid={!!codeError} isDisabled={isDisabled}>
          <FormLabel>Table Code</FormLabel>
          <Input
            placeholder="1234"
            value={tableCode}
            onChange={handleCodeChange}
            maxLength={4}
            fontSize="2xl"
            fontFamily="mono"
            textAlign="center"
            size="lg"
          />
          <FormErrorMessage>{codeError}</FormErrorMessage>
        </FormControl>

        {/* Buy-in Amount Input */}
        <FormControl isInvalid={!!amountError} isDisabled={isDisabled}>
          <FormLabel>Buy-in Amount</FormLabel>
          <NumberInput
            value={buyInAmount}
            onChange={(_, val) => {
              setBuyInAmount(val);
              validateAmount(val);
            }}
            min={1}
            step={50}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
          <FormErrorMessage>{amountError}</FormErrorMessage>
        </FormControl>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          colorScheme="brand"
          isLoading={isLoading}
          isDisabled={isDisabled || !tableCode || !buyInAmount}
          loadingText="Joining..."
        >
          Join Table
        </Button>
      </VStack>
    </form>
  );
}
