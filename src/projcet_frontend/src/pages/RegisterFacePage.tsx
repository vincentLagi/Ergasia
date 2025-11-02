import React, { useState, useRef } from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Space, 
  Alert, 
  Spin,
  Progress,
  Steps,
  message
} from 'antd';
import { 
  CameraOutlined, 
  UserOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ScanOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';

const { Title, Text } = Typography;
const { Step } = Steps;

const RegisterFacePage: React.FC = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const steps = [
    {
      title: 'Setup Camera',
      description: 'Allow camera access'
    },
    {
      title: 'Capture Front View',
      description: 'Look directly at camera'
    },
    {
      title: 'Capture Left Profile',
      description: 'Turn head slightly left'
    },
    {
      title: 'Capture Right Profile',
      description: 'Turn head slightly right'
    },
    {
      title: 'Complete',
      description: 'Registration finished'
    }
  ];

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
      setCurrentStep(1);
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

  const captureImage = () => {
    setIsScanning(true);
    setScanProgress(0);

    // Simulate image capture process
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          
          // Simulate successful capture
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext('2d');
          if (ctx && videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = canvas.toDataURL('image/jpeg');
            setCapturedImages(prev => [...prev, imageData]);
          }
          
          message.success('Image captured successfully!');
          
          if (currentStep < 4) {
            setCurrentStep(prev => prev + 1);
          } else {
            setRegistrationComplete(true);
            message.success('Face registration completed successfully!');
          }
          
          return 100;
        }
        return prev + 20;
      });
    }, 100);
  };

  const handleComplete = () => {
    stopCamera();
    message.success('Face registration saved! You can now use face login.');
    navigate('/');
  };

  const getCurrentStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center">
            <CameraOutlined className="text-6xl text-gray-400 mb-4" />
            <Title level={4}>Camera Access Required</Title>
            <Text type="secondary" className="block mb-6">
              We need access to your camera to register your face for secure login.
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<CameraOutlined />}
              onClick={startCamera}
            >
              Allow Camera Access
            </Button>
          </div>
        );
      
      case 1:
      case 2:
      case 3:
        return (
          <div className="text-center">
            <Title level={4}>{steps[currentStep].title}</Title>
            <Text type="secondary" className="block mb-4">
              {steps[currentStep].description}
            </Text>
            
            {!isScanning ? (
              <Button
                type="primary"
                size="large"
                icon={<ScanOutlined />}
                onClick={captureImage}
              >
                Capture Image
              </Button>
            ) : (
              <div>
                <Spin size="large" />
                <div className="mt-4">
                  <Text>Capturing image...</Text>
                  <Progress 
                    percent={scanProgress} 
                    showInfo={false}
                    strokeColor="#1890ff"
                    className="mt-2"
                  />
                </div>
              </div>
            )}
          </div>
        );
      
      case 4:
        return (
          <div className="text-center">
            <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
            <Title level={4}>Registration Complete!</Title>
            <Text type="secondary" className="block mb-6">
              Your face has been successfully registered. You can now use face recognition to log in.
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={handleComplete}
            >
              Finish Setup
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <Title level={2}>Face Recognition Setup</Title>
            <Text type="secondary">
              Register your face for secure and convenient login
            </Text>
          </div>

          {/* Progress Steps */}
          <Card className="mb-6">
            <Steps current={currentStep} size="small">
              {steps.map((step, index) => (
                <Step
                  key={index}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </Steps>
          </Card>

          <Card>
            <div className="text-center">
              {/* Camera Feed */}
              {stream && currentStep > 0 && currentStep < 4 && (
                <div className="relative mb-6">
                  <div className="w-full max-w-md mx-auto bg-gray-100 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover"
                    />
                    
                    {/* Scanning Overlay */}
                    {isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-white text-center">
                          <Spin size="large" />
                          <div className="mt-4">
                            <Text className="text-white">Processing...</Text>
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
                  </div>
                  
                  {/* Face Guide Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-64 border-2 border-blue-500 border-dashed rounded-full opacity-50"></div>
                  </div>
                </div>
              )}

              {/* Step Content */}
              {getCurrentStepContent()}

              {/* Captured Images Preview */}
              {capturedImages.length > 0 && (
                <div className="mt-8">
                  <Title level={5}>Captured Images</Title>
                  <div className="flex justify-center space-x-4 mt-4">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image}
                          alt={`Capture ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-green-500"
                        />
                        <CheckCircleOutlined className="absolute -top-2 -right-2 text-green-500 bg-white rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Instructions */}
          <Card className="mt-6">
            <Title level={4}>Tips for Best Results</Title>
            <ul className="space-y-2">
              <li>• Ensure you're in a well-lit area</li>
              <li>• Remove glasses and face coverings if possible</li>
              <li>• Keep your face centered in the frame</li>
              <li>• Stay still during image capture</li>
              <li>• Follow the prompts for different angles</li>
              <li>• Make sure your entire face is visible</li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterFacePage;