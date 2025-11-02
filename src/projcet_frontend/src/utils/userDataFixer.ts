import { User } from "../shared/types/User";
import { storage } from "./storage";

/**
 * Fixes common issues with user data in localStorage
 * 
 * @returns The fixed user object or null if unable to fix
 */
export async function fixUserData(): Promise<User | null> {
  try {
    console.log('Attempting to fix user data...');
    
    // Get raw user data from localStorage
    const rawUserData = localStorage.getItem('current_user');
    if (!rawUserData) {
      console.log('No user data found in localStorage to fix');
      return null;
    }
    
    // Parse the user data
    let userData: any;
    try {
      userData = JSON.parse(rawUserData);
      console.log('Successfully parsed user data:', userData);
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return null;
    }
    
    // Check for different user data structures and fix them
    let fixedUser: any;
    
    if (userData.ok && typeof userData.ok === 'object') {
      // Case 1: User data is nested in an "ok" property
      console.log('User data is nested in "ok" property');
      fixedUser = userData.ok;
    } else if (userData.id) {
      // Case 2: User data is directly in the object
      console.log('User data is directly in the object');
      fixedUser = userData;
    } else {
      console.error('Unable to identify user data structure');
      return null;
    }
    
    // Ensure required fields exist
    if (!fixedUser.id) {
      console.error('Fixed user data is missing ID');
      return null;
    }
    
    // Create proper User object
    const user: User = {
      id: fixedUser.id,
      profilePictureUrl: null, // Don't store blob in localStorage
      username: fixedUser.username || 'User',
      dob: fixedUser.dob || '',
      preference: fixedUser.preference || [],
      description: fixedUser.description || '',
      wallet: fixedUser.wallet || 0,
      rating: fixedUser.rating || 0,
      createdAt: BigInt(fixedUser.createdAt || '0'),
      updatedAt: BigInt(fixedUser.updatedAt || '0'),
      isFaceRecognitionOn: fixedUser.isFaceRecognitionOn || false,
      isProfileCompleted: fixedUser.isProfileCompleted || false,
      subAccount: fixedUser.subAccount || [],
      chatTokens: fixedUser.chatTokens || {
        availableTokens: 5,
        dailyFreeRemaining: 5,
        lastTokenReset: Date.now(),
        totalTokensEarned: 5,
        totalTokensSpent: 0,
      }
    };
    
    // Save the fixed user data
    await storage.setUser(user);
    console.log('User data fixed and saved:', user);
    
    return user;
  } catch (error) {
    console.error('Error fixing user data:', error);
    return null;
  }
}
