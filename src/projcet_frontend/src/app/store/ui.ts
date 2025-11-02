import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

// UI State atoms
export const sidebarOpenAtom = atom(false);
export const mobileMenuOpenAtom = atom(false);
export const searchQueryAtom = atom('');
export const selectedFiltersAtom = atom<string[]>([]);
export const selectedPriceRangesAtom = atom<string[]>([]);

// Theme atoms
export const themeAtom = atomWithStorage<'light' | 'dark'>('theme', 'light');
export const isDarkModeAtom = atom((get) => get(themeAtom) === 'dark');

// Loading states
export const globalLoadingAtom = atom(false);
export const pageLoadingAtom = atom(false);

// Modal states
export const activeModalAtom = atom<string | null>(null);
export const modalDataAtom = atom<any>(null);

// AI Advisor state - removed floating chat, now uses dedicated page

// Notification states
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
}

export const notificationsAtom = atom<Notification[]>([]);

// Notification actions
export const notificationActionsAtom = atom(
  null,
  (get, set, action: 
    | { type: 'ADD'; notification: Omit<Notification, 'id' | 'timestamp'> }
    | { type: 'REMOVE'; id: string }
    | { type: 'CLEAR' }
  ) => {
    const notifications = get(notificationsAtom);
    
    switch (action.type) {
      case 'ADD':
        const newNotification: Notification = {
          ...action.notification,
          id: Date.now().toString(),
          timestamp: Date.now(),
        };
        set(notificationsAtom, [...notifications, newNotification]);
        
        // Auto remove after duration
        if (action.notification.duration !== 0) {
          setTimeout(() => {
            set(notificationsAtom, (prev) => 
              prev.filter(n => n.id !== newNotification.id)
            );
          }, action.notification.duration || 5000);
        }
        break;
        
      case 'REMOVE':
        set(notificationsAtom, notifications.filter(n => n.id !== action.id));
        break;
        
      case 'CLEAR':
        set(notificationsAtom, []);
        break;
    }
  }
);

// Breadcrumb atoms
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

export const breadcrumbsAtom = atom<BreadcrumbItem[]>([]);

// Search and filter atoms
export const searchHistoryAtom = atomWithStorage<string[]>('searchHistory', []);
export const recentSearchesAtom = atom((get) => get(searchHistoryAtom).slice(0, 5));

// Pagination atoms
export const currentPageAtom = atom(1);
export const itemsPerPageAtom = atom(12);
export const totalItemsAtom = atom(0);
export const totalPagesAtom = atom((get) => 
  Math.ceil(get(totalItemsAtom) / get(itemsPerPageAtom))
);

// Layout atoms
export const layoutAtom = atomWithStorage<'grid' | 'list'>('layout', 'grid');
export const sidebarCollapsedAtom = atomWithStorage('sidebarCollapsed', false);