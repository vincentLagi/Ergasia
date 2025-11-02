import React, { useState } from 'react';
import {
  Card,
  Typography,
  List,
  Avatar,
  Badge,
  Button,
  Space,
  Tag,
  Modal,
  Skeleton,
  Empty,
  Tabs
} from 'antd';
import {
  MessageOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useInbox } from '../shared/hooks';
import { InboxResponse } from '../shared/types/Inbox';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Use optimized custom hook
  const {
    messages,
    filteredMessages,
    unreadCount,
    loading,
    activeTab,
    handleMarkAsRead,
    setActiveTab
  } = useInbox(user?.id);
  
  const [selectedMessage, setSelectedMessage] = useState<InboxResponse | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);

  // Handle view message details
  const handleViewDetails = (msg: InboxResponse) => {
    setSelectedMessage(msg);
    setIsDetailModalVisible(true);
    
    // Mark as read if not already read
    if (!msg.read) {
      handleMarkAsRead(msg.id);
    }
  };

  // Handle accept with modal close
  const handleAcceptWithClose = async (messageId: string) => {
    setIsDetailModalVisible(false);
    // const success = await handleAccept(messageId);
    // if (success) {
    // }
  };

  // Handle reject with modal close
  const handleRejectWithClose = async (messageId: string) => {
    setIsDetailModalVisible(false);
    // const success = await handleReject(messageId);
    // if (success) {
    // }
  };

  // Get message type color
  const getMessageTypeColor = (message: string) => {
    if (message.includes('application')) return 'blue';
    if (message.includes('invitation')) return 'purple';
    if (message.includes('submission')) return 'green';
    if (message.includes('accepted')) return 'success';
    if (message.includes('rejected')) return 'error';
    return 'default';
  };

  // Get message type tag
  const getMessageTypeTag = (message: string) => {
    if (message.includes('application')) return 'Application';
    if (message.includes('invitation')) return 'Invitation';
    if (message.includes('submission')) return 'Submission';
    return 'Notification';
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton active />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <Title level={2}>
                <MessageOutlined className="mr-2" />
                Message Inbox
                {unreadCount > 0 && (
                  <Badge count={unreadCount} className="ml-2" />
                )}
              </Title>
              <Text type="secondary">
                Stay updated with your job applications, invitations, and submissions
              </Text>
            </div>
          </div>

          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane tab={`All Messages (${messages.length})`} key="all" />
              <TabPane tab={`Unread (${unreadCount})`} key="unread" />
              <TabPane tab="Applications" key="applications" />
              <TabPane tab="Invitations" key="invitations" />
              <TabPane tab="Submissions" key="submissions" />
            </Tabs>

            {filteredMessages.length === 0 ? (
              <Empty
                description="No messages found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="py-8"
              />
            ) : (
              <List
                itemLayout="horizontal"
                dataSource={filteredMessages}
                renderItem={(msg) => (
                  <List.Item
                    className={`cursor-pointer hover:bg-gray-50 p-4 rounded-lg ${
                      !msg.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => handleViewDetails(msg)}
                    actions={[
                      <Button
                        key="view"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(msg);
                        }}
                      >
                        View
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Badge dot={!msg.read}>
                          <Avatar icon={<UserOutlined />} />
                        </Badge>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Text strong={!msg.read}>From: {msg.senderName}</Text>
                            <Tag color={getMessageTypeColor(msg.message)}>
                              {getMessageTypeTag(msg.message)}
                            </Tag>
                          </div>
                          <Text type="secondary" className="text-sm">
                            {msg.createdAt}
                          </Text>
                        </div>
                      }
                      description={
                        <Text className={!msg.read ? 'font-medium' : ''}>
                          {msg.message}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </motion.div>
      </div>

      {/* Message Detail Modal */}
      <Modal
        title="Message Details"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={600}
        centered
      >
        {selectedMessage && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Text strong>From: {selectedMessage.senderName}</Text>
                <br />
                <Text type="secondary">To: {selectedMessage.receiverName}</Text>
              </div>
              <div className="text-right">
                <Tag color={getMessageTypeColor(selectedMessage.message)}>
                  {getMessageTypeTag(selectedMessage.message)}
                </Tag>
                <br />
                <Text type="secondary" className="text-sm">
                  {selectedMessage.createdAt}
                </Text>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <Text>{selectedMessage.message}</Text>
            </div>

            {/* Action buttons for invitations and applications that need response */}
            {selectedMessage.message.includes('request') && (
              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => handleRejectWithClose(selectedMessage.id)}
                  icon={<CloseOutlined />}
                >
                  Reject
                </Button>
                <Button
                  type="primary"
                  onClick={() => handleAcceptWithClose(selectedMessage.id)}
                  icon={<CheckOutlined />}
                >
                  Accept
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InboxPage;