import { atom } from 'jotai';
import { User } from '../shared/types/User';

// This type defines the possible states of our authentication process.
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * @atom authStatusAtom
 * Manages the global authentication status.
 * 'loading': The app is currently trying to determine the auth state (e.g., on initial load).
 * 'authenticated': The user is successfully logged in.
 * 'unauthenticated': The user is not logged in.
 */
export const authStatusAtom = atom<AuthStatus>('loading');

/**
 * @atom userAtom
 * Stores the authenticated user's data.
 * It will hold the full User object if authenticated, otherwise null.
 * This is a much more secure and manageable approach than localStorage.
 */
export const userAtom = atom<User | null>(null);
