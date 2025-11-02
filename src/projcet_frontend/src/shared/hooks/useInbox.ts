import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import {
  getAllInboxByUserId,
  markInboxAsRead,
} from '../../controller/inboxController';
import { InboxResponse } from '../types/Inbox';

interface UseInboxReturn {
  // Data
  messages: InboxResponse[];
  filteredMessages: InboxResponse[];
  unreadCount: number;
  
  // State
  loading: boolean;
  activeTab: string;
  
  // Actions
  fetchMessages: () => Promise<void>;
  handleMarkAsRead: (messageId: string) => Promise<boolean>;
  // handleAccept: (messageId: string) => Promise<boolean>;
  // handleReject: (messageId: string) => Promise<boolean>;
  setActiveTab: (tab: string) => void;
  refreshMessages: () => Promise<void>;
}

export const useInbox = (userId: string | undefined): UseInboxReturn => {
  const [messages, setMessages] = useState<InboxResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch inbox messages
  const fetchMessages = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const inboxData = await getAllInboxByUserId(userId);
      if (inboxData) {
        setMessages(inboxData);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      message.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Handle message read
  const handleMarkAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const success = await markInboxAsRead(messageId);
      if (success) {
        // Update local state immediately for better UX
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, read: true } : msg
        ));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }, []);

  // // Handle accept invitation/application
  // const handleAccept = useCallback(async (messageId: string): Promise<boolean> => {
  //   try {
  //     const success = await acceptInbox(messageId);
  //     if (success) {
  //       message.success('Accepted successfully!');
  //       await fetchMessages(); // Refresh messages
  //       return true;
  //     } else {
  //       message.error('Failed to accept.');
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error accepting:', error);
  //     message.error('Failed to accept.');
  //     return false;
  //   }
  // }, [fetchMessages]);

  // // Handle reject invitation/application
  // const handleReject = useCallback(async (messageId: string): Promise<boolean> => {
  //   try {
  //     const success = await rejectInbox(messageId);
  //     if (success) {
  //       message.success('Rejected successfully!');
  //       await fetchMessages(); // Refresh messages
  //       return true;
  //     } else {
  //       message.error('Failed to reject.');
  //       return false;
  //     }
  //   } catch (error) {
  //     console.error('Error rejecting:', error);
  //     message.error('Failed to reject.');
  //     return false;
  //   }
  // }, [fetchMessages]);

  // Refresh messages manually
  const refreshMessages = useCallback(async () => {
    await fetchMessages();
  }, [fetchMessages]);

  // Filter messages based on active tab
  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !msg.read;
    if (activeTab === 'applications') return msg.message.includes('application');
    if (activeTab === 'invitations') return msg.message.includes('invitation');
    if (activeTab === 'submissions') return msg.message.includes('submission');
    return true;
  });

  // Get unread count
  const unreadCount = messages.filter(msg => !msg.read).length;

  // Initialize data on mount or when userId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  return {
    // Data
    messages,
    filteredMessages,
    unreadCount,
    
    // State
    loading,
    activeTab,
    
    // Actions
    fetchMessages,
    handleMarkAsRead,
    // handleAccept,
    // handleReject,
    setActiveTab,
    refreshMessages,
  };
};