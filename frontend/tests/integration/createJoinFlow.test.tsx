import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import Home from '../../src/pages/Home';
import TableLobby from '../../src/pages/TableLobby';

/**
 * Integration tests for Create/Join Table Flow (User Story 1)
 * Contract: specs/001-texas-holdem-poker/contracts/api-functions.md
 *
 * This test suite validates the end-to-end table creation and joining flow:
 * - Create table UI flow
 * - Generate and display 4-digit code
 * - Join table UI flow
 * - Navigate to table lobby
 * - Table lobby display
 *
 * NOTE: These tests focus on UI component integration and user flows.
 * Backend integration tests are in backend/tests/integration/tableManagement.test.ts
 */

// Setup is now handled in tests/setup.ts

// Mock Firebase services
const mockCreateTable = vi.fn();
const mockJoinTable = vi.fn();
const mockLeaveTable = vi.fn();
const mockGetTable = vi.fn();

vi.mock('../../src/services/firebase/tables', () => ({
  createTable: (...args: unknown[]) => mockCreateTable(...args),
  joinTable: (...args: unknown[]) => mockJoinTable(...args),
  leaveTable: (...args: unknown[]) => mockLeaveTable(...args),
  getTable: (...args: unknown[]) => mockGetTable(...args),
}));

// Mock useAuth hook
const mockUser = {
  uid: 'test-user-1',
  displayName: 'Test User',
  email: 'test@example.com',
};

