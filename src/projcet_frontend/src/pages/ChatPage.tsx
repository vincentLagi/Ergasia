import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Typography } from 'antd';
import '../components/chat/ChatPages.css';
import { MessageOutlined } from '@ant-design/icons';
import { useAtom } from 'jotai';
import { breadcrumbsAtom } from '../app/store/ui';
import Navbar from '../ui/components/Navbar';
import ChatLayout from '../components/chat/ChatLayout';

const { Title } = Typography;

const ChatPage: React.FC = () => {
  const [, setBreadcrumbs] = useAtom(breadcrumbsAtom);

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/' },
      { label: 'Messages', icon: <MessageOutlined /> }
    ]);

    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navbar />
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <MessageOutlined className="text-2xl text-primary" />
              </div>
              <div>
                <Title level={2} className="!mb-1 text-foreground">
                  Messages
                </Title>
                <p className="text-muted-foreground">
                  Connect and collaborate with freelancers and clients
                </p>
              </div>
            </div>
            
            {/* Optional: Add quick action buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-card border border-border rounded-lg shadow-sm"
              >
                <span className="text-sm text-muted-foreground">
                  All conversations
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Chat Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="container mx-auto px-4 py-6"
      >
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl shadow-xl overflow-hidden">
          <ChatLayout />
        </div>
      </motion.div>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default ChatPage;