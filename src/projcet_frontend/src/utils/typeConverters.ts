// Utility functions to convert between backend and frontend types

// Define a union type for BackendUser to handle both old and new formats
type BackendUserOld = {
  'id': string,
  'dob': string,
  'subAccount': [] | [Uint8Array | number[]],
  'username': string,
  'isFaceRecognitionOn': boolean,
  'createdAt': bigint,
  'isProfileCompleted': boolean,
  'chatTokens': any,
  'description': string,
  'preference': any[],
  'updatedAt': bigint,
  'profilePicture': Uint8Array | number[],
  'wallet': number,
  'rating': number,
};

type BackendUserNew = {
  'id': string,
  'dob': string,
  'subAccount': [] | [Uint8Array | number[]],
  'username': string,
  'isFaceRecognitionOn': boolean,
  'createdAt': bigint,
  'isProfileCompleted': boolean,
  'chatTokens': any,
  'description': string,
  'preference': any[],
  'updatedAt': bigint,
  'profilePictureUrl': [] | [string],
  'wallet': number,
  'rating': number,
};

type BackendUser = BackendUserOld | BackendUserNew;

import { Job as BackendJob } from '../../../declarations/projcet_backend_single/projcet_backend_single.did';
import { Job as FrontendJob, JobCategory } from '../shared/types/Job';
import { User as FrontendUser } from '../shared/types/User';

/**
 * Convert backend Job type to frontend Job type
 */
export function backendJobToFrontendJob(backendJob: BackendJob): FrontendJob {
  // Convert subAccount properly
  let subAccount: [] | [Uint8Array] = [];
  if (backendJob.subAccount.length > 0) {
    const account = backendJob.subAccount[0];
    if (account instanceof Uint8Array) {
      subAccount = [account];
    } else if (Array.isArray(account)) {
      subAccount = [new Uint8Array(account)];
    }
  }

  return {
    id: backendJob.id,
    jobName: backendJob.jobName,
    jobDescription: backendJob.jobDescription,
    jobTags: backendJob.jobTags as JobCategory[],
    jobSalary: backendJob.jobSalary,
    jobSlots: backendJob.jobSlots,
    jobStatus: backendJob.jobStatus as FrontendJob['jobStatus'], // Type assertion since we know the values match
    jobRating: backendJob.jobRating,
    userId: backendJob.userId,
    wallet: backendJob.wallet,
    createdAt: backendJob.createdAt,
    updatedAt: backendJob.updatedAt,
    subAccount: subAccount,
  };
}

/**
 * Convert backend User type to frontend User type
 */
export function backendUserToFrontendUser(backendUser: BackendUser): FrontendUser {
  // Convert subAccount properly
  let subAccount: [] | [Uint8Array] = [];
  if (backendUser.subAccount.length > 0) {
    const account = backendUser.subAccount[0];
    if (account instanceof Uint8Array) {
      subAccount = [account];
    } else if (Array.isArray(account)) {
      subAccount = [new Uint8Array(account)];
    }
  }

  // Convert chatTokens from bigint to number
  const chatTokens = {
    availableTokens: Number(backendUser.chatTokens.availableTokens),
    dailyFreeRemaining: Number(backendUser.chatTokens.dailyFreeRemaining),
    lastTokenReset: Number(backendUser.chatTokens.lastTokenReset),
    totalTokensEarned: Number(backendUser.chatTokens.totalTokensEarned),
    totalTokensSpent: Number(backendUser.chatTokens.totalTokensSpent),
  };

  // Handle both profilePicture (old format) and profilePictureUrl (new format)
  let profilePictureUrl: string | null = null;
  if ('profilePictureUrl' in backendUser) {
    // New format
    profilePictureUrl = backendUser.profilePictureUrl[0] || null;
  } else if ('profilePicture' in backendUser) {
    // Old format - convert Uint8Array to data URL
    const profilePicture = backendUser.profilePicture;
    if (profilePicture && profilePicture.length > 0) {
      // For now, just set to null since we can't easily convert Uint8Array to URL here
      // This should be handled by the profile picture service
      profilePictureUrl = null;
    }
  }

  return {
    id: backendUser.id,
    profilePictureUrl: profilePictureUrl,
    username: backendUser.username,
    dob: backendUser.dob,
    preference: backendUser.preference,
    description: backendUser.description,
    wallet: backendUser.wallet,
    rating: backendUser.rating,
    createdAt: backendUser.createdAt,
    updatedAt: backendUser.updatedAt,
    isFaceRecognitionOn: backendUser.isFaceRecognitionOn,
    isProfileCompleted: backendUser.isProfileCompleted,
    subAccount: subAccount,
    chatTokens: chatTokens,
  };
}

/**
 * Convert array of backend Jobs to frontend Jobs
 */
export function backendJobsToFrontendJobs(backendJobs: BackendJob[]): FrontendJob[] {
  return backendJobs.map(backendJobToFrontendJob);
}

/**
 * Convert array of backend Users to frontend Users
 */
export function backendUsersToFrontendUsers(backendUsers: BackendUser[]): FrontendUser[] {
  return backendUsers.map(backendUserToFrontendUser);
}
