import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Input, Typography, Badge, Empty, Skeleton, Button } from 'antd';
import { UserOutlined, SearchOutlined, MessageOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useAtom } from 'jotai';
import { selectedContactAtom, currentChatRoomAtom } from '../../app/store/chat';
import { useAuth } from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';
import { ChatRoom } from '../../config/supabase';
import { getUserById } from '../../controller/userController';
import { getJobById } from '../../controller/jobController';

const { Title, Text } = Typography;
const { Search } = Input;

interface ChatContact {
  roomId: string;
  jobId: string;
  jobTitle: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
}

// Helper to get other user in chat room
const getOtherUserId = (room: ChatRoom, currentUserId: string): string => {
  return room.client_id === currentUserId ? room.freelancer_id : room.client_id;
};

interface ContactListProps {
  isMobile?: boolean;
}

const ContactList: React.FC<ContactListProps> = ({ isMobile = false }) => {
  const { user } = useAuth();
  const { rooms } = useChat();
  const [selectedContact, setSelectedContact] = useAtom(selectedContactAtom);
  const [currentRoom, setCurrentRoom] = useAtom(currentChatRoomAtom);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [loading, setLoading] = useState(false);

  // Convert chat rooms to contact list
  const loadContacts = useCallback(async () => {
    if (!user?.id || !rooms.length) {
      setContacts([]);
      return;
    }

    setLoading(true);
    try {
      const contactPromises = rooms.map(async (room) => {
        const otherUserId = getOtherUserId(room, user.id);
        console.log(`👤 Loading contact for room ${room.id}, other user: ${otherUserId}`);
        
        // Get other user details
        const otherUserResult = await getUserById(otherUserId);
        console.log(`📋 User fetch result for ${otherUserId}:`, otherUserResult);
        const otherUser = (otherUserResult && "ok" in otherUserResult) ? otherUserResult.ok : null;
        
        // Get job details
        const job = await getJobById(room.job_id);
        console.log(`💼 Job details for ${room.job_id}:`, job?.jobName);

        const contact: ChatContact = {
          roomId: room.id,
          jobId: room.job_id,
          jobTitle: job?.jobName || 'Unknown Job',
          otherUserId,
          otherUserName: otherUser?.username || 'Unknown User',
          otherUserAvatar: otherUser?.profilePictureUrl || undefined,
          lastMessage: 'Start your conversation',
          timestamp: new Date(room.updated_at).toLocaleString(),
          unreadCount: 0, // Will be updated by useChat hook
          isOnline: false // Could be enhanced with real-time presence
        };

        console.log(`✅ Contact created:`, contact);
        return contact;
      });

      const contactsData = await Promise.all(contactPromises);
      setContacts(contactsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, rooms]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleContactSelect = (contact: ChatContact) => {
    console.log('🎯 Contact selected:', contact);
    console.log('📋 Available rooms:', rooms);
    
    const room = rooms.find(r => r.id === contact.roomId);
    console.log('🏠 Found room:', room);
    
    if (room) {
      console.log('✅ Setting current room and selected contact');
      console.log('📋 ContactList: Setting atoms with room:', room.id);
      console.log('📋 ContactList: Current user:', user?.id);
      
      setCurrentRoom(room);
      setSelectedContact(contact.roomId);
      
      // Force debug after state set
      setTimeout(() => {
        console.log('📋 ContactList: State verification after 100ms:', {
          roomSet: room.id,
          contactSet: contact.roomId,
          userExists: !!user?.id
        });
      }, 100);
    } else {
      console.warn('⚠️ Room not found for contact:', contact.roomId);
    }
  };

  const handleBack = () => {
    console.log('⬅️ Back button clicked');
    setSelectedContact(null);
    setCurrentRoom(null);
  };

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact =>
    contact.otherUserId !== user?.id && (
      contact.otherUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="h-full p-4">
        <div className="mb-4">
          <Title level={4} className="text-foreground mb-2">Messages</Title>
          <Search placeholder="Search conversations..." disabled />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} active avatar paragraph={{ rows: 2 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-3">
          {selectedContact && isMobile ? (
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              className="p-0 h-auto"
            >
              Back
            </Button>
          ) : (
            <Title level={4} className="!mb-0 text-foreground">
              <MessageOutlined className="mr-2" />
              Messages
            </Title>
          )}
        </div>
        
        <Search
          placeholder="Search conversations..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence>
          {filteredContacts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-8"
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span className="text-muted-foreground">
                    {searchTerm ? 'No conversations found' : 'No chat rooms available'}
                  </span>
                }
              />
            </motion.div>
          ) : (
            <List
              className="w-full"
              dataSource={filteredContacts}
              renderItem={(contact, index) => (
                <motion.div
                  key={contact.roomId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <List.Item
                    className={`!p-0 cursor-pointer transition-all duration-200 ${
                      selectedContact === contact.roomId
                        ? 'bg-primary/10 border-r-2 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🖱️ List item clicked, calling handleContactSelect');
                      handleContactSelect(contact);
                    }}
                  >
                    <div className="w-full p-4">
                      <List.Item.Meta
                        avatar={
                          <div className="relative">
                            <Avatar
                              size={48}
                              src={contact.otherUserAvatar}
                              icon={<UserOutlined />}
                              className="border-2 border-background shadow-sm"
                            />
                            {contact.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full"></div>
                            )}
                          </div>
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <div>
                              <Text className="font-semibold text-foreground text-sm">
                                {contact.otherUserName}
                              </Text>
                              <div className="text-xs text-muted-foreground">
                                Job: {contact.jobTitle}
                              </div>
                            </div>
                            {contact.unreadCount > 0 && (
                              <Badge
                                count={contact.unreadCount}
                                className="ml-2"
                                style={{ backgroundColor: '#1890ff' }}
                              />
                            )}
                          </div>
                        }
                        description={
                          <div className="space-y-1">
                            <Text className="text-muted-foreground text-xs line-clamp-1">
                              {contact.lastMessage}
                            </Text>
                            <Text className="text-muted-foreground text-xs">
                              {contact.timestamp}
                            </Text>
                          </div>
                        }
                      />
                    </div>
                  </List.Item>
                </motion.div>
              )}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContactList;