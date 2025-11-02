import React, { useState, useRef } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Spin,
  Progress,
  message
} from 'antd';
import { 
  CameraOutlined, 
  UserOutlined, 
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';

const { Title, Text } = Typography;

const LoginFacePage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<'success' | 'failed' | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user'
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      message.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startFaceRecognition = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);

    // Simulate face recognition process
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          // Simulate random success/failure for demo
          const success = Math.random() > 0.3;
          setScanResult(success ? 'success' : 'failed');
          
          if (success) {
            message.success('Face recognition successful!');
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            message.error('Face recognition failed. Please try again.');
          }
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleRetry = () => {
    setScanResult(null);
    setScanProgress(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="text-center mb-8">
            <Title level={2}>Face Recognition Login</Title>
            <Text type="secondary">
              Use your face to securely log into your account
            </Text>
          </div>

          <Card>
            <div className="text-center">
              {/* Camera Feed */}
              <div className="relative mb-6">
                <div className="w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                  {stream ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 flex items-center justify-center bg-gray-200">
                      <CameraOutlined className="text-4xl text-gray-400" />
                    </div>
                  )}
                  
                  {/* Scanning Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-white text-center">
                        <Spin size="large" />
                        <div className="mt-4">
                          <Text className="text-white">Scanning face...</Text>
                          <Progress 
                            percent={scanProgress} 
                            showInfo={false}
                            strokeColor="#1890ff"
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Result Overlay */}
                  {scanResult && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                      <div className="text-center">
                        {scanResult === 'success' ? (
                          <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
                        ) : (
                          <CloseCircleOutlined className="text-6xl text-red-500 mb-4" />
                        )}
                        <Text className={`text-xl ${scanResult === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                          {scanResult === 'success' ? 'Login Successful!' : 'Recognition Failed'}
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Messages */}
              {!stream && !isScanning && !scanResult && (
                <Alert
                  message="Camera Access Required"
                  description="Please allow camera access to use face recognition login."
                  type="info"
                  showIcon
                  className="mb-6"
                />
              )}

              {scanResult === 'failed' && (
                <Alert
                  message="Recognition Failed"
                  description="Face not recognized. Please ensure good lighting and face the camera directly."
                  type="error"
                  showIcon
                  className="mb-6"
                />
              )}

              {scanResult === 'success' && (
                <Alert
                  message="Login Successful"
                  description="Redirecting to dashboard..."
                  type="success"
                  showIcon
                  className="mb-6"
                />
              )}

              {/* Action Buttons */}
              <Space size="large">
                {!stream ? (
                  <Button
                    type="primary"
                    size="large"
                    icon={<CameraOutlined />}
                    onClick={startCamera}
                  >
                    Start Camera
                  </Button>
                ) : (
                  <>
                    {!isScanning && !scanResult && (
                      <Button
                        type="primary"
                        size="large"
                        icon={<UserOutlined />}
                        onClick={startFaceRecognition}
                      >
                        Start Recognition
                      </Button>
                    )}
                    
                    {scanResult === 'failed' && (
                      <Button
                        type="primary"
                        size="large"
                        onClick={handleRetry}
                      >
                        Try Again
                      </Button>
                    )}
                    
                    <Button
                      size="large"
                      onClick={stopCamera}
                      disabled={isScanning}
                    >
                      Stop Camera
                    </Button>
                  </>
                )}
              </Space>

              {/* Alternative Login */}
              <div className="mt-8 pt-6 border-t">
                <Text type="secondary" className="block mb-4">
                  Having trouble with face recognition?
                </Text>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => navigate('/login')}
                >
                  Use Traditional Login
                </Button>
              </div>
            </div>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <Title level={4}>Instructions</Title>
            <ul className="space-y-2">
              <li>• Ensure you're in a well-lit area</li>
              <li>• Face the camera directly</li>
              <li>• Remove any face coverings</li>
              <li>• Stay still during the scanning process</li>
              <li>• Make sure your entire face is visible</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginFacePage;