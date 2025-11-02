import { AuthClient } from "@dfinity/auth-client";
import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { User } from "../shared/types/User";
import { UpdateUserPayload, CashFlowHistory, User as BackendUser, JobCategory } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { HttpAgent } from "@dfinity/agent";
import { agentService } from "../singleton/agentService";
import { storage } from "../utils/storage";
import { ProfilePictureService } from "../services/profilePictureService";

// Helper untuk memproses URL profile picture dari backend
const processProfilePictureUrl = (profilePictureUrl: BackendUser['profilePictureUrl']): string | null => {
  try {
    if (profilePictureUrl && profilePictureUrl.length > 0 && profilePictureUrl[0]) {
      const url = profilePictureUrl[0];
      console.log('Profile picture URL from backend:', url);
      return url;
    }

    console.log('No profile picture URL');
    return ProfilePictureService.getDefaultProfilePictureUrl();
  } catch (error) {
    console.error('Error processing profile picture URL:', error);
    return ProfilePictureService.getDefaultProfilePictureUrl();
  }
};

// Export untuk ProfilePage
export const getProfilePictureUrl = processProfilePictureUrl;

const convertBackendUserToFrontend = (userData: BackendUser): User => {

    // Handle Motoko record format
    const chatTokens = (userData as any).chatTokens;
    let tokensData: any = {
        availableTokens: 5,
        dailyFreeRemaining: 5,
        lastTokenReset: Date.now(),
        totalTokensEarned: 5,
        totalTokensSpent: 0,
    };

    if (chatTokens) {
        // Handle different possible formats
        if (typeof chatTokens === 'object') {
            // If it's a record/object
            tokensData.availableTokens = chatTokens.availableTokens ?? chatTokens['availableTokens'] ?? 5;
            tokensData.dailyFreeRemaining = chatTokens.dailyFreeRemaining ?? chatTokens['dailyFreeRemaining'] ?? 5;
            tokensData.lastTokenReset = chatTokens.lastTokenReset ?? chatTokens['lastTokenReset'] ?? Date.now();
            tokensData.totalTokensEarned = chatTokens.totalTokensEarned ?? chatTokens['totalTokensEarned'] ?? 5;
            tokensData.totalTokensSpent = chatTokens.totalTokensSpent ?? chatTokens['totalTokensSpent'] ?? 0;
        } else if (Array.isArray(chatTokens)) {
            // If it's an array format, use defaults
            tokensData = {
                availableTokens: 5,
                dailyFreeRemaining: 5,
                lastTokenReset: Date.now(),
                totalTokensEarned: 5,
                totalTokensSpent: 0,
            };
        }
    }

    // Convert to proper number format
    Object.keys(tokensData).forEach(key => {
        if (typeof tokensData[key] === 'bigint' || typeof tokensData[key] === 'string') {
            tokensData[key] = Number(tokensData[key]);
        }
    });

    const finalUserData = {
        id: userData.id,
        profilePictureUrl: processProfilePictureUrl(userData.profilePictureUrl),
        username: userData.username,
        dob: userData.dob,
        preference: userData.preference ? userData.preference.map((pref: any) => ({
            id: pref.id.toString(),
            jobCategoryName: pref.jobCategoryName
        })) : [],
        description: userData.description,
        wallet: userData.wallet,
        rating: userData.rating,
        createdAt: BigInt(userData.createdAt),
        updatedAt: BigInt(userData.updatedAt),
        isFaceRecognitionOn: userData.isFaceRecognitionOn,
        isProfileCompleted: userData.isProfileCompleted,
        subAccount: userData.subAccount && userData.subAccount.length > 0 ? [Array.isArray(userData.subAccount[0]) ? new Uint8Array(userData.subAccount[0]) : userData.subAccount[0] as Uint8Array] as [Uint8Array] : [] as [],
        chatTokens: tokensData,
    };

    // Final user data converted

    return finalUserData;
}

// Force refresh user data from backend
export const forceRefreshUserData = async (): Promise<User | null> => {
    try {
        const result = await fetchUserBySession();
        if (result) {
            storage.setUser(result);
            return result;
        }
        return null;
    } catch (error) {
        console.error('Error refreshing user data:', error);
        return null;
    }
};

export const getCookie = (name: string): string | null => {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.split("=");
        if (key === name) {
            return decodeURIComponent(valueParts.join("="));
        }
    }
    return null;
};

export const validateCookie = async (): Promise<boolean> => {
    // Implementasi validateCookie Anda di sini jika diperlukan, atau kembalikan true/false
    // Untuk saat ini, kita asumsikan sesi valid jika ada.
    return !!storage.getSession();
};

