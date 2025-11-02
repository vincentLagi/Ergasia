import { supabase, ChatRoom, Message, TypingStatus, setUserContext } from '../config/supabase';
import { getJobById } from '../controller/jobController';
import { isFreelancerRegistered } from '../controller/jobTransactionController';

export class ChatService {
  static supabase = supabase;
  
  // Initialize user context for RLS
  static async initializeUser(userId: string) {
    await setUserContext(userId);
  }

  // Check if user can access chat for a job
  static async canAccessChat(userId: string, jobId: string): Promise<boolean> {
    try {
      console.log(`🔍 [DEBUG] canAccessChat called with userId: ${userId}, jobId: ${jobId}`);

      // Get job details from ICP backend
      const job = await getJobById(jobId);
      if (!job) {
        console.log(`❌ [DEBUG] Job ${jobId} not found`);
        return false;
      }

      console.log(`📋 [DEBUG] Job details:`, {
        jobId: job.id,
        jobStatus: job.jobStatus,
        jobOwner: job.userId,
        userId: userId,
        isClient: job.userId === userId
      });

      // Check if user is the client
      if (job.userId === userId) {
        // Client can chat if job is Ongoing or Finished
        const canChat = job.jobStatus === 'Ongoing' || job.jobStatus === 'Finished';
        console.log(`👔 [DEBUG] Client access check: ${canChat} (job status: ${job.jobStatus})`);
        return canChat;
      }

      // Check if user is an accepted freelancer
      console.log(`🛠️ [DEBUG] Checking freelancer registration for user ${userId} on job ${jobId}`);
      const isAcceptedResult = await isFreelancerRegistered(jobId, userId);
      console.log(`🛠️ [DEBUG] Freelancer registration result:`, isAcceptedResult);

      const isAccepted = isAcceptedResult[0] === "succ" && isAcceptedResult[1] === "true";
      console.log(`🛠️ [DEBUG] Freelancer accepted: ${isAccepted}`);

      if (!isAccepted) {
        console.log(`❌ [DEBUG] User ${userId} is not an accepted freelancer for job ${jobId}`);
        return false;
      }

      // Freelancer can chat if job is Ongoing or Finished
      const canChat = job.jobStatus === 'Ongoing' || job.jobStatus === 'Finished';
      console.log(`🛠️ [DEBUG] Freelancer access: ${canChat} (job status: ${job.jobStatus})`);
      return canChat;

    } catch (error) {
      console.error('❌ [DEBUG] Error checking chat access:', error);
      return false;
    }
  }

