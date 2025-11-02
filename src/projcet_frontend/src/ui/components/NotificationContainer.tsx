import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { notification } from 'antd';
import { useAtom } from 'jotai';
import { notificationsAtom } from '../../app/store/ui';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationIcon = ({ type }: { type: 'success' | 'error' | 'warning' | 'info' }) => {
  const iconProps = { size: 20 };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} className="text-green-500" />;
    case 'error':
      return <XCircle {...iconProps} className="text-red-500" />;
    case 'warning':
      return <AlertTriangle {...iconProps} className="text-yellow-500" />;
    case 'info':
      return <Info {...iconProps} className="text-blue-500" />;
    default:
      return <Info {...iconProps} className="text-gray-500" />;
  }
};

export const NotificationContainer: React.FC = () => {
  const [notifications] = useAtom(notificationsAtom);
  const { removeNotification } = useNotifications();

  const getNotificationStyles = (type: string) => {
    const baseStyles = "border-l-4 shadow-lg";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-400`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-400`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-400`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-400`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-400`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`p-4 rounded-lg ${getNotificationStyles(notif.type)} backdrop-blur-sm`}
          >
            <div className="flex items-start space-x-3">
              <NotificationIcon type={notif.type} />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {notif.title}
                </h4>
                <p className="text-sm text-gray-700 mt-1 break-words">
                  {notif.message}
                </p>
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Alternative Ant Design notification approach
export const useAntdNotifications = () => {
  const [api, contextHolder] = notification.useNotification();

  const showNotification = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration = 4.5
  ) => {
    api[type]({
      message: title,
      description: message,
      duration,
      placement: 'topRight',
    });
  };

  return {
    contextHolder,
    success: (title: string, message: string, duration?: number) => 
      showNotification('success', title, message, duration),
    error: (title: string, message: string, duration?: number) => 
      showNotification('error', title, message, duration),
    warning: (title: string, message: string, duration?: number) => 
      showNotification('warning', title, message, duration),
    info: (title: string, message: string, duration?: number) => 
      showNotification('info', title, message, duration),
  };
};