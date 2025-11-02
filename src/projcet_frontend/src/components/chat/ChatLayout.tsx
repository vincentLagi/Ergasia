import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Spin } from 'antd';
import { motion } from 'framer-motion';
import { useAtom } from 'jotai';
import { useLocation } from 'react-router-dom';
import ContactList from './ContactList';
import ChatWindow from './ChatWindow';
import { selectedContactAtom } from '../../app/store/chat';
import { useAuth } from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';
import { ChatRoom } from '../../config/supabase';
import './ChatPages.css';

const ChatLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedContact, setSelectedContact] = useAtom(selectedContactAtom);
  const { rooms, currentRoom, setCurrentRoom, loading } = useChat();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 576); // Changed from 768 to 576
  
  // Debug mobile detection
  useEffect(() => {
    console.log('📱 Mobile detection - Window width:', window.innerWidth, 'isMobile:', isMobile);
    // Force desktop for wider screens
    if (window.innerWidth >= 1024 && isMobile) {
      console.log('🖥️ Forcing desktop mode for large screen');
      setIsMobile(false);
    }
  }, [isMobile]);

  // Handle room selection from navigation state (from JobChatButton)
  useEffect(() => {
    const state = location.state as any;
    if (state?.roomId && rooms.length > 0) {
      const room = rooms.find(r => r.id === state.roomId);
      if (room) {
        setCurrentRoom(room);
        setSelectedContact(room.id);
      }
    }
  }, [location.state, rooms, setCurrentRoom, setSelectedContact]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 576; // Changed from 768 to 576
      console.log('🔄 Resize detected - Width:', window.innerWidth, 'New isMobile:', newIsMobile);
      setIsMobile(newIsMobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <Spin size="large" tip="Loading chats..." />
      </div>
    );
  }

  // Mobile view - show either contact list or chat window
  if (isMobile) {
    console.log('📱 Rendering mobile view - selectedContact:', selectedContact);
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-[calc(100vh-140px)]"
      >
        <Card
          className="h-full shadow-lg border-0 bg-card"
          bodyStyle={{ padding: 0, height: '100%' }}
        >
          {!selectedContact ? (
            <ContactList isMobile={true} />
          ) : (
            <ChatWindow />
          )}
        </Card>
      </motion.div>
    );
  }

  // Desktop view - side by side layout  
  console.log('🖥️ Rendering desktop view - selectedContact:', selectedContact, 'currentRoom:', currentRoom?.id);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-140px)]"
    >
      <Row gutter={0} className="h-full">
        <Col span={8} className="h-full">
        
          <Card
            className="h-full shadow-lg border-0 bg-card rounded-l-2xl rounded-r-none border-r border-border"
            bodyStyle={{ padding: 0, height: '100%' }}
          >
            <ContactList isMobile={false} />
          </Card>
        </Col>
        <Col span={16} className="h-full">
          <Card
            className="h-full shadow-lg border-0 bg-card rounded-r-2xl rounded-l-none"
            bodyStyle={{ padding: 0, height: '100%' }}
          >
            <ChatWindow />
          </Card>
        </Col>
      </Row>
    </motion.div>
  );
};

export default ChatLayout;