  // Get or create chat room
  static async getOrCreateChatRoom(jobId: string, clientId: string, freelancerId: string): Promise<ChatRoom | null> {
    try {
      console.log(`📨 Getting/creating chat room for job: ${jobId}, client: ${clientId}, freelancer: ${freelancerId}`);
      
      // First try to get existing room
      const { data: existingRoom, error: selectError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('job_id', jobId)
        .eq('client_id', clientId)
        .eq('freelancer_id', freelancerId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected
        if (selectError.code === '42P01') {
          console.warn('🚨 Table "chat_rooms" does not exist. Please run the Supabase setup SQL.');
          return null;
        }
        throw selectError;
      }

      if (existingRoom) {
        console.log(`♻️ Found existing chat room: ${existingRoom.id}`);
        return existingRoom;
      }

      // Create new room if doesn't exist
      console.log('🆕 Creating new chat room...');
      const { data: newRoom, error: insertError } = await supabase
        .from('chat_rooms')
        .insert({
          job_id: jobId,
          client_id: clientId,
          freelancer_id: freelancerId,
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '42P01') {
          console.warn('🚨 Table "chat_rooms" does not exist. Please run the Supabase setup SQL.');
          return null;
        }
        throw insertError;
      }
      
      console.log(`✅ Created new chat room: ${newRoom.id}`);
      return newRoom;
      
    } catch (error) {
      console.error('Error getting/creating chat room:', error);
      console.warn('💡 Make sure to run the Supabase setup SQL to create the tables.');
      return null;
    }
  }

  // Upload photo to Supabase Storage
  static async uploadPhoto(file: File, roomId: string, senderId: string): Promise<{ url: string, thumbnail?: string } | null> {
    try {
      console.log('📸 Uploading photo:', file.name, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${roomId}/${senderId}_${Date.now()}.${fileExt}`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-photos')
        .getPublicUrl(fileName);
      
      console.log('✅ Photo uploaded successfully:', publicUrl);
      
      return { url: publicUrl };
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      return null;
    }
  }

  // Send message (enhanced for photos)
  static async sendMessage(
    roomId: string, 
    senderId: string, 
    content: string, 
    messageType: 'text' | 'image' | 'file' = 'text',
    fileData?: { url: string, fileName?: string, fileSize?: number, thumbnail?: string }
  ): Promise<Message | null> {
    try {
      console.log('📨 ChatService.sendMessage called with:', {
        roomId, senderId, content, messageType, fileData
      });
      const messageData: any = {
        room_id: roomId,
        sender_id: senderId,
        content,
        message_type: messageType
      };
      
      // Add file data if present
      if (fileData) {
        messageData.file_url = fileData.url;
        messageData.file_name = fileData.fileName;
        messageData.file_size = fileData.fileSize;
        messageData.thumbnail_url = fileData.thumbnail;
      }
      
      const { data: message, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;
      
      // Update room's updated_at timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', roomId);

      console.log('✅ Message sent successfully:', message.id);
      return message;
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return null;
    }
  }
  
  // Send photo message (convenience method)
  static async sendPhotoMessage(roomId: string, senderId: string, file: File, caption: string = ''): Promise<Message | null> {
    try {
      console.log('📸 Sending photo message...');
      
      // Upload photo first
      const uploadResult = await this.uploadPhoto(file, roomId, senderId);
      if (!uploadResult) {
        throw new Error('Failed to upload photo');
      }
      
      // Send message with photo data
      return await this.sendMessage(
        roomId,
        senderId,
        caption || `📸 ${file.name}`,
        'image',
        {
          url: uploadResult.url,
          fileName: file.name,
          fileSize: file.size,
          thumbnail: uploadResult.thumbnail
        }
      );
    } catch (error) {
      console.error('❌ Error sending photo message:', error);
      return null;
    }
  }

  // Get messages for a room
  static async getMessages(roomId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return messages || [];
      
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Subscribe to real-time messages
  static subscribeToMessages(roomId: string, onMessage: (message: Message) => void, userId?: string) {
    console.log('🔔 ChatService: Setting up subscription for room:', roomId);
    console.log('🔔 Supabase client:', supabase);
    
    // Use unique channel name per user to avoid conflicts
    const timestamp = Date.now();
    const userSuffix = userId ? `_${userId.slice(-8)}` : '';
    const channelName = `messages_${roomId}${userSuffix}_${timestamp}`;
    console.log('🔔 Channel name:', channelName);
    
    // Subscribe to ALL message inserts and filter client-side for better reliability
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}` // 🚀 Server-side filtering for better performance
        },
        (payload) => {
          console.log('🔥 REALTIME EVENT RECEIVED FOR ROOM:', roomId);
          console.log('🔥 ChatService: Raw payload received:', payload);
          
          const newMessage = payload.new as Message;
          console.log('✅ Message is for this room (server-filtered), processing...', newMessage);
          onMessage(newMessage);
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Subscription status changed:', status);
        if (err) {
          console.error('❌ Subscription error:', err);
          console.error('❌ Error details:', err.message);
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates!');
          console.log('✅ Listening for ALL messages, filtering for room:', roomId);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check if realtime is properly enabled');
          console.error('❌ Run this SQL: ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;');
        } else if (status === 'TIMED_OUT') {
          console.error('⏰ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('🔌 Subscription closed');
        }
      });
      
    console.log('📡 Subscription object created:', channel);
    
    // Test if channel is ready
    setTimeout(() => {
      console.log('📡 Channel state after 2s:', channel.state);
      console.log('📡 Channel topic:', channel.topic);
    }, 2000);
    
    return channel;
  }

  // Get chat rooms for user with multiple fallback strategies
  static async getUserChatRooms(userId: string): Promise<ChatRoom[]> {
    try {
      console.log('📨 [DEBUG] getUserChatRooms called for user:', userId);

      // Strategy 1: Try filtered query first (most efficient)
      console.log('🎯 [DEBUG] Strategy 1: Trying filtered query...');
      const { data: filteredRooms, error: filterError } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`client_id.eq.${userId},freelancer_id.eq.${userId}`)
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      console.log('🎯 [DEBUG] Filtered query result:', {
        error: filterError,
        roomsCount: filteredRooms?.length || 0,
        rooms: filteredRooms?.map(r => ({
          id: r.id,
          client_id: r.client_id,
          freelancer_id: r.freelancer_id,
          job_id: r.job_id
        }))
      });

      if (!filterError && filteredRooms) {
        console.log('✅ [DEBUG] Filtered query successful:', filteredRooms.length, 'rooms');
        return this.validateAndFilterRooms(filteredRooms, userId);
      }

      console.log('⚠️ [DEBUG] Filtered query failed, trying alternative strategies...');

      // Strategy 2: Get all rooms and filter client-side
      console.log('🔄 [DEBUG] Strategy 2: Client-side filtering...');
      const { data: allRooms, error: allError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('status', 'active')
        .order('updated_at', { ascending: false });

      console.log('🔄 [DEBUG] All rooms query result:', {
        error: allError,
        roomsCount: allRooms?.length || 0
      });

      if (!allError && allRooms) {
        const clientFiltered = allRooms.filter(room =>
          room.client_id === userId || room.freelancer_id === userId
        );
        console.log('✅ [DEBUG] Client-side filtering successful:', clientFiltered.length, 'rooms');
        console.log('✅ [DEBUG] Filtered rooms:', clientFiltered.map(r => ({
          id: r.id,
          client_id: r.client_id,
          freelancer_id: r.freelancer_id,
          job_id: r.job_id
        })));
        return clientFiltered;
      }

      // Strategy 3: Manual query construction (last resort)
      console.log('🔧 [DEBUG] Strategy 3: Manual query construction...');
      const { data: manualRooms, error: manualError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('status', 'active')
        .or(`client_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      console.log('🔧 [DEBUG] Manual client query result:', {
        error: manualError,
        roomsCount: manualRooms?.length || 0
      });

      if (!manualError && manualRooms) {
        const freelancerRooms = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('status', 'active')
          .eq('freelancer_id', userId)
          .order('updated_at', { ascending: false });

        console.log('🔧 [DEBUG] Manual freelancer query result:', {
          error: freelancerRooms.error,
          roomsCount: freelancerRooms.data?.length || 0
        });

        const combined = [
          ...(manualRooms || []),
          ...(freelancerRooms.data || [])
        ];

        // Remove duplicates
        const uniqueRooms = combined.filter((room, index, self) =>
          index === self.findIndex(r => r.id === room.id)
        );

        console.log('✅ [DEBUG] Manual query successful:', uniqueRooms.length, 'rooms');
        console.log('✅ [DEBUG] Combined rooms:', uniqueRooms.map(r => ({
          id: r.id,
          client_id: r.client_id,
          freelancer_id: r.freelancer_id,
          job_id: r.job_id
        })));
        return uniqueRooms;
      }

      console.error('❌ [DEBUG] All strategies failed');
      return [];

    } catch (error) {
      console.error('❌ [DEBUG] Error getting user chat rooms:', error);
      return [];
    }
  }

  // Validate and double-check filtering
  private static validateAndFilterRooms(rooms: ChatRoom[], userId: string): ChatRoom[] {
    const validRooms = rooms.filter(room => {
      const isValid = room.client_id === userId || room.freelancer_id === userId;
      if (!isValid) {
        console.warn('🚨 Invalid room found in filtered results:', {
          roomId: room.id,
          client: room.client_id,
          freelancer: room.freelancer_id,
          userId: userId
        });
      }
      return isValid;
    });

    if (validRooms.length !== rooms.length) {
      console.warn(`⚠️ Filtered out ${rooms.length - validRooms.length} invalid rooms`);
    }

    return validRooms;
  }

  // Mark messages as read
  static async markMessagesAsRead(roomId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return true;
      
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Get unread message count
  static async getUnreadCount(roomId: string, userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
      
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // Typing indicators functionality
  static async setTypingStatus(roomId: string, userId: string, isTyping: boolean): Promise<boolean> {
    try {
      if (isTyping) {
        // Set user as typing
        const { error } = await supabase
          .from('typing_status')
          .upsert({ 
            room_id: roomId, 
            user_id: userId, 
            is_typing: true,
            updated_at: new Date().toISOString()
          });
        
        if (error && error.code !== '42P01') throw error; // Ignore table not found
      } else {
        // Remove typing status
        const { error } = await supabase
          .from('typing_status')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', userId);
        
        if (error && error.code !== '42P01') throw error; // Ignore table not found
      }
      
      return true;
    } catch (error) {
      console.error('Error setting typing status:', error);
      return false;
    }
  }

  // Get current typing users
  static async getTypingUsers(roomId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('typing_status')
        .select('user_id')
        .eq('room_id', roomId)
        .eq('is_typing', true)
        .gte('updated_at', new Date(Date.now() - 10000).toISOString()); // Only last 10 seconds
      
      if (error) {
        if (error.code === '42P01') return []; // Table not found, return empty
        throw error;
      }
      
      return data?.map(item => item.user_id) || [];
    } catch (error) {
      console.error('Error getting typing users:', error);
      return [];
    }
  }

  // Subscribe to typing status changes
  static subscribeToTyping(roomId: string, callback: (typingUsers: string[]) => void) {
    return supabase
      .channel(`typing:${roomId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'typing_status',
        filter: `room_id=eq.${roomId}`
      }, async () => {
        // Fetch current typing users when any change happens
        const typingUsers = await this.getTypingUsers(roomId);
        callback(typingUsers);
      })
      .subscribe();
  }

  // Debug method untuk test realtime connection
  static testRealtimeConnection(roomId: string) {
    console.log('🧪 Testing realtime connection for room:', roomId);
    
    const testChannel = supabase
      .channel(`test_basic_realtime`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('🧪 Test received payload:', payload);
      })
      .subscribe((status, err) => {
        console.log('🧪 Test subscription status:', status);
        if (err) {
          console.error('🧪 Test subscription error:', err);
        }
      });
      
    return testChannel;
  }

  // Test minimal realtime setup
  static testMinimalRealtime() {
    console.log('🧪 Testing minimal realtime setup...');
    
    const channel = supabase
      .channel('test_minimal')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('🧪 Minimal test received:', payload);
      })
      .subscribe((status, err) => {
        console.log('🧪 Minimal test status:', status);
        if (err) {
          console.error('🧪 Minimal test error:', err);
          console.error('🧪 This indicates realtime is not properly configured');
          console.error('🧪 Run: ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;');
        }
        if (status === 'SUBSCRIBED') {
          console.log('🧪 ✅ Minimal realtime test successful!');
        }
      });
      
    return channel;
  }

  // Manual method untuk test sending message
  static async testSendMessage(roomId: string, senderId: string) {
    console.log('🧪 Test sending message manually...');
    
    const testMessage = {
      room_id: roomId,
      sender_id: senderId,
      content: `Test message at ${new Date().toISOString()}`,
      message_type: 'text'
    };
    
    const { data, error } = await supabase
      .from('messages')
      .insert(testMessage)
      .select()
      .single();
      
    if (error) {
      console.error('🧪 Test send failed:', error);
      return null;
    }
    
    console.log('🧪 Test message sent:', data);
    return data;
  }
}

export default ChatService;
