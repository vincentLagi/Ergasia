import React, { useState, useRef, useEffect } from 'react';
import { Avatar, Input, Button, Typography, Empty, Dropdown, Tooltip, Spin } from 'antd';
import { 
  UserOutlined, 
  SendOutlined, 
  MoreOutlined,
  PhoneOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  ArrowLeftOutlined,
  SmileOutlined,
  PaperClipOutlined,
  CheckOutlined,
  CheckCircleOutlined,
  CameraOutlined,
  LoadingOutlined,
  EyeOutlined,
  BulbOutlined,
  TranslationOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { selectedContactAtom, currentChatRoomAtom } from '../../app/store/chat';
import { useAuth } from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';
import { Message } from '../../config/supabase';
import { getUserById } from '../../controller/userController';
import { getJobById } from '../../controller/jobController';
import ChatService from '../../services/chatService';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ChatWindow: React.FC = () => {
  const { user } = useAuth();
  const { 
    messages, 
    sending, 
    sendMessage, 
    sendPhotoMessage, 
    setTyping, 
    typingUsers, 
    markAsRead, 
    loadMoreMessages,
    // AI Assistant features
    aiAssistActive,
    setAiAssistActive,
    aiSuggestions,
    setAiSuggestions,
    getAiSuggestions
  } = useChat();
  const [selectedContact] = useAtom(selectedContactAtom);
  const [currentRoom] = useAtom(currentChatRoomAtom);
  
  // Debug current state
  console.log('🪟 ChatWindow render - selectedContact:', selectedContact, 'currentRoom:', currentRoom?.id);
  console.log('🪟 Full state debug:', {
    selectedContact,
    currentRoom: currentRoom?.id,
    currentRoomFull: currentRoom,
    user: user?.id,
    messages: messages.length,
    sending
  });

  // Force early realtime subscription setup
  React.useEffect(() => {
    if (currentRoom && user) {
      console.log('🪟 ChatWindow: Force checking useChat subscription setup');
      console.log('🪟 ChatWindow room/user state:', {
        roomId: currentRoom.id,
        userId: user.id,
        messages: messages.length
      });
      
      // Expose debug methods to window for manual testing
      (window as any).chatDebug = {
        roomId: currentRoom.id,
        userId: user.id,
        testRealtime: () => ChatService.testRealtimeConnection(currentRoom.id),
        testMinimal: () => ChatService.testMinimalRealtime(),
        testSend: () => ChatService.testSendMessage(currentRoom.id, user.id),
        currentRoom,
        user
      };
      console.log('🧪 Debug methods available at window.chatDebug');
      console.log('🧪 Available tests:');
      console.log('   - window.chatDebug.testMinimal() // Test basic realtime');
      console.log('   - window.chatDebug.testRealtime() // Test room-specific realtime');
      console.log('   - window.chatDebug.testSend() // Test sending message');
    }
  }, [currentRoom?.id, user?.id, messages.length]); // More specific dependencies
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ file: File, url: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceSuggestionsRef = useRef<NodeJS.Timeout | null>(null);

  // Load other user and job data
  useEffect(() => {
    const loadChatData = async () => {
      if (!currentRoom || !user?.id) return;

      setLoading(true);
      try {
        // Get other user ID
        const otherUserId = currentRoom.client_id === user.id 
          ? currentRoom.freelancer_id 
          : currentRoom.client_id;

        // Load other user data
        const userResult = await getUserById(otherUserId);
        if (userResult && "ok" in userResult) {
          setOtherUser(userResult.ok);
        }

        // Load job data
        const job = await getJobById(currentRoom.job_id);
        if (job) {
          setJobData(job);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChatData();
  }, [currentRoom, user?.id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when room changes
  useEffect(() => {
    if (currentRoom) {
      markAsRead();
    }
  }, [currentRoom, markAsRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle photo upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoPreview({ file, url });
  };

  const handleSendPhoto = async () => {
    if (!photoPreview || sending) return;

    const success = await sendPhotoMessage(photoPreview.file, newMessage);
    if (success) {
      setPhotoPreview(null);
      setNewMessage('');
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelPhoto = () => {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview.url);
      setPhotoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle input change (typing indicators disabled)
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    console.log('⌨️ Input changed:', value);
    setNewMessage(value);
    // Note: Typing indicators disabled per user request
    
    // Get AI suggestions if AI assistant is active and we have some text
    if (aiAssistActive && value.length > 0) {
      // Debounce the suggestions request
      if (debounceSuggestionsRef.current) {
        clearTimeout(debounceSuggestionsRef.current);
      }
      
      debounceSuggestionsRef.current = setTimeout(() => {
        getAiSuggestions(value);
      }, 500);
    }
  };

  const handleSend = async () => {
    console.log('🔴 handleSend called', { 
      photoPreview: !!photoPreview, 
      newMessage: newMessage, 
      sending, 
      hasCurrentRoom: !!currentRoom,
      hasUser: !!user 
    });

    if (photoPreview) {
      await handleSendPhoto();
      return;
    }

    if (!newMessage.trim() || sending) return;

    console.log('🚀 Calling sendMessage from ChatWindow');
    const success = await sendMessage(newMessage);
    console.log('📨 sendMessage result:', success);
    
    if (success) {
      setNewMessage('');
      // Note: setTyping disabled per user request
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const dropdownItems = [
    {
      key: 'call',
      label: 'Voice Call',
      icon: <PhoneOutlined />,
      onClick: () => console.log('Voice call'),
    },
    {
      key: 'video',
      label: 'Video Call',
      icon: <VideoCameraOutlined />,
      onClick: () => console.log('Video call'),
    },
    {
      key: 'info',
      label: 'Contact Info',
      icon: <InfoCircleOutlined />,
      onClick: () => console.log('Contact info'),
    },
  ];

  // Show empty state when no room is selected
  console.log('🔍 ChatWindow empty check - selectedContact:', !!selectedContact, 'currentRoom:', !!currentRoom);
  if (!selectedContact || !currentRoom) {
    console.log('❌ ChatWindow showing empty state - missing selectedContact or currentRoom');
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span className="text-muted-foreground">
              Select a conversation to start chatting
            </span>
          }
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spin size="large" tip="Loading chat..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <Avatar
            size={40}
            src={otherUser?.profilePictureUrl}
            icon={<UserOutlined />}
            className="border-2 border-primary/20"
          />
        <div>
            <Title level={5} className="!mb-0 text-foreground">
              {otherUser?.username || 'Unknown User'}
            </Title>
            <Text className="text-muted-foreground text-sm">
              Job: {jobData?.jobName || 'Unknown Job'}
            </Text>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Tooltip title="Voice Call">
            <Button
              type="text"
              icon={<PhoneOutlined />}
              className="text-muted-foreground hover:text-primary"
            />
          </Tooltip>
          <Tooltip title="Video Call">
            <Button
              type="text"
              icon={<VideoCameraOutlined />}
              className="text-muted-foreground hover:text-primary"
            />
          </Tooltip>
          <Dropdown menu={{ items: dropdownItems }} trigger={['click']}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="text-muted-foreground hover:text-primary"
            />
          </Dropdown>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-background to-muted/10"
      >
        <AnimatePresence>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <Text className="text-muted-foreground">
                Start your conversation with {otherUser?.username}
              </Text>
            </motion.div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex mb-4 ${
                  message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-xs lg:max-w-md ${
                  message.sender_id === user?.id ? 'order-2' : 'order-1'
                }`}>
                  {message.sender_id !== user?.id && (
                    <Avatar
                      size={24}
                      src={otherUser?.profilePictureUrl}
                      icon={<UserOutlined />}
                      className="mb-1"
                    />
                  )}
                  
                  <div
                    className={`rounded-2xl shadow-sm ${
                      message.sender_id === user?.id
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card text-card-foreground border border-border rounded-bl-sm'
                    } ${message.message_type === 'image' ? 'p-2' : 'px-4 py-2'}`}
                  >
                    {message.message_type === 'image' && message.file_url ? (
                      // Image message
                      <div>
                        <div className="relative group">
                          <img 
                            src={message.file_url} 
                            alt={message.file_name || 'Image'}
                            className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ maxHeight: '300px', maxWidth: '250px' }}
                            onClick={() => window.open(message.file_url, '_blank')}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg flex items-center justify-center transition-all">
                            <EyeOutlined className="text-white opacity-0 group-hover:opacity-100 text-lg" />
                          </div>
                        </div>
                        {message.content && message.content !== `📸 ${message.file_name}` && (
                          <Text className={`text-sm whitespace-pre-wrap mt-2 block ${
                            message.sender_id === user?.id 
                              ? 'text-primary-foreground' 
                              : 'text-foreground'
                          }`}>
                            {message.content}
                          </Text>
                        )}
                      </div>
                    ) : (
                      // Text message
                      <Text className={
                        message.sender_id === user?.id 
                          ? 'text-primary-foreground' 
                          : 'text-foreground'
                      }>
                        {message.content}
                      </Text>
                    )}
                  </div>
                  
                  <div className={`flex items-center gap-1 mt-1 ${
                    message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                  }`}>
                    <Text className="text-muted-foreground text-xs">
                      {formatTimestamp(message.created_at)}
                    </Text>
                    {message.sender_id === user?.id && (
                      <span className="text-muted-foreground">
                        {message.read_at ? (
                          <CheckCircleOutlined className="text-primary" />
                        ) : (
                          <CheckOutlined />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-border bg-card/50 backdrop-blur-sm"
      >
        {/* Note: Typing indicators disabled per user request */}

        {/* Photo Preview */}
        {photoPreview && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 p-3 border border-border rounded-lg bg-muted/20"
          >
            <div className="flex items-start gap-3">
              <div className="relative">
                <img 
                  src={photoPreview.url} 
                  alt="Preview"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  onClick={handleCancelPhoto}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{photoPreview.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(photoPreview.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-end space-x-2">
          <div className="flex space-x-1">
            <Tooltip title="AI Assistant">
              <Button
                type="text"
                icon={<BulbOutlined />}
                className={`text-muted-foreground hover:text-primary ai-assist-btn ${aiAssistActive ? 'active' : ''}`}
                onClick={() => setAiAssistActive(!aiAssistActive)}
              />
            </Tooltip>
            <Tooltip title="Send Photo">
              <Button
                type="text"
                icon={<CameraOutlined />}
                className="text-muted-foreground hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
              />
            </Tooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {!photoPreview && (
            <div className="flex-1">
          <TextArea
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
                className="resize-none"
              />
              
              {/* AI Suggestions Panel */}
              {aiAssistActive && aiSuggestions.length > 0 && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="ai-suggestions-panel mt-2"
                  >
                    {aiSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="ai-suggestion"
                        onClick={() => {
                          setNewMessage(suggestion.text);
                          setAiSuggestions([]);
                        }}
                      >
                        {suggestion.preview}
                      </div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}

          {photoPreview && (
            <div className="flex-1">
              <TextArea
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Add a caption..."
                autoSize={{ minRows: 1, maxRows: 2 }}
                className="resize-none"
              />
            </div>
          )}

          <Button
            type="primary"
            icon={photoPreview ? <CameraOutlined /> : <SendOutlined />}
            onClick={() => {
              console.log('🔵 Send button clicked!');
              handleSend();
            }}
            loading={sending}
            disabled={photoPreview ? false : !newMessage.trim()}
            className="flex items-center justify-center"
          >
            {photoPreview ? 'Send Photo' : 'Send'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatWindow;