import { AuthClient } from "@dfinity/auth-client";
import { User, AuthSession, ProfilePictureCache } from '../types/User';
import { 
  loginWithInternetIdentity as controllerLogin,
  validateCookie,
  fetchUserBySession,
  logout as controllerLogout,
  updateUserProfile as controllerUpdateProfile
} from '../../controller/userController';

class AuthService {
  private profilePictureCache: ProfilePictureCache = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async loginWithInternetIdentity(): Promise<{ success: boolean; user?: User; needsProfileCompletion?: boolean }> {
    try {
      const success = await controllerLogin();
      
      if (success) {
        // Get user data from localStorage (set by controller)
        const userData = this.getStoredUser();
        
        if (userData) {
          return {
            success: true,
            user: userData,
            needsProfileCompletion: !userData.isProfileCompleted,
          };
        }
      }

      return { success: false };
    } catch (error) {
      console.error('Internet Identity login failed:', error);
      return { success: false };
    }
  }

  async logout(): Promise<void> {
    try {
      await controllerLogout();
      this.clearProfilePictureCache();
    } catch (error) {
      console.error('Logout failed:', error);
      // Force clear local data even if backend call fails
      this.clearSession();
      this.clearUser();
      this.clearProfilePictureCache();
    }
  }

  async validateSession(): Promise<{ isValid: boolean; user?: User }> {
    try {
      const isValid = await validateCookie();
      
      if (isValid) {
        const userData = await fetchUserBySession();
        if (userData) {
          this.storeUser(userData);
          return { isValid: true, user: userData };
        }
      }

      return { isValid: false };
    } catch (error) {
      console.error('Session validation failed:', error);
      return { isValid: false };
    }
  }

  async updateUserProfile(payload: any): Promise<boolean> {
    try {
      await controllerUpdateProfile(payload);
      
      // Update cached user data
      const currentUser = this.getStoredUser();
      if (currentUser) {
        const updatedUser = { ...currentUser, ...payload };
        this.storeUser(updatedUser);
      }

      return true;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return false;
    }
  }

  // Profile picture caching for efficiency
  getProfilePictureUrl(userId: string, blob: Blob): string {
    const cached = this.profilePictureCache[userId];
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_DURATION) {
      return cached.url;
    }

    // Create new URL and cache it
    const url = URL.createObjectURL(blob);
    
    // Clean up old URL if exists
    if (cached) {
      URL.revokeObjectURL(cached.url);
    }

    this.profilePictureCache[userId] = {
      url,
      timestamp: now,
      blob,
    };

    return url;
  }

  clearProfilePictureCache(): void {
    Object.values(this.profilePictureCache).forEach(cached => {
      URL.revokeObjectURL(cached.url);
    });
    this.profilePictureCache = {};
  }

  // Session management
  private getStoredSession(): AuthSession | null {
    try {
      const stored = localStorage.getItem('session');
      if (!stored) return null;
      
      return {
        sessionId: stored,
        userId: '', // Will be populated when needed
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        isValid: true,
      };
    } catch {
      return null;
    }
  }

  private clearSession(): void {
    localStorage.removeItem('session');
    localStorage.removeItem('auth_session');
  }

  // User data management
  private storeUser(user: User): void {
    // Store user without blob data for localStorage
    const userForStorage = {
      ...user,
      profilePicture: null, // Don't store blob in localStorage
    };
    localStorage.setItem('current_user', JSON.stringify(userForStorage, (_, value) =>
      typeof value === "bigint" ? value.toString() : value
    ));
  }

  private getStoredUser(): User | null {
    try {
      const stored = localStorage.getItem('current_user');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      
      // Handle both old and new format
      if (parsed.ok) {
        const userData = parsed.ok;
        return {
          ...userData,
          createdAt: BigInt(userData.createdAt),
          updatedAt: BigInt(userData.updatedAt),
          profilePicture: null, // Will be loaded separately
        };
      } else {
        return {
          ...parsed,
          createdAt: BigInt(parsed.createdAt),
          updatedAt: BigInt(parsed.updatedAt),
          profilePicture: null, // Will be loaded separately
        };
      }
    } catch {
      return null;
    }
  }

  private clearUser(): void {
    localStorage.removeItem('current_user');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const session = this.getStoredSession();
    const user = this.getStoredUser();
    return session !== null && user !== null;
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.getStoredUser();
  }

  // Check if profile is completed
  needsProfileCompletion(): boolean {
    const user = this.getCurrentUser();
    return user ? !user.isProfileCompleted : false;
  }
}

export const authService = new AuthService();