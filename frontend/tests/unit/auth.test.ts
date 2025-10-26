import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  signInAnonymous,
  onAuthChange,
  getCurrentUser,
  signOut,
} from '../../src/services/firebase/auth';
import * as firebaseAuth from 'firebase/auth';

// Hoist mock auth object so it's available in mock factory
const mockAuth = vi.hoisted(() => ({
  currentUser: null as firebaseAuth.User | null,
  signOut: vi.fn(),
}));

// Mock Firebase auth module
vi.mock('firebase/auth', () => ({
  signInAnonymously: vi.fn(),
  onAuthStateChanged: vi.fn(),
  User: vi.fn(),
}));

// Mock the config module
vi.mock('../../src/services/firebase/config', () => ({
  auth: mockAuth,
}));

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('signInAnonymous', () => {
    it('should sign in anonymously and return user', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        isAnonymous: true,
        displayName: null,
        email: null,
      };

      const mockUserCredential = {
        user: mockUser,
      };

      vi.mocked(firebaseAuth.signInAnonymously).mockResolvedValue(
        mockUserCredential as firebaseAuth.UserCredential
      );

      const user = await signInAnonymous();

      expect(user).toEqual(mockUser);
      expect(firebaseAuth.signInAnonymously).toHaveBeenCalledTimes(1);
    });

    it('should throw error if sign in fails', async () => {
      const mockError = new Error('Sign in failed');

      vi.mocked(firebaseAuth.signInAnonymously).mockRejectedValue(mockError);

      await expect(signInAnonymous()).rejects.toThrow('Sign in failed');
      expect(firebaseAuth.signInAnonymously).toHaveBeenCalledTimes(1);
    });

    it('should log error to console when sign in fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Network error');

      vi.mocked(firebaseAuth.signInAnonymously).mockRejectedValue(mockError);

      try {
        await signInAnonymous();
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Error signing in anonymously:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('onAuthChange', () => {
    it('should subscribe to auth state changes', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firebaseAuth.onAuthStateChanged).mockReturnValue(mockUnsubscribe);

      const unsubscribe = onAuthChange(mockCallback);

      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(firebaseAuth.onAuthStateChanged).toHaveBeenCalledWith(expect.anything(), mockCallback);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with user when auth state changes', () => {
      const mockUser = {
        uid: 'test-uid-456',
        isAnonymous: true,
      };
      const mockCallback = vi.fn();

      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((auth, callback) => {
        // Immediately call the callback with mock user
        callback(mockUser as firebaseAuth.User);
        return vi.fn();
      });

      onAuthChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(mockUser);
    });

    it('should call callback with null when user signs out', () => {
      const mockCallback = vi.fn();

      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((auth, callback) => {
        // Immediately call the callback with null (signed out)
        callback(null);
        return vi.fn();
      });

      onAuthChange(mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user if signed in', () => {
      const mockUser = {
        uid: 'current-user-789',
        isAnonymous: true,
      };

      mockAuth.currentUser = mockUser;

      const user = getCurrentUser();

      expect(user).toEqual(mockUser);
    });

    it('should return null if no user is signed in', () => {
      mockAuth.currentUser = null;

      const user = getCurrentUser();

      expect(user).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockAuth.signOut.mockResolvedValue(undefined);

      await signOut();

      expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should throw error if sign out fails', async () => {
      const mockError = new Error('Sign out failed');
      mockAuth.signOut.mockRejectedValue(mockError);

      await expect(signOut()).rejects.toThrow('Sign out failed');
      expect(mockAuth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should log error to console when sign out fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Network error during sign out');
      mockAuth.signOut.mockRejectedValue(mockError);

      try {
        await signOut();
      } catch (error) {
        // Expected to throw
      }

      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should handle full sign in → get user → sign out flow', async () => {
      const mockUser = {
        uid: 'flow-test-user',
        isAnonymous: true,
      };

      const mockUserCredential = {
        user: mockUser,
      };

      // Sign in
      vi.mocked(firebaseAuth.signInAnonymously).mockResolvedValue(
        mockUserCredential as firebaseAuth.UserCredential
      );
      const signedInUser = await signInAnonymous();
      expect(signedInUser).toEqual(mockUser);

      // Set current user
      mockAuth.currentUser = mockUser;
      const currentUser = getCurrentUser();
      expect(currentUser).toEqual(mockUser);

      // Sign out
      mockAuth.signOut.mockResolvedValue(undefined);
      await signOut();
      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should handle auth state changes during user session', () => {
      const mockUser1 = { uid: 'user1', isAnonymous: true };
      const mockUser2 = { uid: 'user2', isAnonymous: true };
      const mockCallback = vi.fn();

      let authCallback: ((user: firebaseAuth.User | null) => void) | null = null;

      vi.mocked(firebaseAuth.onAuthStateChanged).mockImplementation((auth, callback) => {
        authCallback = callback;
        return vi.fn();
      });

      onAuthChange(mockCallback);

      // Simulate auth state changes
      authCallback?.(mockUser1 as firebaseAuth.User);
      expect(mockCallback).toHaveBeenCalledWith(mockUser1);

      authCallback?.(mockUser2 as firebaseAuth.User);
      expect(mockCallback).toHaveBeenCalledWith(mockUser2);

      authCallback?.(null);
      expect(mockCallback).toHaveBeenCalledWith(null);

      expect(mockCallback).toHaveBeenCalledTimes(3);
    });
  });
});
