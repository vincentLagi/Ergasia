import { atom } from 'jotai';
import { ChatRoom, Message } from '../../config/supabase';

// Chat UI state atoms
export const selectedContactAtom = atom<string | null>(null);
export const chatMessagesAtom = atom<Message[]>([]);
export const isTypingAtom = atom<boolean>(false);

// Chat rooms state
export const chatRoomsAtom = atom<ChatRoom[]>([]);
export const currentChatRoomAtom = atom<ChatRoom | null>(null);

// Chat UI state management
export const isChatLoadingAtom = atom<boolean>(false);
export const chatErrorAtom = atom<string | null>(null);

// Derived atoms for computed state
export const selectedChatRoomAtom = atom(
  (get) => {
    const selectedContact = get(selectedContactAtom);
    const rooms = get(chatRoomsAtom);
    return rooms.find(room => room.id === selectedContact) || null;
  }
);

// Unread messages count
export const unreadMessagesCountAtom = atom<Record<string, number>>({});

// Chat settings
export const chatSettingsAtom = atom({
  soundEnabled: true,
  notificationsEnabled: true,
  compactMode: false,
});

// Actions atoms (for state management patterns)
export const chatActionsAtom = atom(
  null,
  (get, set, action: any) => {
    switch (action.type) {
      case 'SELECT_CONTACT':
        set(selectedContactAtom, action.contactId);
        break;
        
      case 'SET_MESSAGES':
        set(chatMessagesAtom, action.messages);
        break;
        
      case 'ADD_MESSAGE':
        const currentMessages = get(chatMessagesAtom);
        set(chatMessagesAtom, [...currentMessages, action.message]);
        break;
        
      case 'SET_TYPING':
        set(isTypingAtom, action.isTyping);
        break;
        
      case 'SET_LOADING':
        set(isChatLoadingAtom, action.loading);
        break;
        
      case 'SET_ERROR':
        set(chatErrorAtom, action.error);
        break;
        
      case 'SET_ROOMS':
        set(chatRoomsAtom, action.rooms);
        break;
        
      case 'SET_CURRENT_ROOM':
        set(currentChatRoomAtom, action.room);
        break;
        
      case 'UPDATE_UNREAD_COUNT':
        const currentUnread = get(unreadMessagesCountAtom);
        set(unreadMessagesCountAtom, {
          ...currentUnread,
          [action.roomId]: action.count
        });
        break;
        
      case 'CLEAR_UNREAD':
        const unreadCounts = get(unreadMessagesCountAtom);
        const { [action.roomId]: removed, ...remaining } = unreadCounts;
        set(unreadMessagesCountAtom, remaining);
        break;
        
      default:
        break;
    }
  }
);

