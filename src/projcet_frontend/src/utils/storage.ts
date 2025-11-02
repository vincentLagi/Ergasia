import { User } from '../shared/types/User';

const CURRENT_USER_KEY = 'current_user';
const SESSION_KEY = 'session';

// Helper to handle BigInt serialization
const replacer = (key: string, value: any) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
};

export const storage = {
  setUser: (user: any) => {
    try {
      // Hapus gambar profil sebelum menyimpan untuk menghindari penyimpanan data biner
      const { profilePicture, ...userToStore } = user;
      const userString = JSON.stringify(userToStore, replacer);
      localStorage.setItem(CURRENT_USER_KEY, userString);
    } catch (error) {
      console.error("Failed to set user in localStorage:", error);
    }
  },
  getUser: (): User | null => {
    try {
      const userString = localStorage.getItem(CURRENT_USER_KEY);
      if (!userString) return null;
      
      const userData = JSON.parse(userString);
      
      // Kembalikan data pengguna tanpa gambar profil; ini akan diambil secara terpisah
      return {
        ...userData,
        id: String(userData.id),
        createdAt: BigInt(userData.createdAt || '0'),
        updatedAt: BigInt(userData.updatedAt || '0'),
        profilePicture: null, // Selalu null dari localStorage
        chatTokens: userData.chatTokens || {
          availableTokens: 0,
          dailyFreeRemaining: 0,
          lastTokenReset: 0,
          totalTokensEarned: 0,
          totalTokensSpent: 0,
        },
      };
    } catch (error) {
      console.error("Failed to get user from localStorage:", error);
      return null;
    }
  },
  setSession: (session: any) => {
    try {
      // If session is already a string, store it directly. Otherwise, stringify it.
      const sessionToStore = typeof session === 'string' ? session : JSON.stringify(session);
      localStorage.setItem(SESSION_KEY, sessionToStore);
    } catch (error) {
      console.error("Failed to set session in localStorage:", error);
    }
  },
  getSession: (): string | null => {
    try {
      const sessionString = localStorage.getItem(SESSION_KEY);
      if (!sessionString) return null;
      let cleanedSession = sessionString;
      // Repeatedly unescape and unquote until the string no longer changes
      while (true) {
        const prevCleanedSession = cleanedSession;
        try {
          // Try to parse if it's a JSON string (e.g., "\"abc\"")
          const parsed = JSON.parse(cleanedSession);
          if (typeof parsed === 'string') {
            cleanedSession = parsed;
          } else {
            // If it's not a string after parsing, revert and break
            cleanedSession = prevCleanedSession;
            break;
          }
        } catch (e) {
          // If JSON.parse fails, it's not a JSON string, so just remove outer quotes/backslashes
          cleanedSession = cleanedSession.replace(/^"|"$/g, '').replace(/^\\|\\$/g, '');
        }
        if (cleanedSession === prevCleanedSession) {
          break; // No more changes, stop
        }
      }
      return cleanedSession;
    } catch (error) {
      console.error("Failed to get session from localStorage:", error);
      // Fallback to a simpler cleanup if parsing fails
      return localStorage.getItem(SESSION_KEY)?.replace(/^"|"$/g, '').replace(/^\\|\\$/g, '') || null;
    }
  },
  clear: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(SESSION_KEY);
  },
};