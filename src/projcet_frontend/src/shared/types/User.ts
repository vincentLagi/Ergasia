import { JobCategory } from './Job';

export interface ChatTokenBalance {
  availableTokens: number;
  dailyFreeRemaining: number;
  lastTokenReset: number;
  totalTokensEarned: number;
  totalTokensSpent: number;
}

export interface User {
  id: string;
  profilePictureUrl: string | null;
  username: string;
  dob: string;
  preference: JobCategory[];
  description: string;
  wallet: number;
  rating: number;
  createdAt: bigint;
  updatedAt: bigint;
  isFaceRecognitionOn: boolean;
  isProfileCompleted: boolean;
  subAccount: [Uint8Array] | [];
  chatTokens: ChatTokenBalance;
  // Legacy field for backward compatibility - will be removed
  profilePicture?: Blob | null;
}

export interface UserProfile extends User {
  skills?: string[];
  experienceLevel?: string;
  availability?: string;
  location?: string;
  hourlyRate?: number;
  completedJobs?: number;
}

export interface UpdateUserPayload {
  username?: [] | [string];
  profilePictureUrl?: [] | [string];
  description?: [] | [string];
  dob?: [] | [string];
  preference?: [] | [JobCategory[]];
  isProfileCompleted?: [] | [boolean];
}

// For efficient profile picture handling
export interface ProfilePictureCache {
  [userId: string]: {
    url: string;
    timestamp: number;
    blob: Blob;
  };
}

// Session management
export interface AuthSession {
  sessionId: string;
  userId: string;
  expiresAt: number;
  isValid: boolean;
}