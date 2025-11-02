import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Typography, Card, Button, Tooltip, Avatar } from 'antd';
import '../components/chat/ChatPages.css';
import { 
  RobotOutlined, 
  BulbOutlined, 
  UserOutlined,
  StarOutlined,
  QuestionCircleOutlined,
  SendOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAtom } from 'jotai';
import { breadcrumbsAtom } from '../app/store/ui';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../ui/components/Navbar';
import AdvisorChat from '../components/chat/AdvisorChat';
import TokenBalance from '../components/shared/TokenBalance';

const { Title, Text, Paragraph } = Typography;

const suggestedQuestions = [
  // Kategori 2: Job & Career Help
  "Rekomendasikan pekerjaan dengan skill [masukkan skill Anda]",
  "Berikan saran budget untuk [deskripsikan proyek Anda]",
  "Buatkan template proposal untuk pekerjaan [masukkan deskripsi pekerjaan]",
  "Tampilkan pekerjaan terbaru yang tersedia",
  // Kategori 3: Talent Search

  "Carikan saya talent untuk [masukkan bidang keahlian]",
  "Temukan freelancer terbaik untuk [masukkan skill atau teknologi]",
  "Cari kandidat yang ahli di [masukkan teknologi/framework]",
  "Tampilkan beberapa freelancer aktif di platform",
  // Kategori 5: Financial Overview
  "Berikan ringkasan keuangan saya bulan ini",
  "Tampilkan semua transaksi saya",
  "Tampilkan pemasukan dari semua proyek saya"
];

const features = [
  {
    icon: <BulbOutlined className="text-yellow-500" />,
    title: "Smart Recommendations",
    description: "Get personalized advice based on your profile and goals"
  },
  {
    icon: <StarOutlined className="text-blue-500" />,
    title: "Industry Insights",
    description: "Stay updated with market trends and opportunities"
  },
  {
    icon: <QuestionCircleOutlined className="text-green-500" />,
    title: "24/7 Support",
    description: "Get instant answers to your freelancing questions"
  }
];

const ChatWithAIPage: React.FC = () => {
  const [, setBreadcrumbs] = useAtom(breadcrumbsAtom);
  const [showChat, setShowChat] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>('');
  const { user } = useAuth();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Home', path: '/' },
      { label: 'AI Assistant', icon: <RobotOutlined /> }
    ]);

    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs]);

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    setShowChat(true);
  };

  const handleStartChat = () => {
    setShowChat(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <AnimatePresence mode="wait">
        {!showChat ? (
          // Welcome Screen
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="container mx-auto px-4 py-8"
          >
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center mb-12"
            >
              <div className="relative">
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-24 h-24 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl"
                >
                  <RobotOutlined className="text-4xl text-white" />
                </motion.div>
                
                {/* Floating particles */}
                <div className="absolute inset-0 -z-10">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 bg-primary/30 rounded-full"
                      animate={{
                        x: [0, Math.random() * 100 - 50],
                        y: [0, Math.random() * 100 - 50],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2
                      }}
                      style={{
                        left: `${20 + Math.random() * 60}%`,
                        top: `${20 + Math.random() * 60}%`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <Title level={1} className="!mb-4 text-primary">
                AI Freelance Assistant
              </Title>
              <Paragraph className="text-xl text-muted-foreground max-w-2xl mx-auto !mb-8">
                Your intelligent companion for freelance success. Get personalized advice, 
                industry insights, and expert guidance to grow your career.
              </Paragraph>

              {user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center space-x-3 mb-8"
                >
                  <Avatar 
                    src={user ? `/api/users/${user.id}/profile-picture` : undefined}
                    icon={<UserOutlined />}
                    size={32}
                  />
                  <Text className="text-muted-foreground">
                    Welcome back, <span className="font-semibold text-foreground">{user.username}</span>!
                  </Text>
                  
                  {/* Chat Token Balance */}
                  <TokenBalance 
                    key={`welcome-token-${user?.chatTokens?.availableTokens || 0}`}
                    tokenCount={user?.chatTokens?.availableTokens ? Number(user.chatTokens.availableTokens) : 0}
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                  <Button
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={handleStartChat}
                    className="h-12 px-8 text-lg font-semibold shadow-lg"
                  >
                  Start Conversation
                  <ArrowRightOutlined className="ml-2" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="grid md:grid-cols-3 gap-6 mb-12"
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group"
                >
                  <Card className="h-full border-0 shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        {React.cloneElement(feature.icon, { className: "text-2xl" })}
                      </div>
                      <Title level={4} className="!mb-2 text-foreground">
                        {feature.title}
                      </Title>
                      <Text className="text-muted-foreground">
                        {feature.description}
                      </Text>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Suggested Questions */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <Title level={3} className="text-center !mb-8 text-foreground">
                Popular Questions
              </Title>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
                {suggestedQuestions.map((question, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card
                      hoverable
                      className="h-full border-0 shadow-md bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => handleQuestionSelect(question)}
                    >
                      <div className="flex items-start space-x-3">
                        <QuestionCircleOutlined className="text-primary mt-1 flex-shrink-0" />
                        <Text className="text-foreground font-medium leading-relaxed">
                          {question}
                        </Text>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        ) : (
          // Full-screen Chat Interface
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.5 }}
            className="h-[calc(100vh-64px)] flex flex-col"
          >
            {/* Chat Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-border p-4"
            >
              <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                    <RobotOutlined className="text-white text-lg" />
                  </div>
                  <div>
                    <Title level={4} className="!mb-0 text-foreground">
                      AI Freelance Assistant
                    </Title>
                    <Text className="text-muted-foreground text-sm">
                      Here to help you succeed as a freelancer
                    </Text>
                  </div>
                  
                  {/* Chat Token Balance */}
                  {user && (
                    <TokenBalance 
                      key={`header-token-${user?.chatTokens?.availableTokens || 0}`}
                      tokenCount={user?.chatTokens?.availableTokens ? Number(user.chatTokens.availableTokens) : 0}
                    />
                  )}
                </div>
                
                <Button
                  type="text"
                  onClick={() => setShowChat(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Back to Home
                </Button>
              </div>
            </motion.div>

            {/* Chat Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex-grow bg-gradient-to-b from-background to-muted/10 p-3 lg:p-6"
            >
              <div className="h-full w-full">
                <div className="bg-card/70 backdrop-blur-sm border border-border rounded-2xl shadow-2xl h-full overflow-hidden ai-chat-full-width">
                  <AdvisorChat 
                    initialMessage={selectedQuestion}
                    onFirstMessage={() => setSelectedQuestion('')}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/3 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 right-1/3 w-96 h-96 bg-purple-500/3 rounded-full blur-3xl"></div>
        <div className="absolute top-2/3 left-1/6 w-64 h-64 bg-blue-500/3 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default ChatWithAIPage;