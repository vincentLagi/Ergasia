import React, { useState } from 'react';
import {
  Drawer,
  Typography,
  Badge,
  Button,
} from 'antd';
import {
  CloseOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useInbox } from '../../shared/hooks/useInbox';
import { useInboxPanel } from '../../contexts/InboxPanelContext';
import { useAuth } from '../../hooks/useAuth';
import { InboxResponse } from '../../shared/types/Inbox';
import { MessageDetail } from './MessageDetail';
import { MessageList } from './MessageList';
import { relative } from 'path';

const { Text } = Typography;

const InboxPanel: React.FC = () => {
  const { isInboxPanelOpen, closeInboxPanel } = useInboxPanel();
  const { user } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<InboxResponse | null>(null);
  
  const {
    messages,
    unreadCount,
    loading,
    handleMarkAsRead,
    refreshMessages
  } = useInbox(user?.id);

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  const handleMessageClick = async (message: InboxResponse) => {
    setSelectedMessage(message);
    // Immediately update unread count if message is unread
    if (!message.read) {
      await handleMarkAsRead(message.id);
    }
  };

  const handleBackToList = () => {
    setSelectedMessage(null);
    refreshMessages(); // Refresh to update read status
  };

  const formatMessagePreview = (message: string) => {
    const words = message.split(' ');
    return words.length > 8 ? words.slice(0, 8).join(' ') + '...' : message;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  return (
    <Drawer
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageOutlined className="text-primary" />
            <span className="text-foreground">Messages</span>
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                size="small"
                className="ml-2"
              />
            )}
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={closeInboxPanel}
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
      }
      onClose={closeInboxPanel}
      open={isInboxPanelOpen}
      styles={{
        header: {
          backgroundColor: 'hsl(var(--card))',
          borderBottom: '1px solid hsl(var(--border))',
          padding: '16px 24px'
        },
        body: {
          backgroundColor: 'hsl(var(--background))',
          position: 'relative',
          padding: 0,
        }
      }}
      closable={false}
    >
      <AnimatePresence mode="wait">
        {selectedMessage ? (
          <MessageDetail
            key="detail"
            message={selectedMessage}
            onBack={handleBackToList}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full"
          >
            <MessageList
              loading={loading}
              messages={messages}
              handleMessageClick={handleMessageClick}
              formatDate={formatDate}
              formatMessagePreview={formatMessagePreview}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
};

export default InboxPanel;