import React, { useState } from 'react';
import { Button, message } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import useChat from '../../hooks/useChat';

interface JobChatButtonProps {
  jobId: string;
  jobStatus: string;
  clientId: string;
  freelancerId?: string; // Optional karena mungkin belum ada freelancer
  disabled?: boolean;
}

const JobChatButton: React.FC<JobChatButtonProps> = ({
  jobId,
  jobStatus,
  clientId,
  freelancerId,
  disabled = false
}) => {
  const { user } = useAuth();
  const { canAccessJob, initializeChatForJob } = useChat();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChatClick = async () => {
    console.log('💬 [DEBUG] JobChatButton clicked:', {
      userId: user?.id,
      jobId,
      clientId,
      freelancerId,
      jobStatus
    });

    if (!user?.id || !freelancerId) {
      console.log('❌ [DEBUG] Missing user.id or freelancerId');
      message.error('Chat is not available yet');
      return;
    }

    setLoading(true);
    try {
      // Check if user can access chat for this job
      console.log('🔍 [DEBUG] Checking chat access...');
      const hasAccess = await canAccessJob(jobId);
      console.log('🔍 [DEBUG] Chat access result:', hasAccess);

      if (!hasAccess) {
        console.log('❌ [DEBUG] Chat access denied');
        message.error('Chat is only available for ongoing or completed jobs');
        return;
      }

      // Initialize chat room
      console.log('🏠 [DEBUG] Initializing chat room...');
      const room = await initializeChatForJob(jobId, clientId, freelancerId);
      console.log('🏠 [DEBUG] Chat room initialization result:', room);

      if (room) {
        // Navigate to chat page with room context
        const otherUserId = user.id === clientId ? freelancerId : clientId;
        console.log('✅ [DEBUG] Navigating to chat:', {
          roomId: room.id,
          jobId,
          otherUserId,
          isClient: user.id === clientId
        });

        navigate('/chat', {
          state: {
            roomId: room.id,
            jobId: jobId,
            otherUserId: otherUserId
          }
        });
      } else {
        console.log('❌ [DEBUG] Failed to initialize chat room');
        message.error('Unable to start chat');
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error starting chat:', error);
      message.error('Failed to start chat');
    } finally {
      setLoading(false);
    }
  };

  // Determine button visibility and state
  const canShowButton = () => {
    // Only show if job is Ongoing or Finished
    if (jobStatus !== 'Ongoing' && jobStatus !== 'Finished') return false;
    
    // Only show if user is client or accepted freelancer
    if (user?.id !== clientId && user?.id !== freelancerId) return false;
    
    // Must have freelancer assigned
    if (!freelancerId) return false;
    
    return true;
  };

  if (!canShowButton()) {
    return null;
  }

  return (
    <Button
      type="default"
      icon={<MessageOutlined />}
      onClick={handleChatClick}
      loading={loading}
      disabled={disabled}
      className="flex items-center"
    >
      Chat
    </Button>
  );
};

export default JobChatButton;

