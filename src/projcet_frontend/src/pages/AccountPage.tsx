import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  Button,
  Typography,
  Space,
  Switch,
  Divider,
  Avatar,
  Row,
  Col,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SettingOutlined,
  SecurityScanOutlined
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import FaceRecognition from '../components/FaceRecognition';
import Navbar from '../ui/components/Navbar';

import { Token } from '../interface/Token';
import { getBalanceController } from '../controller/tokenController';
import { ProfilePictureService } from '../services/profilePictureService';


const { Title, Text, Paragraph } = Typography;

const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const [userWallet, setUserWallet] = useState<Token>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [faceRecognitionEnabled, setFaceRecognitionEnabled] = useState(false);
  const [loading, setLoading] = useState(true); // Set to true initially for loading state

  useEffect(() => {
    const fetchUserWallet = async () => {
      if (user?.id) {
        try {
          const balance = await getBalanceController(user);
          setUserWallet(balance);
        } catch (error) {
          console.error("Failed to fetch user wallet:", error);
        }
      }
    };

    fetchUserWallet();
  }, [user]);

  useEffect(() => {
    const checkFaceRegistrationStatus = async () => {
      if (user?.id) {
        try {
          setLoading(true);
          const base = (import.meta as any).env?.DEV
            ? '/face-api'
            : (process.env.REACT_APP_FACE_RECOGNITION_URL || 'https://face.130.211.124.157.sslip.io');
          const serviceUrl = `${base}/check-registration/${user.id}`;
          
          // DEBUG: Log SSL and URL details
          console.log('🔍 [ACCOUNT PAGE DEBUG] Environment check:');
          console.log('🔍 [ACCOUNT PAGE DEBUG] - Current location protocol:', window.location.protocol);
          console.log('🔍 [ACCOUNT PAGE DEBUG] - Face registration check URL:', serviceUrl);
          console.log('🔍 [ACCOUNT PAGE DEBUG] - Is HTTPS page with HTTP API?', window.location.protocol === 'https:' && serviceUrl.startsWith('http://'));
          
          console.log("AccountPage: Attempting to connect to face recognition service:", serviceUrl);
          const response = await fetch(serviceUrl);
          console.log("AccountPage: Face recognition service response status:", response.status);
          const result = await response.json();
          console.log("AccountPage: Face recognition service response:", result);
          if (result.status === "registered") {
            setFaceRecognitionEnabled(true);
          } else {
            setFaceRecognitionEnabled(false);
          }
        } catch (error) {
          console.error("Error checking face registration status:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkFaceRegistrationStatus();
  }, [user?.id]);

  const handleSuccess = useCallback(() => {
    setFaceRecognitionEnabled(true);
    setIsModalOpen(false);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error(error);
    setIsModalOpen(false);
  }, []);

  const handleEnableFaceRecognition = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const profilePictureUrl = user?.profilePictureUrl || ProfilePictureService.getDefaultProfilePictureUrl();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title level={2} className="mb-8">Account Settings</Title>
          
          <Row gutter={[24, 24]}>
            {/* Profile Overview */}
            <Col xs={24} lg={8}>
              <Card className="text-center">
                <Avatar
                  size={120}
                  icon={<UserOutlined />}
                  src={profilePictureUrl}
                  className="mb-4"
                />
                <Title level={4}>{user?.username || 'User'}</Title>
                <Divider />
                <Space direction="vertical" className="w-full">
                  <div className="flex justify-between">
                    <Text>Wallet Balance:</Text>
                    <Text strong className="text-green-600">
                      {userWallet?.token_value.toFixed(2) || '0.00'} {userWallet?.token_symbol || 'undefined'}
                    </Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>Rating:</Text>
                    <Text strong className="text-yellow-600">
                      {user?.rating?.toFixed(1) || '0.0'} ⭐
                    </Text>
                  </div>
                </Space>
              </Card>
            </Col>

            {/* Security Settings */}
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <SecurityScanOutlined />
                    Security Settings
                  </Space>
                }
              >
                <div className="space-y-6">
                  {/* Face Recognition Section */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <Title level={5} className="mb-1">Face Recognition</Title>
                        <Paragraph type="secondary" className="mb-0">
                          {faceRecognitionEnabled
                            ? 'Face recognition is enabled for your account. You can use it for quick and secure login.'
                            : 'Enable face recognition for a seamless and secure login experience.'}
                        </Paragraph>
                      </div>
                      <Switch 
                        checked={faceRecognitionEnabled}
                        disabled={faceRecognitionEnabled}
                        onChange={handleEnableFaceRecognition}
                      />
                    </div>
                    
                    {!faceRecognitionEnabled && (
                      <Alert
                        message="Enhanced Security"
                        description="Face recognition adds an extra layer of security to your account while making login faster and more convenient."
                        type="info"
                        showIcon
                        className="mb-8"
                      />
                    )}
                    
                    <Button
                      type={faceRecognitionEnabled ? "default" : "primary"}
                      icon={<CameraOutlined />}
                      onClick={handleEnableFaceRecognition}
                      disabled={faceRecognitionEnabled}
                      loading={loading}
                      className='mt-4'
                    >
                      {faceRecognitionEnabled ? 'Face Recognition Enabled' : 'Enable Face Recognition'}
                    </Button>
                  </div>

                  <Divider />
                </div>
              </Card>
            </Col>
          </Row>


        </motion.div>
      </div>

      {/* Face Recognition Modal */}
      {user && (
        <FaceRecognition
          principalId={user.id}
          onSuccess={handleSuccess}
          onError={handleError}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          purpose="setup"
        />
      )}
    </div>
  );
};

export default AccountPage;