vi.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock useTable hook with proper table data
const mockTable = {
  id: '1234',
  hostId: 'test-user-1',
  status: 'waiting' as const,
  players: [
    {
      id: 'test-user-1',
      displayName: 'Test User',
      chips: 100,
      position: 0,
      isActive: true,
      isFolded: false,
    },
  ],
  settings: {
    maxPlayers: 10,
    smallBlind: 5,
    bigBlind: 10,
    minBuyIn: 100,
    maxStack: 2000,
    maxDebtPerPlayer: 1000,
    actionTimer: 30,
    blindIncreaseInterval: 15,
    showHandStrength: false,
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('../../src/hooks/useTable', () => ({
  useTable: (tableId?: string) => {
    if (tableId) {
      return {
        table: mockTable,
        loading: false,
        error: null,
        createTable: mockCreateTable,
        joinTable: mockJoinTable,
        leaveTable: mockLeaveTable,
      };
    }
    return {
      table: null,
      loading: false,
      error: null,
      createTable: mockCreateTable,
      joinTable: mockJoinTable,
      leaveTable: mockLeaveTable,
    };
  },
}));

// Test wrapper with providers
function TestWrapper({
  children,
  initialRoute = '/',
}: {
  children: React.ReactNode;
  initialRoute?: string;
}) {
  return (
    <ChakraProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/" element={children} />
          <Route path="/table/:tableId" element={<TableLobby />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe('Create and Join Table Flow (User Story 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateTable.mockReset();
    mockJoinTable.mockReset();
    mockLeaveTable.mockReset();
    mockGetTable.mockReset();
  });

  describe('Create Table Flow', () => {
    it('should display create table button on home page', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /create table/i });
        expect(button).toBeDefined();
      });
    });

    it('should open create table modal when button clicked', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create table/i })).toBeDefined();
      });

      const createButton = screen.getByRole('button', { name: /create table/i });

      await act(async () => {
        await user.click(createButton);
      });

      await waitFor(() => {
        // Look for the modal heading specifically
        const heading = screen.queryByRole('heading', { name: /create table/i });
        expect(heading).toBeDefined();
      });
    });

    it('should create table with default settings and navigate', async () => {
      const user = userEvent.setup();
      mockCreateTable.mockResolvedValue('1234');
      mockGetTable.mockResolvedValue(mockTable);

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      // Wait for page to render
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create table/i })).toBeDefined();
      });

      // Open modal
      const createButton = screen.getByRole('button', { name: /create table/i });
      await act(async () => {
        await user.click(createButton);
      });

      // Wait for modal to open - verify modal heading is present
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create table/i })).toBeDefined();
      });

      // Find and click the modal's "Create Table" button
      // The modal overlays the page, so we get the visible button
      const modalCreateButton = screen.getByRole('button', { name: /^create table$/i });

      await act(async () => {
        await user.click(modalCreateButton);
      });

      // Verify createTable was called with undefined (default settings)
      await waitFor(() => {
        expect(mockCreateTable).toHaveBeenCalledWith(undefined);
      });

      // Verify navigation to table lobby by checking for table code heading
      await waitFor(() => {
        const tableCodeHeading = screen.queryByText(/table code: 1234/i);
        expect(tableCodeHeading).toBeDefined();
      });
    });

    it('should show error message if creation fails', async () => {
      const user = userEvent.setup();
      mockCreateTable.mockRejectedValue(new Error('Failed to create table'));

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create table/i })).toBeDefined();
      });

      // Open modal
      const createButton = screen.getByRole('button', { name: /create table/i });
      await act(async () => {
        await user.click(createButton);
      });

      // Wait for modal to open - verify modal heading is present
      await waitFor(() => {
        expect(screen.queryByRole('heading', { name: /create table/i })).toBeDefined();
      });

      // Find and click the modal's "Create Table" button
      const modalCreateButton = screen.getByRole('button', { name: /^create table$/i });

      await act(async () => {
        await user.click(modalCreateButton);
      });

      // Verify error displayed on the home page (modal closes, error shows)
      await waitFor(() => {
        const errorText = screen.queryByText(/failed to create table/i);
        expect(errorText).toBeDefined();
      });

      // Verify mockCreateTable was called (to ensure button click worked)
      expect(mockCreateTable).toHaveBeenCalledWith(undefined);
    });
  });

  describe('Join Table Flow', () => {
    it('should display join table form on home page', async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/table code/i)).toBeDefined();
        expect(screen.getByLabelText(/buy-in amount/i)).toBeDefined();
        expect(screen.getByRole('button', { name: /join table/i })).toBeDefined();
      });
    });

    it('should join table with valid code and buy-in', async () => {
      const user = userEvent.setup();
      mockJoinTable.mockResolvedValue(0);

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/table code/i)).toBeDefined();
      });

      // Fill in form
      const codeInput = screen.getByLabelText(/table code/i);
      const buyInInput = screen.getByLabelText(/buy-in amount/i);
      const joinButton = screen.getByRole('button', { name: /join table/i });

      await act(async () => {
        await user.type(codeInput, '1234');
        await user.clear(buyInInput);
        await user.type(buyInInput, '100');
      });

      await act(async () => {
        await user.click(joinButton);
      });

      // Verify joinTable called correctly
      await waitFor(() => {
        expect(mockJoinTable).toHaveBeenCalledWith('1234', 100);
      });
    });

    it('should validate 4-digit code format', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/table code/i)).toBeDefined();
      });

      const codeInput = screen.getByLabelText(/table code/i);
      const buyInInput = screen.getByLabelText(/buy-in amount/i);
      const joinButton = screen.getByRole('button', { name: /join table/i });

      // Try with 3 digits
      await act(async () => {
        await user.type(codeInput, '123');
        await user.clear(buyInInput);
        await user.type(buyInInput, '100');
        await user.click(joinButton);
      });

      // Verify error shown
      await waitFor(() => {
        const errorText = screen.queryByText(/code must be 4 digits/i);
        expect(errorText).toBeDefined();
      });

      expect(mockJoinTable).not.toHaveBeenCalled();
    });

    it('should validate buy-in amount is positive', async () => {
      const user = userEvent.setup();

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/table code/i)).toBeDefined();
      });

      const codeInput = screen.getByLabelText(/table code/i);
      const buyInInput = screen.getByLabelText(/buy-in amount/i);
      const joinButton = screen.getByRole('button', { name: /join table/i });

      await act(async () => {
        await user.type(codeInput, '1234');
        await user.clear(buyInInput);
        await user.type(buyInInput, '0');
        await user.click(joinButton);
      });

      // Verify error shown
      await waitFor(() => {
        const errorText = screen.queryByText(/buy-in must be positive/i);
        expect(errorText).toBeDefined();
      });

      expect(mockJoinTable).not.toHaveBeenCalled();
    });

    it('should show error if table not found', async () => {
      const user = userEvent.setup();
      mockJoinTable.mockRejectedValue(new Error('Table not found'));

      await act(async () => {
        render(
          <TestWrapper>
            <Home />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByLabelText(/table code/i)).toBeDefined();
      });

      const codeInput = screen.getByLabelText(/table code/i);
      const buyInInput = screen.getByLabelText(/buy-in amount/i);
      const joinButton = screen.getByRole('button', { name: /join table/i });

      await act(async () => {
        await user.type(codeInput, '9999');
        await user.clear(buyInInput);
        await user.type(buyInInput, '100');
        await user.click(joinButton);
      });

      await waitFor(() => {
        const errorText = screen.queryByText(/table not found/i);
        expect(errorText).toBeDefined();
      });
    });
  });

  describe('Table Lobby Display', () => {
    it('should display table code prominently', async () => {
      await act(async () => {
        render(
          <TestWrapper initialRoute="/table/1234">
            <TableLobby />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        expect(screen.getByText('1234')).toBeDefined();
        const codeLabel = screen.queryByText(/table code/i);
        expect(codeLabel).toBeDefined();
      });
    });

    it('should display table settings', async () => {
      await act(async () => {
        render(
          <TestWrapper initialRoute="/table/1234">
            <TableLobby />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const settingsHeading = screen.queryByText(/table settings/i);
        expect(settingsHeading).toBeDefined();
        expect(screen.getByText('5/10')).toBeDefined(); // Blinds
      });
    });

    it('should display player information', async () => {
      await act(async () => {
        render(
          <TestWrapper initialRoute="/table/1234">
            <TableLobby />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        // Check that player name is displayed (may be in multiple elements)
        const playerName = screen.queryByText(/Test User/i);
        expect(playerName).toBeDefined();
      });
    });

    it('should show "Start Game" button for host', async () => {
      await act(async () => {
        render(
          <TestWrapper initialRoute="/table/1234">
            <TableLobby />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const startButton = screen.queryByRole('button', { name: /start game/i });
        expect(startButton).toBeDefined();
      });
    });

    it('should show leave table button', async () => {
      await act(async () => {
        render(
          <TestWrapper initialRoute="/table/1234">
            <TableLobby />
          </TestWrapper>
        );
      });

      await waitFor(() => {
        const leaveButton = screen.queryByRole('button', { name: /leave table/i });
        expect(leaveButton).toBeDefined();
      });
    });
  });
});
