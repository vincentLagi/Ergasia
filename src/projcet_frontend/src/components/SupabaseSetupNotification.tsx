import React from 'react';
import { Alert, Button, Space } from 'antd';
import { ExclamationCircleOutlined, SettingOutlined } from '@ant-design/icons';

interface SupabaseSetupNotificationProps {
  onDismiss?: () => void;
}

const SupabaseSetupNotification: React.FC<SupabaseSetupNotificationProps> = ({ onDismiss }) => {
  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/hhhfqlxnelzjepywhtug/storage/buckets', '_blank');
  };

  const openSetupGuide = () => {
    window.open('/supabase-bucket-setup.md', '_blank');
  };

  return (
    <Alert
      message="Supabase Storage Setup Required"
      description={
        <div>
          <p>Profile pictures are currently using fallback mode. For best performance, please setup the Supabase storage bucket:</p>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>1. Create bucket named <code>profilePicture</code></div>
            <div>2. Enable public access</div>
            <div>3. Configure RLS policies</div>
          </Space>
          <Space style={{ marginTop: 12 }}>
            <Button 
              type="primary" 
              icon={<SettingOutlined />}
              onClick={openSupabaseDashboard}
              size="small"
            >
              Open Supabase Dashboard
            </Button>
            <Button 
              onClick={openSetupGuide}
              size="small"
            >
              Setup Guide
            </Button>
            {onDismiss && (
              <Button 
                onClick={onDismiss}
                size="small"
              >
                Dismiss
              </Button>
            )}
          </Space>
        </div>
      }
      type="warning"
      icon={<ExclamationCircleOutlined />}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
};

export default SupabaseSetupNotification;
