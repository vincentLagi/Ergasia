import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import { getAllUsers } from '../../controller/userController';
import { createInbox } from '../../controller/inboxController';
import { User } from '../types/User';
import { createInvitation } from '../../controller/invitationController';
import { isFreelancerRegistered } from '../../controller/jobTransactionController';

interface UseUserManagementReturn {
  // Data
  allUsers: User[];
  searchUsers: User[];
  
  // State
  loading: boolean;
  
  // Actions
  fetchAllUsers: () => Promise<void>;
  searchUsersByUsername: (searchText: string) => void;
  sendInvitation: (userId: string, currentUserId: string, jobId?: string) => Promise<boolean>;
  clearSearch: () => void;
}

export const useUserManagement = (): UseUserManagementReturn => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchUsers, setSearchUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  
  // Fetch all users (cached after first load)
  const fetchAllUsers = useCallback(async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      console.log(users)
      if (users) {
        setAllUsers(users);
      }
      // console.log("user dari hooks", users)
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Search users by username (client-side filtering for performance)
  const searchUsersByUsername = useCallback((searchText: string) => {
    if (!searchText.trim()) {
      setSearchUsers([]);
      return;
    }
    
    const filtered = allUsers.filter(user =>
      user.username?.toLowerCase().includes(searchText.toLowerCase())
    ).slice(0, 10); // Limit to 10 results for performance
    
    setSearchUsers(filtered);
  }, [allUsers]);

  // Send invitation to user
  const sendInvitation = useCallback(async (
    userId: string,
    currentUserId: string,
    jobId?: string
  ): Promise<boolean> => {
    try {
      await createInbox(userId, jobId ? jobId : '', currentUserId, 'invitation', 'request');
      if (jobId) {

        const checkApplied = await isFreelancerRegistered(jobId, userId)
        console.log(checkApplied)
        if(checkApplied[0] == "succ" && checkApplied[1] == "true"){
          message.error('This freelancer already accepted in this job')
          return false
        }
        
        const result = await createInvitation(jobId, userId, currentUserId)
        
        
        if (result[0] === 'Success') {
          message.success(`Invitation sent successfully!`);
        } else {
          message.error(result[1] || 'Failed to create invitation. Please try again.');
        }
      }else{
        message.error('Failed to create invitation. Please try again.');
      }
      return true;
    } catch (error) {
      console.error('Error sending invitation:', error);
      message.error('Failed to send invitation.');
      return false;
    }
  }, []);

  // Clear search results
  const clearSearch = useCallback(() => {
    setSearchUsers([]);
  }, []);

  // Auto-fetch users on mount
  useEffect(() => {
    fetchAllUsers();
  }, []);

  return {
    // Data
    allUsers,
    searchUsers,
    // State
    loading,
    
    // Actions
    fetchAllUsers,
    searchUsersByUsername,
    sendInvitation,
    clearSearch,
  };
};