import { useState, useEffect, useCallback } from 'react';
import { useAtom } from 'jotai';
import { ChatRoom, Message } from '../config/supabase';
import ChatService from '../services/chatService';
import { useAuth } from './useAuth';
import { currentChatRoomAtom } from '../app/store/chat';
import { supabase } from '../config/supabase';

interface UseChatReturn {
  rooms: ChatRoom[];
  currentRoom: ChatRoom | null;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  typingUsers: string[];
  setCurrentRoom: (room: ChatRoom | null) => void;
  sendMessage: (content: string) => Promise<boolean>;
  sendPhotoMessage: (file: File, caption?: string) => Promise<boolean>;
  setTyping: (isTyping: boolean) => void;
  loadMoreMessages: () => Promise<void>;
  markAsRead: () => Promise<void>;
  canAccessJob: (jobId: string) => Promise<boolean>;
  initializeChatForJob: (jobId: string, clientId: string, freelancerId: string) => Promise<ChatRoom | null>;
  // AI Assistant features
  aiAssistActive: boolean;
  setAiAssistActive: (active: boolean) => void;
  aiSuggestions: Array<{preview: string, text: string}>;
  setAiSuggestions: (suggestions: Array<{preview: string, text: string}>) => void;
  getAiSuggestions: (draftText: string) => Promise<void>;
}