export const loginWithInternetIdentity = async (): Promise<{ success: boolean; user?: User; needsProfileCompletion?: boolean }> => {
    try {
        const authClient = await AuthClient.create({
            idleOptions: {
                idleTimeout: 1000 * 60 * 60 * 8, // 8 hours session
                disableDefaultIdleCallback: true,
            },
        });

        await new Promise((resolve, reject) => {
            authClient.login({
                identityProvider: "https://identity.ic0.app/",
                onSuccess: resolve,
                onError: reject,
            });
        });

        const identity = authClient.getIdentity();
        const principalId = identity.getPrincipal().toString();
        
        const defaultProfilePictureUrl = ProfilePictureService.getDefaultProfilePictureUrl();
        
        let userDetailResult = await projcet_backend_single.getUserById(principalId);

        if (!("ok" in userDetailResult)) {
            await projcet_backend_single.createUser(principalId, [defaultProfilePictureUrl]);
            userDetailResult = await projcet_backend_single.getUserById(principalId);
        }

        if ("ok" in userDetailResult) {
            const userData = userDetailResult.ok;
            const convertedUser = convertBackendUserToFrontend(userData);

            storage.clear();
            storage.setUser(convertedUser);
            // Simulasikan sesi sederhana
            storage.setSession(principalId);

            const needsCompletion = !convertedUser.isProfileCompleted;
            return {
                success: true,
                user: convertedUser,
                needsProfileCompletion: needsCompletion,
            };
        } else {
            console.error("Error fetching or creating user:", userDetailResult.err);
            return { success: false };
        }
    } catch (err) {
        console.error("Login request failed:", err);
        return { success: false };
    }
};

// New: Login using Face Recognition principal without opening Internet Identity
export const loginWithFace = async (principalId: string): Promise<{ success: boolean; user?: User; needsProfileCompletion?: boolean }> => {
    try {
        const defaultProfilePictureUrl = ProfilePictureService.getDefaultProfilePictureUrl();

        // Try to get or create the user for this principal
        let userDetailResult = await projcet_backend_single.getUserById(principalId);

        if (!("ok" in userDetailResult)) {
            await projcet_backend_single.createUser(principalId, [defaultProfilePictureUrl]);
            userDetailResult = await projcet_backend_single.getUserById(principalId);
        }

        if ("ok" in userDetailResult) {
            const userData = userDetailResult.ok;
            const convertedUser = convertBackendUserToFrontend(userData);

            // Store session and user without requiring II
            storage.clear();
            storage.setUser(convertedUser);
            storage.setSession(principalId);

            const needsCompletion = !convertedUser.isProfileCompleted;
            return {
                success: true,
                user: convertedUser,
                needsProfileCompletion: needsCompletion,
            };
        } else {
            console.error("Error fetching or creating user (face login):", (userDetailResult as any).err);
            return { success: false };
        }
    } catch (err) {
        console.error("Face login failed:", err);
        return { success: false };
    }
};

export const logout = async (): Promise<void> => {
    const authClient = await AuthClient.create({
        idleOptions: {
            idleTimeout: 1000 * 60 * 60 * 8, // 8 hours session
            disableDefaultIdleCallback: true,
        },
    });
    await authClient.logout();
    storage.clear();
};

export const fetchUserBySession = async (): Promise<User | null> => {
    try {
        // Try Internet Identity session first
        const authClient = await AuthClient.create({
            idleOptions: {
                idleTimeout: 1000 * 60 * 60 * 8, // 8 hours session
                disableDefaultIdleCallback: true,
            },
        });

        if (await authClient.isAuthenticated()) {
            const identity = authClient.getIdentity();
            const principalId = identity.getPrincipal().toString();
            const userRes = await projcet_backend_single.getUserById(principalId);

            if ("ok" in userRes) {
                const convertedUser = convertBackendUserToFrontend(userRes.ok);
                storage.setUser(convertedUser);
                storage.setSession(principalId);
                return convertedUser;
            } else {
                console.error("Error fetching user:", userRes.err);
            }
        }

        // Fallback: use locally stored session (face login or persisted session)
        const storedSessionPrincipal = storage.getSession();
        if (storedSessionPrincipal) {
            let userDetailResult = await projcet_backend_single.getUserById(storedSessionPrincipal);
            if (!("ok" in userDetailResult)) {
                // Auto create if missing to mirror II behavior
                const defaultProfilePictureUrl = ProfilePictureService.getDefaultProfilePictureUrl();
                await projcet_backend_single.createUser(storedSessionPrincipal, [defaultProfilePictureUrl]);
                userDetailResult = await projcet_backend_single.getUserById(storedSessionPrincipal);
            }
            if ("ok" in userDetailResult) {
                const convertedUser = convertBackendUserToFrontend(userDetailResult.ok);
                storage.setUser(convertedUser);
                return convertedUser;
            }
        }

        return null;
    } catch (error) {
        console.error("fetchUserBySession error:", error);
        return null;
    }
};

