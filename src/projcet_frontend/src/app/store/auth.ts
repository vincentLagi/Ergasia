import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { User } from '../../shared/types/User';

// Auth status type
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Base atoms
export const authStatusAtom = atom<AuthStatus>('loading');
export const userAtom = atom<User | null>(null);
export const sessionAtom = atomWithStorage<string | null>('session', null);

// Derived atoms
export const isLoadingAtom = atom((get) => get(authStatusAtom) === 'loading');
export const isAuthenticatedAtom = atom((get) => get(authStatusAtom) === 'authenticated');
export const isUnauthenticatedAtom = atom((get) => get(authStatusAtom) === 'unauthenticated');

// User profile atoms
export const userIdAtom = atom((get) => get(userAtom)?.id || null);
export const userNameAtom = atom((get) => get(userAtom)?.username || '');
export const userProfilePictureAtom = atom((get) => get(userAtom)?.profilePictureUrl || null);
export const userPreferencesAtom = atom((get) => get(userAtom)?.preference || []);
export const userWalletAtom = atom((get) => get(userAtom)?.wallet || 0);
export const userRatingAtom = atom((get) => get(userAtom)?.rating || 0);

// Profile completion atoms
export const isProfileCompletedAtom = atom((get) => {
  const user = get(userAtom);
  return user?.isProfileCompleted || false;
});

export const needsProfileCompletionAtom = atom((get) => {
  const user = get(userAtom);
  const isAuthenticated = get(isAuthenticatedAtom);
  return isAuthenticated && user && !user.isProfileCompleted;
});

// Auth actions atom
export const authActionsAtom = atom(
  null,
  (get, set, action: { 
    type: 'LOGIN'; 
    user: User; 
    session?: string;
  } | { 
    type: 'LOGOUT' 
  } | { 
    type: 'SET_LOADING' 
  } | {
    type: 'UPDATE_USER';
    user: Partial<User>;
  }) => {
    switch (action.type) {
      case 'LOGIN':
        set(userAtom, action.user);
        set(authStatusAtom, 'authenticated');
        if (action.session) {
          set(sessionAtom, action.session);
        }
        break;
      case 'LOGOUT':
        set(userAtom, null);
        set(authStatusAtom, 'unauthenticated');
        set(sessionAtom, null);
        // Clear localStorage
        localStorage.removeItem('current_user');
        localStorage.removeItem('session');
        break;
      case 'SET_LOADING':
        set(authStatusAtom, 'loading');
        break;
      case 'UPDATE_USER':
        const currentUser = get(userAtom);
        if (currentUser) {
          set(userAtom, { ...currentUser, ...action.user });
        }
        break;
    }
  }
);

// Face recognition atoms
export const faceRecognitionEnabledAtom = atom((get) => {
  const user = get(userAtom);
  return user?.isFaceRecognitionOn || false;
});

// Authentication state persistence
export const persistedAuthStateAtom = atom(
  (get) => ({
    user: get(userAtom),
    session: get(sessionAtom),
    authStatus: get(authStatusAtom),
  }),
  (get, set, newState: { user: User | null; session: string | null; authStatus: AuthStatus }) => {
    set(userAtom, newState.user);
    set(sessionAtom, newState.session);
    set(authStatusAtom, newState.authStatus);
  }
);