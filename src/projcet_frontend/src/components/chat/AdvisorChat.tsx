import React, { useState, useRef, useEffect } from 'react';
import { askAdvisor } from '../../controller/advisorController';
import { motion, AnimatePresence } from 'framer-motion';
import { Input, Button, Avatar, Typography, Spin, Empty } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../../hooks/useAuth';
import { projcet_backend_single } from '../../../../declarations/projcet_backend_single';

// Custom scrollbar styles
const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: hsl(var(--primary) / 0.2);
        border-radius: 3px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--primary) / 0.3);
    }
`;

const { Text } = Typography;

interface Message {
    text: string;
    sender: 'user' | 'ai';
}

interface AdvisorChatProps {
    initialMessage?: string;
    onFirstMessage?: () => void;
}

const AdvisorChat: React.FC<AdvisorChatProps> = ({ initialMessage, onFirstMessage }) => {
    const { user, refreshUser } = useAuth();
    const [messages, setMessages] = useState<Message[]>([
        { text: "Hello! I'm your AI Freelance Assistant. How can I help you succeed in your freelancing journey today?", sender: 'ai' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    const [tokenUpdateTrigger, setTokenUpdateTrigger] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (initialMessage && !hasStarted) {
            handleSend(initialMessage);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialMessage, hasStarted]);

    // Re-render when tokens update
    useEffect(() => {
        // Silent token update handling
    }, [tokenUpdateTrigger]);

    // Development helper functions
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            (window as any).refreshUserData = refreshUser;
        }
    }, [refreshUser]);

    const handleSend = async (messageText?: string) => {
        const textToSend = messageText || input.trim();
        if (textToSend === '') return;

        // Check if user has enough tokens
        const availableTokens = user?.chatTokens?.availableTokens ? Number(user.chatTokens.availableTokens) : 0;
        if (availableTokens <= 0) {
            const errorMessage: Message = {
                text: '⚠️ You need chat tokens to use the AI assistant. Please check your token balance.',
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }

        if (!hasStarted) {
            setHasStarted(true);
            onFirstMessage?.();
        }

        const userMessage: Message = { text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        if (!messageText) setInput('');
        setIsLoading(true);

        try {
            const aiResponse = await askAdvisor(textToSend);
            const aiMessage: Message = { text: aiResponse, sender: 'ai' };
            setMessages(prev => [...prev, aiMessage]);

            // Deduct token after successful AI response
            try {
                const tokenResult = await projcet_backend_single.useChatToken(user!.id);

                if ('ok' in tokenResult) {
                    // Refresh user data to update token balance
                    await refreshUser();
                    setTokenUpdateTrigger(prev => prev + 1);
                } else {
                    const errorMsg: Message = {
                        text: '⚠️ Insufficient tokens. Please check your token balance.',
                        sender: 'ai'
                    };
                    setMessages(prev => [...prev, errorMsg]);
                }
            } catch (tokenError) {
                const errorMsg: Message = {
                    text: '⚠️ Token deduction failed. Please try again later.',
                    sender: 'ai'
                };
                setMessages(prev => [...prev, errorMsg]);
            }
        } catch (error) {
            const errorMessage: Message = {
                text: 'Sorry, I\'m having trouble connecting to my AI brain right now. Please try again later.',
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        // Set the input with the suggestion
        setInput(suggestion);

        // Focus the input field
        const inputElement = document.querySelector('input[type="text"], textarea') as HTMLInputElement | HTMLTextAreaElement;
        if (inputElement) {
            setTimeout(() => {
                inputElement.focus();
                // Place cursor at the end of the text
                inputElement.setSelectionRange(suggestion.length, suggestion.length);
            }, 100);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const quickQuestions = [
        // Kategori 2: Job & Career Help
        "Rekomendasikan pekerjaan dengan skill React",
        "Cari pekerjaan untuk kategori Web Development",
        "Rekomendasikan pekerjaan dengan skill [masukkan skill Anda]",
        "Berikan saran budget untuk [deskripsikan proyek Anda]",
        "Buatkan template proposal untuk pekerjaan [masukkan deskripsi pekerjaan]",
        "Tampilkan pekerjaan terbaru yang tersedia",
        // Kategori 3: Talent Search
        "Carikan saya talent untuk Web Development",
        "Temukan freelancer terbaik untuk UI/UX Design",
        "Carikan saya talent untuk [masukkan bidang keahlian]",
        "Temukan freelancer terbaik untuk [masukkan skill atau teknologi]",
        "Cari kandidat yang ahli di [masukkan teknologi/framework]",
        "Tampilkan beberapa freelancer aktif di platform",
        // Kategori 5: Financial Overview
        "Berikan ringkasan keuangan saya bulan ini",
        "Tampilkan semua transaksi saya",
        "Tampilkan pemasukan dari semua proyek saya"
    ];

    return (
        <div className="flex h-full w-full bg-background">
            {/* Inject custom scrollbar styles */}
            <style dangerouslySetInnerHTML={{ __html: scrollbarStyles }} />
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
            {/* Messages */}
                <div className="flex-1 p-4 lg:p-8 overflow-y-auto chat-messages-container">
                    <div className="max-w-none mx-auto px-2 lg:px-8">
                        <AnimatePresence>
                {messages.map((msg, index) => (
                    <motion.div
                        key={index}
                                    initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`flex items-start gap-4 mb-6 ${msg.sender === 'user' ? 'justify-end' : ''}`}
                    >
                        {msg.sender === 'ai' && (
                                        <div className="flex-shrink-0">
                            <Avatar
                                                size={40}
                                icon={<RobotOutlined />}
                                                className="bg-gradient-to-br from-primary to-purple-600 text-white border-0"
                            />
                                        </div>
                        )}
                        <div
                                        className={`max-w-[85%] lg:max-w-[75%] xl:max-w-[70%] ${
                                msg.sender === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md px-6 py-4'
                                                : 'bg-card border border-border rounded-2xl rounded-bl-md px-6 py-4 shadow-sm'
                            }`}
                        >
                                    <div className={`prose prose-sm max-w-full ${
                                        msg.sender === 'user' ? 'text-primary-foreground' : 'text-foreground'
                                    }`}>
                                <ReactMarkdown
                                    components={{
                                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                                em: ({ children }) => <em className="italic">{children}</em>,
                                                ul: ({ children }) => <ul className="list-disc list-inside my-2">{children}</ul>,
                                                li: ({ children }) => <li className="mb-1">{children}</li>,
                                    }}
                                >
                                    {msg.text}
                                </ReactMarkdown>
                            </div>
                        </div>
                        {msg.sender === 'user' && (
                                        <div className="flex-shrink-0">
                            <Avatar
                                                size={40}
                                icon={<UserOutlined />}
                                                className="bg-muted text-muted-foreground border border-border"
                            />
                                        </div>
                        )}
                    </motion.div>
                ))}
                        </AnimatePresence>
                    
                {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-4 mb-6"
                            >
                                <div className="flex-shrink-0">
                        <Avatar
                                        size={40}
                            icon={<RobotOutlined />}
                                        className="bg-gradient-to-br from-primary to-purple-600 text-white border-0"
                                    />
                                </div>
                                <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="typing-dots">
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                            <div className="typing-dot"></div>
                                        </div>
                                        <Text className="text-muted-foreground ml-2">AI is thinking...</Text>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Mobile Quick Questions - Show only if conversation just started and on mobile/tablet */}
                        {messages.length === 1 && !isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-8 mobile-suggestions lg:hidden"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <BulbOutlined className="text-primary text-lg" />
                                    <Text className="text-base text-muted-foreground font-medium">Quick questions to get started:</Text>
                                </div>
                                <div className="max-h-64 overflow-y-auto custom-scrollbar mb-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-2">
                                        {quickQuestions.slice(0, 6).map((question, index) => (
                                            <motion.button
                                                key={index}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + index * 0.1 }}
                                                onClick={() => handleSuggestionClick(question)}
                                                className="text-left p-4 bg-card border border-border rounded-xl hover:bg-muted/50 hover:border-primary/50 hover:shadow-md transition-all duration-200 text-sm group"
                                                disabled={isLoading}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <div className="w-2 h-2 bg-primary/60 rounded-full mt-2 group-hover:bg-primary transition-colors flex-shrink-0"></div>
                                                    <span className="flex-1 leading-relaxed">{question}</span>
                                                </div>
                                            </motion.button>
                                        ))}
                        </div>
                    </div>

                                {/* Mobile Tips Section */}
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                        <RobotOutlined className="text-primary" />
                                        Tips for better results
                                    </h4>
                                    <ul className="text-sm text-muted-foreground space-y-1">
                                        <li>• Be specific about your freelance niche</li>
                                        <li>• Ask about real scenarios you're facing</li>
                                        <li>• Request step-by-step guidance</li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    
                <div ref={messagesEndRef} />
                    </div>
            </div>

            {/* Input */}
                <div className="p-4 lg:p-8 border-t border-border bg-card/50 backdrop-blur-sm">
                    <div className="max-w-none mx-auto px-2 lg:px-8">
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <Input.TextArea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onPressEnter={handleKeyPress}
                        disabled={isLoading}
                                    placeholder="Ask me anything about freelancing..."
                                    autoSize={{ minRows: 1, maxRows: 4 }}
                                    className="rounded-xl resize-none text-base"
                        style={{
                            backgroundColor: 'hsl(var(--background))',
                            borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))',
                                        fontSize: '16px',
                                        padding: '12px 16px'
                        }}
                    />
                            </div>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                                onClick={() => handleSend()}
                        disabled={isLoading || !input.trim()}
                        loading={isLoading}
                                size="large"
                                className="h-auto px-6 py-3 rounded-xl text-base font-medium"
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Suggestions Sidebar */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="hidden lg:flex flex-col w-80 xl:w-96 border-l border-border bg-card/30 backdrop-blur-sm suggestions-sidebar"
            >
                {/* Sidebar Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <BulbOutlined className="text-primary text-xl" />
                        <div>
                            <h3 className="font-semibold text-foreground">Quick Suggestions</h3>
                            <p className="text-sm text-muted-foreground">Click to ask instantly</p>
                        </div>
                    </div>
                </div>

                {/* Suggestions List */}
                <div className="flex-1 p-6 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        <div className="space-y-3">
                            {quickQuestions.map((question, index) => (
                                <motion.button
                                    key={index}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + index * 0.1 }}
                                    onClick={() => handleSuggestionClick(question)}
                                    className="w-full text-left p-4 bg-card border border-border rounded-xl hover:bg-muted/50 hover:border-primary/50 hover:shadow-md transition-all duration-200 text-sm group suggestions-sidebar-button"
                                    disabled={isLoading}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-2 h-2 bg-primary/60 rounded-full mt-2 group-hover:bg-primary transition-colors flex-shrink-0"></div>
                                        <span className="flex-1 leading-relaxed">{question}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Additional helpful tips - outside scrollable area */}
                    <div className="p-6 pt-4 border-t border-border">
                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl">
                            <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                                <RobotOutlined className="text-primary" />
                                Tips for better results
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>• Be specific about your freelance niche</li>
                                <li>• Ask about real scenarios you're facing</li>
                                <li>• Request step-by-step guidance</li>
                                <li>• Mention your experience level</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AdvisorChat;