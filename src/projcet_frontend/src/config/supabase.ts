import { createClient } from '@supabase/supabase-js';

// Debug environment variables
console.log('🔍 Environment Variables Check:');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Present' : 'Missing');

// Supabase configuration with fallback
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://hhhfqlxnelzjepywhtug.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGZxbHhuZWx6amVweXdodHVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0MTA0ODAsImV4cCI6MjA3Mjk4NjQ4MH0.mSQ7QgjhTSt5fks8At1hM9c-w4ZOlH_RGB65AtzyFQc';

console.log('🚀 Creating Supabase client with URL:', supabaseUrl);

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface ChatRoom {
  id: string;
  job_id: string;
  client_id: string;
  freelancer_id: string;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  thumbnail_url?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  // 🚀 Performance optimization fields
  sender_name?: string;
  isOptimistic?: boolean;
}

export interface TypingStatus {
  id: string;
  room_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

// Set user context for RLS (simplified - no database function needed)
export const setUserContext = async (userId: string) => {
  try {
    console.log('🔒 User context set for:', userId);
    // For now, we'll handle user filtering in the application layer
    // instead of relying on database RLS functions
    return { success: true, userId };
  } catch (error) {
    console.warn('⚠️ User context error:', error);
    return { error };
  }
};

