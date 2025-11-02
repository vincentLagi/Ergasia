import React from 'react';
import { List, Avatar, Typography, Spin, Empty } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { InboxResponse } from '../../shared/types/Inbox';

const { Text } = Typography;

interface MessageListProps {
  loading: boolean;
  messages: InboxResponse[];
  handleMessageClick: (message: InboxResponse) => void;
  formatDate: (dateString: string) => string;
  formatMessagePreview: (message: string) => string;
}

export const MessageList: React.FC<MessageListProps> = ({
  loading,
  messages,
  handleMessageClick,
  formatDate,
  formatMessagePreview,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text className="text-muted-foreground">
              No messages yet
            </Text>
          }
        />
      </div>
    );
  }

  return (
    <List
      dataSource={messages}
      renderItem={(message) => (
        <motion.div
          whileHover={{ backgroundColor: 'hsla(220, 14.3%, 95.9%, 0.5)' }}
          transition={{ duration: 0.2 }}
        >
          <List.Item
            className={`cursor-pointer border-0 px-8 py-3 ${
              !message.read
                ? 'bg-primary/5 border-l-4 border-l-primary'
                : 'hover:bg-muted/30'
            }`}
            onClick={() => handleMessageClick(message)}
          >
            <List.Item.Meta
              avatar={
                <div className="relative pl-4 pt-4">
                  <Avatar
                    icon={<UserOutlined />}
                    className="bg-primary/10 text-primary border-primary/20"
                  />
                  {!message.read && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
                  )}
                </div>
              }
              title={
                <div className="flex justify-between items-start">
                  <Text
                    strong={!message.read}
                    className={`text-sm ${
                      !message.read ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {message.senderName}
                  </Text>
                  <Text
                    className={`text-xs ${
                      !message.read ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {formatDate(message.createdAt)}
                  </Text>
                </div>
              }
              description={
                <Text
                  className={`text-sm ${
                    !message.read ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {formatMessagePreview(message.message)}
                </Text>
              }
            />
          </List.Item>
        </motion.div>
      )}
    />
  );
};