import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { notificationsAtom, notificationActionsAtom, Notification } from '../../app/store/ui';

export interface UseNotificationsReturn {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Convenience methods
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications] = useAtom(notificationsAtom);
  const [, notificationActions] = useAtom(notificationActionsAtom);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    notificationActions({ type: 'ADD', notification });
  }, [notificationActions]);

  const removeNotification = useCallback((id: string) => {
    notificationActions({ type: 'REMOVE', id });
  }, [notificationActions]);

  const clearNotifications = useCallback(() => {
    notificationActions({ type: 'CLEAR' });
  }, [notificationActions]);

  // Convenience methods
  const success = useCallback((title: string, message: string, duration = 5000) => {
    addNotification({ type: 'success', title, message, duration });
  }, [addNotification]);

  const error = useCallback((title: string, message: string, duration = 0) => {
    addNotification({ type: 'error', title, message, duration });
  }, [addNotification]);

  const warning = useCallback((title: string, message: string, duration = 7000) => {
    addNotification({ type: 'warning', title, message, duration });
  }, [addNotification]);

  const info = useCallback((title: string, message: string, duration = 5000) => {
    addNotification({ type: 'info', title, message, duration });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    success,
    error,
    warning,
    info,
  };
};

// Hook for toast-style notifications (auto-dismiss)
export const useToast = () => {
  const { success, error, warning, info } = useNotifications();

  return {
    toast: {
      success: (message: string, duration = 3000) => success('Success', message, duration),
      error: (message: string, duration = 5000) => error('Error', message, duration),
      warning: (message: string, duration = 4000) => warning('Warning', message, duration),
      info: (message: string, duration = 3000) => info('Info', message, duration),
    }
  };
};