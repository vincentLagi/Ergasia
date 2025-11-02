import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  X,
  Bell,
  Search,
  ChevronRight,
  Clock,
  Circle,
} from "lucide-react";
import { markInboxAsRead } from "../../controller/inboxController";
import { InboxResponse } from "../../shared/types/Inbox";

interface FloatingInboxProps {
  messages: InboxResponse[] | [];
  isOpen: boolean;
  onClose: () => void;
}

const FloatingInbox = ({ messages, isOpen, onClose }: FloatingInboxProps) => {
  const [selectedMessage, setSelectedMessage] = useState<InboxResponse | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const unreadCount = messages.filter((msg) => !msg.read).length;

  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.senderName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUnread = showUnreadOnly ? !msg.read : true;

    return matchesSearch && matchesUnread;
  });

  const handleSelectMessage = async (message: InboxResponse) => {
    setSelectedMessage(message);
    if (!message.read) {
      message.read = true;
      await markInboxAsRead(message.id);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <motion.div
        className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-xl overflow-hidden"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <>
              <Bell className="w-6 h-6 text-white" />
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs font-bold"
                >
                  {unreadCount}
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>

      {/* Inbox Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 bg-white rounded-xl shadow-xl overflow-hidden"
            drag
            dragConstraints={{
              top: -window.innerHeight + 200, // Adjust based on your needs
              left: -window.innerWidth + 400, // Adjust based on your needs
              right: 0,
              bottom: 0,
            }}
            dragElastic={0.05}
            dragMomentum={false}
            dragTransition={{ power: 0.1, timeConstant: 200 }}
          >
            <div className="h-96 flex flex-col">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Inbox ({unreadCount})
                  </h2>
                  <button
                    onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                    className={`px-2 py-1 rounded-md text-sm ${
                      showUnreadOnly ? "bg-white/20" : "hover:bg-white/10"
                    }`}
                  >
                    {showUnreadOnly ? "Showing unread" : "Show all"}
                  </button>
                </div>

                <div className="mt-3 relative">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 bg-white/10 rounded-lg focus:outline-none placeholder:text-white/70"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-white/70" />
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto bg-gray-50">
                {filteredMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`p-4 border-b border-gray-100 cursor-pointer ${
                      selectedMessage?.id === message.id ? "bg-blue-50" : ""
                    } ${!message.read ? "bg-blue-50/30" : ""}`}
                    onClick={() => handleSelectMessage(message)}
                    whileHover={{ backgroundColor: "rgb(239 246 255)" }}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {!message.read ? (
                          <Circle className="w-2 h-2 text-blue-500 fill-blue-500 mt-1.5" />
                        ) : (
                          <div className="w-2 h-2" />
                        )}
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between">
                          <p
                            className={`truncate text-sm ${
                              !message.read ? "font-semibold" : ""
                            }`}
                          >
                            {message.senderName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {message.createdAt}
                          </p>
                        </div>
                        <p
                          className={`truncate text-sm mt-1 ${
                            !message.read ? "font-semibold" : ""
                          }`}
                        >
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Detail View */}
              <AnimatePresence>
                {selectedMessage && (
                  <motion.div
                    initial={{ x: 300 }}
                    animate={{ x: 0 }}
                    exit={{ x: 300 }}
                    className="absolute inset-0 bg-white p-4 overflow-y-auto"
                  >
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="mb-4 text-gray-500 hover:text-gray-700"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                    </button>

                    <div className="mb-4">
                      <div className="flex items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center text-white font-semibold mr-3">
                          {selectedMessage.senderName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {selectedMessage.senderName}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-line">
                        {selectedMessage.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Keep the sampleMessages array from previous code

export default FloatingInbox;
