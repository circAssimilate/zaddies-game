import { getAuth, signInAnonymously, onAuthStateChanged, User, Auth } from 'firebase/auth';
import { app } from './config';

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

/**
 * Sign in anonymously for friend games
 * Players will be identified by display name they choose
 */
export async function signInAnonymous(): Promise<User> {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in anonymously:', error);
    throw error;
  }
}

/**
 * Subscribe to auth state changes
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser;
}

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  try {
    await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