export const updateUserProfile = async (payload: Partial<User>): Promise<boolean> => {
    try {
        console.log('updateUserProfile called with payload:', payload);
        
        // Get current user session
        const session = storage.getSession();
        const currentUser = storage.getUser();
        
        if (!session || !currentUser) {
            console.error('No valid session or user found');
            return false;
        }

        const updatePayload: UpdateUserPayload = {
            username: [],
            dob: [],
            description: [],
            preference: [],
            isProfileCompleted: [],
            profilePictureUrl: []
        };
        
        if (payload.username !== undefined) {
            updatePayload.username = [payload.username];
        }
        
        if (payload.dob !== undefined) {
            updatePayload.dob = [payload.dob];
        }
        
        if (payload.description !== undefined) {
            updatePayload.description = [payload.description];
        }
        
        if (payload.preference !== undefined && payload.preference.length > 0) {
            console.log('Processing preferences:', payload.preference);
            // Convert JobCategory array to backend format
            const backendPreferences = payload.preference.map(pref => {
                console.log('Processing preference:', pref);
                return {
                    id: String(pref.id), // Ensure string conversion
                    jobCategoryName: pref.jobCategoryName
                };
            });
            console.log('Backend preferences prepared:', backendPreferences);
            updatePayload.preference = [backendPreferences];
        }
        
        if (payload.isProfileCompleted !== undefined) {
            updatePayload.isProfileCompleted = [payload.isProfileCompleted];
        }

        // Handle profile picture upload to Supabase if provided
        if (payload.profilePicture && payload.profilePicture instanceof File) {
            try {
                console.log('Uploading profile picture...');
                const uploadResult = await ProfilePictureService.uploadWithFallback(payload.profilePicture, currentUser.id);
                
                if (!uploadResult.url) {
                    console.error('Profile picture upload failed:', uploadResult.error);
                    throw new Error(uploadResult.error);
                }
                
                if (uploadResult.error) {
                    console.warn('Profile picture uploaded with fallback:', uploadResult.error);
                } else {
                    console.log('Profile picture uploaded successfully:', uploadResult.url);
                }
                
                updatePayload.profilePictureUrl = [uploadResult.url];
            } catch (error) {
                console.error('Error uploading profile picture:', error);
                throw error; // Renpmthrow to show user the error
            }
        }

        console.log('Sending update payload to backend:', JSON.stringify(updatePayload, null, 2));
        
        const agent = await agentService.getAgent();
        
        const result = await projcet_backend_single.updateUser(currentUser.id, updatePayload);
        
        console.log('Backend update result:', result);
        
        if ('ok' in result) {
            console.log('Profile updated successfully');
            
            const updatedUser = convertBackendUserToFrontend(result.ok);
            storage.setUser(updatedUser);

            return true;
        } else {
            console.error('Backend update failed:', result.err);
            return false;
        }
        
    } catch (error) {
        console.error('updateUserProfile error:', error);
        return false;
    }
};

export const isAuthenticated = (): boolean => {
  return !!storage.getSession() && !!storage.getUser();
};

export const getCurrentUser = (): User | null => {
  return storage.getUser();
};

export const needsProfileCompletion = (): boolean => {
  const user = getCurrentUser();
  return user ? !user.isProfileCompleted : false;
};

// Fungsi lain yang mungkin Anda perlukan dari kode lama Anda
export const getAllUsers = async (): Promise<User[]> => {
    const users = await projcet_backend_single.getAllUsers()
    const listUser : User[]= []; 
    users.forEach(u => {
        
        const convertedUser = convertBackendUserToFrontend(u)
        listUser.push(convertedUser)
    });
    return listUser;
};
export const getUserById = async (userId: string): Promise<{ ok: User } | { err: string } | null> => {
    try {
        console.log('🔍 Fetching user by ID:', userId);
        const userResult = await projcet_backend_single.getUserById(userId);
        
        if ("ok" in userResult) {
            const convertedUser = convertBackendUserToFrontend(userResult.ok);
            console.log('✅ User fetched successfully:', convertedUser.username);
            return { ok: convertedUser };
        } else {
            console.warn('⚠️ User not found:', userId, userResult.err);
            return { err: userResult.err };
        }
    } catch (error) {
        console.error('❌ Error fetching user by ID:', error);
    return null;
    }
}
export const getUserByName = async (username: string): Promise<User | null> => {
    return null;
};
export const getUserTransaction = async (userId: string): Promise<CashFlowHistory[] | null> => {
    try {
        const result = await projcet_backend_single.getUserTransactions(userId);
        // console.log(result)
        return result;
    } catch (error) {
        console.error("Failed to get user transaction:", error);
        return null;
    }

}