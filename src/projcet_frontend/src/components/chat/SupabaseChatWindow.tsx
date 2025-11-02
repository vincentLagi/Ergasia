import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Avatar, List, Typography, Spin, Badge } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { ChatRoom, Message } from '../../config/supabase';
import useChat from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import { getUserById } from '../../controller/userController';

const { Text } = Typography;
const { TextArea } = Input;

interface SupabaseChatWindowProps {
  room: ChatRoom;
  jobTitle?: string;
}

interface UserInfo {
  id: string;
  username: string;
  profilePictureUrl?: string;
}

const SupabaseChatWindow: React.FC<SupabaseChatWindowProps> = ({ 
  room, 
  jobTitle 
}) => {
  const { user } = useAuth();
  const { messages, sendMessage, sending, markAsRead, loadMoreMessages } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get other user info
  useEffect(() => {
    const getOtherUserInfo = async () => {
      if (!user?.id) return;
      
      const otherUserId = user.id === room.client_id ? room.freelancer_id : room.client_id;
      
      try {
        const userResult = await getUserById(otherUserId);
        if (userResult && "ok" in userResult) {
          setOtherUser({
            id: userResult.ok.id,
            username: userResult.ok.username,
            profilePictureUrl: userResult.ok.profilePictureUrl || undefined
          });
        }
      } catch (error) {
        console.error('Error fetching other user:', error);
      } finally {
        setLoading(false);
      }
    };

    getOtherUserInfo();
  }, [room, user?.id]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (room && user?.id) {
      markAsRead();
    }
  }, [room, user?.id, messages, markAsRead]);

  const handleSendMessage = async () => {
    const content = messageInput.trim();
    if (!content) return;

    const success = await sendMessage(content);
    if (success) {
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" tip="Loading chat..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Card 
        className="flex-shrink-0 border-b border-border"
        bodyStyle={{ padding: '16px' }}
      >
        <div className="flex items-center space-x-3">
          <Avatar
            size={40}
            src={otherUser?.profilePictureUrl}
            icon={<UserOutlined />}
          />
          <div className="flex-1">
            <Text className="font-semibold text-lg">
              {otherUser?.username || 'Unknown User'}
            </Text>
            <br />
            <Text className="text-sm text-muted-foreground">
              {jobTitle ? `Job: ${jobTitle}` : `Job ID: ${room.job_id}`}
            </Text>
          </div>
          <Badge 
            status="success" 
            text={user?.id === room.client_id ? 'Client' : 'Freelancer'} 
          />
        </div>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Text>No messages yet. Start the conversation!</Text>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex ${
                message.sender_id === user?.id ? 'justify-end' : 'justify-start'
              }`}
            >
              <div className={`max-w-xs lg:max-w-md ${
                message.sender_id === user?.id ? 'order-2' : 'order-1'
              }`}>
                <div
                  className={`px-4 py-2 rounded-2xl shadow-sm ${
                    message.sender_id === user?.id
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-card text-card-foreground border border-border rounded-bl-sm'
                  }`}
                >
                  <Text className={
                    message.sender_id === user?.id 
                      ? 'text-primary-foreground' 
                      : 'text-foreground'
                  }>
                    {message.content}
                  </Text>
                </div>
                <div className={`mt-1 ${
                  message.sender_id === user?.id ? 'text-right' : 'text-left'
                }`}>
                  <Text className="text-xs text-muted-foreground">
                    {formatTime(message.created_at)}
                    {message.read_at && message.sender_id === user?.id && (
                      <span className="ml-1">✓✓</span>
                    )}
                  </Text>
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <Card 
        className="flex-shrink-0 border-t border-border"
        bodyStyle={{ padding: '16px' }}
      >
        <div className="flex space-x-2">
          <TextArea
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            autoSize={{ minRows: 1, maxRows: 4 }}
            className="flex-1"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={sending}
            disabled={!messageInput.trim()}
            className="flex-shrink-0"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SupabaseChatWindow;