export const useChat = (): UseChatReturn => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useAtom(currentChatRoomAtom);
  
  // Debug current room changes
  useEffect(() => {
    console.log('🏠 useChat - currentRoom changed:', currentRoom?.id);
  }, [currentRoom]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // AI Assistant state
  const [aiAssistActive, setAiAssistActive] = useState<boolean>(false);
  const [aiSuggestions, setAiSuggestions] = useState<Array<{preview: string, text: string}>>([]);

  // Initialize chat service with user context
  useEffect(() => {
    console.log('🏠 [DEBUG] useChat initialization effect:', {
      userId: user?.id,
      hasUser: !!user,
      userObject: user
    });

    if (user?.id) {
      try {
        console.log('🏠 [DEBUG] Initializing ChatService for user:', user.id);
        ChatService.initializeUser(user.id);
        loadUserRooms();
      } catch (error) {
        console.warn('❌ [DEBUG] Chat service initialization failed. This is expected if Supabase is not configured yet.');
      }
    } else {
      console.log('🏠 [DEBUG] No user.id available for chat initialization');
    }
  }, [user?.id]);

  // Load user's chat rooms
  const loadUserRooms = useCallback(async () => {
    if (!user?.id) {
      console.log('🏠 [DEBUG] loadUserRooms: No user.id available');
      return;
    }

    console.log('🏠 [DEBUG] loadUserRooms called for user:', user.id);
    setLoading(true);
    try {
      const userRooms = await ChatService.getUserChatRooms(user.id);
      console.log('🏠 [DEBUG] loadUserRooms result:', {
        userId: user.id,
        roomsCount: userRooms.length,
        rooms: userRooms.map(r => ({
          id: r.id,
          client_id: r.client_id,
          freelancer_id: r.freelancer_id,
          job_id: r.job_id
        }))
      });
      setRooms(userRooms);
    } catch (error) {
      console.error('❌ [DEBUG] Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Load messages for current room
  useEffect(() => {
    console.log('🔄 useChat useEffect triggered:', { 
      currentRoom: currentRoom?.id, 
      user: user?.id,
      hasCurrentRoom: !!currentRoom,
      hasUser: !!user
    });
    
    if (currentRoom && user?.id) {
      console.log('✅ Both currentRoom and user exist, setting up subscription...');
      console.log('🧹 Force cleanup any existing subscriptions first...');
      
      loadMessages();
      
      // Subscribe to real-time message updates
      console.log('🔔 Setting up real-time subscription for room:', currentRoom.id);
      console.log('🔔 Current user:', user?.id);
      console.log('🔔 Room details:', { roomId: currentRoom.id, clientId: currentRoom.client_id, freelancerId: currentRoom.freelancer_id });
      
      const messageSubscription = ChatService.subscribeToMessages(
        currentRoom.id,
        (newMessage) => {
          console.log('📨 Real-time message received:', newMessage);
          console.log('📨 Message details:', { 
            messageId: newMessage.id, 
            senderId: newMessage.sender_id, 
            roomId: newMessage.room_id,
            currentUserId: user?.id,
            isMyMessage: newMessage.sender_id === user?.id
          });
          
          setMessages(prev => {
            // 🚀 PERFORMANCE: Check if this is replacing an optimistic message first
            const optimisticIndex = prev.findIndex(msg => msg.isOptimistic && msg.sender_id === newMessage.sender_id);
            if (optimisticIndex !== -1) {
              console.log('🔄 Replacing optimistic message with real one:', newMessage.id);
              const newMessages = [...prev];
              newMessages[optimisticIndex] = { ...newMessage, sender_name: newMessage.sender_name || prev[optimisticIndex].sender_name };
              return newMessages;
            }
            
            // Prevent duplicates for non-optimistic messages
            const exists = prev.some(msg => msg.id === newMessage.id);
            if (exists) {
              console.log('🔄 Duplicate message ignored:', newMessage.id);
              return prev;
            }
            
            console.log('✅ Adding new real-time message:', newMessage.id);
            // 🚀 PERFORMANCE: Just append, don't sort (messages come in order)
            return [...prev, newMessage];
          });
        },
        user?.id // Add userId parameter for unique channel names
      );

      // Note: Typing indicators disabled per user request
      
      return () => {
        console.log('🔌 Unsubscribing from real-time messages for room:', currentRoom.id);
        console.log('🔌 Current user:', user?.id);
        messageSubscription.unsubscribe();
      };
    } else {
      console.log('🏠 Missing requirements for subscription:', {
        hasCurrentRoom: !!currentRoom,
        hasUser: !!user?.id,
        currentRoomId: currentRoom?.id,
        userId: user?.id
      });
      setMessages([]);
      setMessageOffset(0);
      setTypingUsers([]);
    }
  }, [currentRoom?.id, user?.id]); // Changed dependency to be more specific

  const loadMessages = async (offset = 0) => {
    if (!currentRoom) return;

    try {
      const roomMessages = await ChatService.getMessages(currentRoom.id, 50, offset);
      if (offset === 0) {
        setMessages(roomMessages);
      } else {
        setMessages(prev => [...roomMessages, ...prev]);
      }
      setMessageOffset(offset + roomMessages.length);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMoreMessages = useCallback(async () => {
    await loadMessages(messageOffset);
  }, [messageOffset, currentRoom]);

  const sendMessage = useCallback(async (content: string): Promise<boolean> => {
    console.log('🔥 sendMessage called in useChat with:', {
      content,
      currentRoom: currentRoom?.id,
      userId: user?.id,
      contentTrimmed: content.trim(),
      currentMessagesCount: messages.length
    });
    
    if (!currentRoom) {
      console.log('❌ sendMessage failed: no currentRoom');
      return false;
    }
    
    if (!user?.id) {
      console.log('❌ sendMessage failed: no user.id');
      return false;
    }
    
    if (!content.trim()) {
      console.log('❌ sendMessage failed: empty content');
      return false;
    }

    setSending(true);
    
    // 🚀 OPTIMISTIC UI UPDATE - Show message immediately for better UX
    const optimisticMessage: Message = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content: content.trim(),
      sender_id: user.id,
      room_id: currentRoom.id,
      message_type: 'text' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sender_name: 'User',
      isOptimistic: true // Flag to identify optimistic messages
    };
    
    console.log('🚀 Adding optimistic message immediately:', optimisticMessage.id);
    setMessages(prev => [...prev, optimisticMessage]);
    
    try {
      // Note: Typing indicators disabled per user request

      console.log('📤 Sending message to server:', {
        roomId: currentRoom.id,
        senderId: user.id,
        content: content.trim(),
        timestamp: new Date().toISOString()
      });

      const serverMessage = await ChatService.sendMessage(
        currentRoom.id,
        user.id,
        content.trim(),
        'text' // Add explicit message type
      );
      
      if (serverMessage) {
        console.log('✅ Message sent successfully, replacing optimistic with real...');
        // Replace optimistic message with real one
        setMessages(prev => prev.map(msg => 
          msg.id === optimisticMessage.id ? { ...serverMessage, sender_name: msg.sender_name } : msg
        ));
        return true;
      } else {
        // Remove optimistic message if send failed
        console.log('❌ Message send failed, removing optimistic message');
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      }
      return false;
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message if send failed
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      return false;
    } finally {
      setSending(false);
    }
  }, [currentRoom, user?.id]);

  const sendPhotoMessage = useCallback(async (file: File, caption?: string): Promise<boolean> => {
    if (!currentRoom || !user?.id) return false;

    setSending(true);
    try {
      console.log('📸 Sending photo message...');
      
      const message = await ChatService.sendPhotoMessage(
        currentRoom.id,
        user.id,
        file,
        caption || ''
      );
      
      if (message) {
        console.log('✅ Photo message sent successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error sending photo message:', error);
      return false;
    } finally {
      setSending(false);
    }
  }, [currentRoom, user?.id]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    // Note: Typing indicators disabled per user request
    console.log('⌨️ setTyping called (disabled):', isTyping);
  }, []);

  const markAsRead = useCallback(async () => {
    if (!currentRoom || !user?.id) return;

    try {
      await ChatService.markMessagesAsRead(currentRoom.id, user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [currentRoom, user?.id]);

  const canAccessJob = useCallback(async (jobId: string): Promise<boolean> => {
    if (!user?.id) return false;
    return await ChatService.canAccessChat(user.id, jobId);
  }, [user?.id]);

  const initializeChatForJob = useCallback(async (
    jobId: string, 
    clientId: string, 
    freelancerId: string
  ): Promise<ChatRoom | null> => {
    if (!user?.id) return null;

    // Check access first
    const hasAccess = await canAccessJob(jobId);
    if (!hasAccess) return null;

    try {
      const room = await ChatService.getOrCreateChatRoom(jobId, clientId, freelancerId);
      if (room) {
        await loadUserRooms(); // Refresh rooms list
        setCurrentRoom(room);
      }
      return room;
    } catch (error) {
      console.error('Error initializing chat for job:', error);
      return null;
    }
  }, [user?.id, canAccessJob, loadUserRooms]);

  // Wrapper untuk debug setCurrentRoom
  const setCurrentRoomWithDebug = (room: ChatRoom | null) => {
    console.log('🔄 useChat - setCurrentRoom called with:', room?.id);
    setCurrentRoom(room);
  };

  // Function to get AI suggestions
  const getAiSuggestions = useCallback(async (draftText: string) => {
    if (!user?.id || !currentRoom) {
      setAiSuggestions([]);
      return;
    }

    
    try {
      console.log('🤖 Requesting AI suggestions for draft:', draftText);
      
      // Get other user ID
      const otherUserId = currentRoom.client_id === user.id 
        ? currentRoom.freelancer_id 
        : currentRoom.client_id;
      
      // Get last 10 messages for context
      const recentMessages = messages.slice(-10).map(msg => ({
        sender_id: msg.sender_id,
        message: msg.content,
        timestamp: msg.created_at,
        is_read: msg.read_at !== null,
        message_type: msg.message_type
      }));
      
      // Get job context if available
      let jobContext = null;
      if (currentRoom.job_id) {
        try {
          const { data: jobData } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', currentRoom.job_id)
            .single();
            
          if (jobData) {
            jobContext = {
              job_id: jobData.id,
              job_name: jobData.jobName,
              job_status: jobData.jobStatus,
              deadline: jobData.jobDeadline,
              client_id: jobData.userId
            };
          }
        } catch (error) {
          console.error('Error fetching job context:', error);
        }
      }
      
      // Send to advisor agent
      const isDev = !!(import.meta as any).env?.DEV;
      let advisorUrl = process.env.REACT_APP_ADVISOR_API_URL || 'https://advisor.130.211.124.157.sslip.io/api/chat';

      if (isDev) {
        advisorUrl = '/advisor-api/api/chat'; // Vite proxy in dev
      }

      // DEBUG: Log environment and URL details for AI suggestions
      console.log('🔍 [CHAT AI DEBUG] Environment check for AI suggestions:');
      console.log('🔍 [CHAT AI DEBUG] - Current location protocol:', window.location.protocol);
      console.log('🔍 [CHAT AI DEBUG] - Advisor API URL:', advisorUrl);
      console.log('🔍 [CHAT AI DEBUG] - Is HTTPS page with HTTP API?', window.location.protocol === 'https:' && advisorUrl.startsWith('http://'));

      const apiUrl = advisorUrl;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: JSON.stringify({
            action: 'chat_assistant',
            chat_history: recentMessages,
            current_draft: draftText,
            user_id: user.id,
            recipient_id: otherUserId,
            job_context: jobContext,
            assistance_type: 'suggest_reply'
          }),
          userId: user.id
        }),
        mode: 'cors' // Explicitly set CORS mode
      });
      
      // Process response
      const data = await response.json();
      console.log('🤖 AI suggestions response:', data);
      
      if (data && data.response) {
        try {
          const suggestions = JSON.parse(data.response);
          setAiSuggestions(suggestions);
        } catch (error) {
          console.error('Error parsing AI suggestions:', error);
          setAiSuggestions([]);
        }
      } else {
        setAiSuggestions([]);
      }
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      setAiSuggestions([]);
    }
  }, [user?.id, currentRoom, messages]);

  return {
    rooms,
    currentRoom,
    messages,
    loading,
    sending,
    typingUsers,
    setCurrentRoom: setCurrentRoomWithDebug,
    sendMessage,
    sendPhotoMessage,
    setTyping,
    loadMoreMessages,
    markAsRead,
    canAccessJob,
    initializeChatForJob,
    // AI Assistant
    aiAssistActive,
    setAiAssistActive,
    aiSuggestions,
    setAiSuggestions,
    getAiSuggestions
  };
};

export default useChat;
