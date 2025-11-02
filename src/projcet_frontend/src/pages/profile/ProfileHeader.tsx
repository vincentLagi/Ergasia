import React from 'react';
import { Row, Col, Avatar, Typography, Button, Space } from 'antd';
import { UserOutlined, EditOutlined, MailOutlined } from '@ant-design/icons';
import { User } from '../../shared/types/User';
import { DescriptionsContext } from 'antd/es/descriptions';

const { Title, Text } = Typography;

interface ProfileHeaderProps {
  user: User;
  profileImage: string | null;
  onEdit: () => void;
  
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, profileImage, onEdit }) => {
  return (
    <Row gutter={[32, 32]} align="middle">
      <Col xs={24} sm={6} className="text-center">
        <div className="space-y-4">
          <Avatar size={120} src={profileImage} icon={<UserOutlined />} />
          <div className="text-center">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={onEdit}
              size="large"
              className="mt-6"
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </Col>
      
      <Col xs={24} sm={18}>
        <div className="py-6">
          <div>
            <Title level={2} className="mb-3 text-3xl font-bold">
              {user.username || 'N/A'}
            </Title>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <Text className="text-gray-600">Available for work</Text>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-500">⭐</span>
                <Text className="text-gray-600 font-medium">
                  {user.rating?.toFixed(1) || '0.0'} Rating
                </Text>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Title level={5} className="mb-2 text-gray-700">About</Title>
            <Text className="text-gray-600 leading-relaxed">
              {user.description || 'No description provided.'}
            </Text>
          </div>
          
          {user.preference && user.preference.length > 0 && (
            <div className="space-y-3">
              <Title level={5} className="mb-2 text-gray-700">Skills</Title>
              <Space wrap>
                {user.preference.map(skill => (
                  <span 
                    key={skill.id} 
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {skill.jobCategoryName}
                  </span>
                ))}
              </Space>
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default ProfileHeader;