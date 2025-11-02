import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Typography,
  Badge,
  Button,
  Divider,
  Tag
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { InboxResponse } from '../../shared/types/Inbox';

const { Text } = Typography;

export interface MessageDetailProps {
  message: InboxResponse;
  onBack: () => void;
  onMarkAsRead: (messageId: string) => Promise<boolean>;
}

export const MessageDetail: React.FC<MessageDetailProps> = ({ message, onBack, onMarkAsRead }) => {
  const navigate = useNavigate();

  const handleMarkAsRead = async () => {
    if (!message.read) {
      await onMarkAsRead(message.id);
    }
  };

  React.useEffect(() => {
    handleMarkAsRead();
  }, [message.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewJob = () => {
    if (message.jobId) {
      navigate(`/jobs/${message.jobId}`);
    }
  };

  const handleViewProfile = () => {
    if (message.senderId) {
      navigate(`/profile/${message.senderId}`);
    }
  };

  return (
      <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="h-full flex flex-col bg-background"
      >
          {/* Header */}
          <div className="flex items-center justify-between py-2border-b border-border">
              <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={onBack}
                  className="text-muted-foreground hover:text-foreground"
              >
                  Back
              </Button>
              <div className="flex items-center space-x-2">
                  {!message.read && (
                      <Badge
                          status="processing"
                          text="New"
                          className="text-primary"
                      />
                  )}
              </div>
          </div>

          {/* Content - Gmail/Outlook Style */}
          <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-0">
                  {/* Sender Info Section */}
                  <div className="flex items-start flex-col justify-between">
                      {/* Left side: Avatar and Names */}
                      <div className="flex items-center gap-3">
                          <Avatar
                              size={40}
                              src={<UserOutlined />} // Assuming you have an avatar URL
                              className="bg-primary/10 text-primary border border-primary/20"
                          >
                              {/* Fallback if no image src */}
                              {message.senderName?.charAt(0).toUpperCase()}
                          </Avatar>
                          <div className="flex flex-col">
                              <button
                                  onClick={handleViewProfile}
                                  className="text-left font-semibold text-foreground hover:underline"
                              >
                                  {message.senderName}
                              </button>
                              <span className="text-sm text-muted-foreground">
                                  To: {message.receiverName}
                              </span>
                          </div>
                      </div>

                      {/* Right side: Timestamp */}
                      <span className="text-xs text-end text-foreground/50 whitespace-nowrap pt-4 w-full">
                          {formatDate(message.createdAt)}
                      </span>
                  </div>

                  <Divider className="my-0" />

                  {/* Message Content Section */}
                  <div className="py-4">
                      <div className="bg-background border border-border rounded-lg p-4">
                          <Text className="text-foreground leading-relaxed whitespace-pre-wrap">
                              {message.message.split("\n")[1]}
                          </Text>
                      </div>
                  </div>

                  {/* Job Info Section */}
                  {message.jobId && (
                      <>
                          <div className="pt-4">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                      <FileTextOutlined className="text-muted-foreground" />
                                      <Text className="text-sm text-muted-foreground">
                                          Related Job
                                      </Text>
                                  </div>
                                  <Button
                                      type="link"
                                      size="small"
                                      onClick={handleViewJob}
                                      className="text-primary hover:text-primary/80"
                                  >
                                      View Job Details
                                  </Button>
                              </div>
                          </div>
                          <Divider className="my-0" />
                      </>
                  )}

                  {/* Status Section */}
                  <div className="py-4">
                      <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                              <CheckCircleOutlined
                                  className={
                                      message.read
                                          ? 'text-green-500'
                                          : 'text-muted-foreground'
                                  }
                              />
                              <Text className="text-sm text-muted-foreground">
                                  {message.read ? 'Read' : 'Unread'}
                              </Text>
                          </div>

                          {/* Message Type Tag */}
                          <Tag
                              color={
                                  message.message.includes('application')
                                      ? 'blue'
                                      : message.message.includes('invitation')
                                      ? 'purple'
                                      : message.message.includes('submission')
                                      ? 'green'
                                      : 'default'
                              }
                              className="rounded-full"
                          >
                              {message.message.includes('application')
                                  ? 'Application'
                                  : message.message.includes('invitation')
                                  ? 'Invitation'
                                  : message.message.includes('submission')
                                  ? 'Submission'
                                  : 'Message'}
                          </Tag>
                      </div>
                  </div>
              </div>
          </div>
      </motion.div>
  );
};