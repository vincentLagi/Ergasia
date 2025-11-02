// import React, { useState, useRef } from 'react';
// import { 
//   Card, 
//   Button, 
//   Typography, 
//   Space, 
//   Alert, 
//   Spin,
//   Progress,
//   Steps,
//   message,
//   Tabs,
//   Form,
//   Input,
//   Checkbox,
//   Divider,
//   Select
// } from 'antd';
// import { 
//   CameraOutlined, 
//   UserOutlined, 
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   ScanOutlined,
//   LockOutlined,
//   EyeInvisibleOutlined,
//   EyeTwoTone,
//   GoogleOutlined,
//   GithubOutlined,
//   MailOutlined
// } from '@ant-design/icons';
// import { motion } from 'framer-motion';
// import { useNavigate } from 'react-router-dom';
// import Navbar from '../ui/components/Navbar';
// import { useAuth } from '../shared/hooks/useAuth';

// const { Title, Text, Link } = Typography;
// const { TabPane } = Tabs;
// const { Step } = Steps;
// const { Option } = Select;

// const RegisterPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { loginWithMock } = useAuth();
//   const videoRef = useRef<HTMLVideoElement>(null);
  
//   // Face Recognition State
//   const [currentStep, setCurrentStep] = useState(0);
//   const [isScanning, setIsScanning] = useState(false);
//   const [scanProgress, setScanProgress] = useState(0);
//   const [capturedImages, setCapturedImages] = useState<string[]>([]);
//   const [stream, setStream] = useState<MediaStream | null>(null);
//   const [registrationComplete, setRegistrationComplete] = useState(false);
  
//   // Traditional Register State
//   const [isLoading, setIsLoading] = useState(false);
//   const [form] = Form.useForm();

//   const steps = [
//     {
//       title: 'Setup Camera',
//       description: 'Allow camera access'
//     },
//     {
//       title: 'Capture Front View',
//       description: 'Look directly at camera'
//     },
//     {
//       title: 'Capture Left Profile',
//       description: 'Turn head slightly left'
//     },
//     {
//       title: 'Capture Right Profile',
//       description: 'Turn head slightly right'
//     },
//     {
//       title: 'Complete',
//       description: 'Registration finished'
//     }
//   ];

//   const startCamera = async () => {
//     try {
//       const mediaStream = await navigator.mediaDevices.getUserMedia({ 
//         video: { 
//           width: 640, 
//           height: 480,
//           facingMode: 'user'
//         } 
//       });
//       setStream(mediaStream);
//       if (videoRef.current) {
//         videoRef.current.srcObject = mediaStream;
//       }
//       setCurrentStep(1);
//     } catch (error) {
//       message.error('Unable to access camera. Please check permissions.');
//     }
//   };

//   const stopCamera = () => {
//     if (stream) {
//       stream.getTracks().forEach(track => track.stop());
//       setStream(null);
//     }
//   };

//   const captureImage = () => {
//     setIsScanning(true);
//     setScanProgress(0);

//     // Simulate image capture process
//     const interval = setInterval(() => {
//       setScanProgress(prev => {
//         if (prev >= 100) {
//           clearInterval(interval);
//           setIsScanning(false);
          
//           // Simulate successful capture
//           const canvas = document.createElement('canvas');
//           canvas.width = 640;
//           canvas.height = 480;
//           const ctx = canvas.getContext('2d');
//           if (ctx && videoRef.current) {
//             ctx.drawImage(videoRef.current, 0, 0);
//             const imageData = canvas.toDataURL('image/jpeg');
//             setCapturedImages(prev => [...prev, imageData]);
//           }
          
//           message.success('Image captured successfully!');
          
//           if (currentStep < 4) {
//             setCurrentStep(prev => prev + 1);
//           } else {
//             setRegistrationComplete(true);
//             message.success('Face registration completed successfully!');
//           }
          
//           return 100;
//         }
//         return prev + 20;
//       });
//     }, 100);
//   };

//   const handleComplete = () => {
//     stopCamera();
//     message.success('Registration completed! You can now use face login.');
//     loginWithMock();
//     navigate('/');
//   };

//   const handleTraditionalRegister = async (values: any) => {
//     setIsLoading(true);
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       message.success('Registration successful!');
//       loginWithMock();
//       navigate('/');
//     } catch (error) {
//       message.error('Registration failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSocialRegister = (provider: string) => {
//     message.info(`${provider} registration will be implemented soon`);
//   };

//   const getCurrentStepContent = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <div className="text-center">
//             <CameraOutlined className="text-6xl text-muted-foreground mb-4" />
//             <Title level={4}>Camera Access Required</Title>
//             <Text type="secondary" className="block mb-6">
//               We need access to your camera to register your face for secure login.
//             </Text>
//             <Button
//               type="primary"
//               size="large"
//               icon={<CameraOutlined />}
//               onClick={startCamera}
//             >
//               Allow Camera Access
//             </Button>
//           </div>
//         );
      
//       case 1:
//       case 2:
//       case 3:
//         return (
//           <div className="text-center">
//             <Title level={4}>{steps[currentStep].title}</Title>
//             <Text type="secondary" className="block mb-4">
//               {steps[currentStep].description}
//             </Text>
            
//             {!isScanning ? (
//               <Button
//                 type="primary"
//                 size="large"
//                 icon={<ScanOutlined />}
//                 onClick={captureImage}
//               >
//                 Capture Image
//               </Button>
//             ) : (
//               <div>
//                 <Spin size="large" />
//                 <div className="mt-4">
//                   <Text>Capturing image...</Text>
//                   <Progress 
//                     percent={scanProgress} 
//                     showInfo={false}
//                     strokeColor="#6366f1"
//                     className="mt-2"
//                   />
//                 </div>
//               </div>
//             )}
//           </div>
//         );
      
//       case 4:
//         return (
//           <div className="text-center">
//             <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
//             <Title level={4}>Registration Complete!</Title>
//             <Text type="secondary" className="block mb-6">
//               Your face has been successfully registered. You can now use face recognition to log in.
//             </Text>
//             <Button
//               type="primary"
//               size="large"
//               onClick={handleComplete}
//             >
//               Finish Setup
//             </Button>
//           </div>
//         );
      
//       default:
//         return null;
//     }
//   };

//   const FaceRecognitionTab = () => (
//     <div>
//       {/* Progress Steps */}
//       <div className="mb-6">
//         <Steps current={currentStep} size="small">
//           {steps.map((step, index) => (
//             <Step
//               key={index}
//               title={step.title}
//               description={step.description}
//             />
//           ))}
//         </Steps>
//       </div>

//       <div className="text-center">
//         {/* Camera Feed */}
//         {stream && currentStep > 0 && currentStep < 4 && (
//           <div className="relative mb-6">
//             <div className="w-full max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
//               <video
//                 ref={videoRef}
//                 autoPlay
//                 playsInline
//                 muted
//                 className="w-full h-64 object-cover"
//               />
              
//               {/* Scanning Overlay */}
//               {isScanning && (
//                 <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
//                   <div className="text-white text-center">
//                     <Spin size="large" />
//                     <div className="mt-4">
//                       <Text className="text-white">Processing...</Text>
//                       <Progress 
//                         percent={scanProgress} 
//                         showInfo={false}
//                         strokeColor="#6366f1"
//                         className="mt-2"
//                       />
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
            
//             {/* Face Guide Overlay */}
//             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//               <div className="w-48 h-64 border-2 border-primary border-dashed rounded-full opacity-50"></div>
//             </div>
//           </div>
//         )}

//         {/* Step Content */}
//         {getCurrentStepContent()}

//         {/* Captured Images Preview */}
//         {capturedImages.length > 0 && (
//           <div className="mt-8">
//             <Title level={5}>Captured Images</Title>
//             <div className="flex justify-center space-x-4 mt-4">
//               {capturedImages.map((image, index) => (
//                 <div key={index} className="relative">
//                   <img
//                     src={image}
//                     alt={`Capture ${index + 1}`}
//                     className="w-20 h-20 object-cover rounded-lg border-2 border-green-500"
//                   />
//                   <CheckCircleOutlined className="absolute -top-2 -right-2 text-green-500 bg-white rounded-full" />
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   const TraditionalRegisterTab = () => (
//     <div>
//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={handleTraditionalRegister}
//         size="large"
//       >
//         <Form.Item
//           name="username"
//           label="Full Name"
//           rules={[{ required: true, message: 'Please enter your full name' }]}
//         >
//           <Input
//             prefix={<UserOutlined />}
//             placeholder="Enter your full name"
//           />
//         </Form.Item>

//         <Form.Item
//           name="email"
//           label="Email"
//           rules={[
//             { required: true, message: 'Please enter your email' },
//             { type: 'email', message: 'Please enter a valid email' }
//           ]}
//         >
//           <Input
//             prefix={<MailOutlined />}
//             placeholder="Enter your email"
//           />
//         </Form.Item>

//         <Form.Item
//           name="password"
//           label="Password"
//           rules={[
//             { required: true, message: 'Please enter your password' },
//             { min: 8, message: 'Password must be at least 8 characters' }
//           ]}
//         >
//           <Input.Password
//             prefix={<LockOutlined />}
//             placeholder="Create a password"
//             iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
//           />
//         </Form.Item>

//         <Form.Item
//           name="confirmPassword"
//           label="Confirm Password"
//           dependencies={['password']}
//           rules={[
//             { required: true, message: 'Please confirm your password' },
//             ({ getFieldValue }) => ({
//               validator(_, value) {
//                 if (!value || getFieldValue('password') === value) {
//                   return Promise.resolve();
//                 }
//                 return Promise.reject(new Error('Passwords do not match'));
//               },
//             }),
//           ]}
//         >
//           <Input.Password
//             prefix={<LockOutlined />}
//             placeholder="Confirm your password"
//             iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
//           />
//         </Form.Item>

//         <Form.Item
//           name="userType"
//           label="I want to"
//           rules={[{ required: true, message: 'Please select your role' }]}
//         >
//           <Select placeholder="Select your primary role">
//             <Option value="freelancer">Find work as a freelancer</Option>
//             <Option value="client">Hire freelancers for my projects</Option>
//             <Option value="both">Both hire and work as a freelancer</Option>
//           </Select>
//         </Form.Item>

//         <Form.Item>
//           <Form.Item name="terms" valuePropName="checked" noStyle>
//             <Checkbox>
//               I agree to the <Link href="#" className="text-primary">Terms of Service</Link> and{' '}
//               <Link href="#" className="text-primary">Privacy Policy</Link>
//             </Checkbox>
//           </Form.Item>
//         </Form.Item>

//         <Form.Item>
//           <Button
//             type="primary"
//             htmlType="submit"
//             loading={isLoading}
//             block
//             size="large"
//           >
//             Create Account
//           </Button>
//         </Form.Item>
//       </Form>

//       <Divider>Or continue with</Divider>

//       <Space direction="vertical" style={{ width: '100%' }}>
//         <Button
//           block
//           size="large"
//           icon={<GoogleOutlined />}
//           onClick={() => handleSocialRegister('Google')}
//         >
//           Continue with Google
//         </Button>
//         <Button
//           block
//           size="large"
//           icon={<GithubOutlined />}
//           onClick={() => handleSocialRegister('GitHub')}
//         >
//           Continue with GitHub
//         </Button>
//       </Space>
//     </div>
//   );

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
      
//       <div className="container mx-auto px-4 py-8">
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="max-w-md mx-auto"
//         >
//           <div className="text-center mb-8">
//             <Title level={2}>Join Ergasia</Title>
//             <Text type="secondary">
//               Create your account to get started
//             </Text>
//           </div>

//           <Card>
//             <Tabs defaultActiveKey="face" centered>
//               <TabPane
//                 tab={
//                   <span>
//                     <CameraOutlined />
//                     Face Recognition
//                   </span>
//                 }
//                 key="face"
//               >
//                 <FaceRecognitionTab />
//               </TabPane>
//               <TabPane
//                 tab={
//                   <span>
//                     <LockOutlined />
//                     Traditional Sign Up
//                   </span>
//                 }
//                 key="traditional"
//               >
//                 <TraditionalRegisterTab />
//               </TabPane>
//             </Tabs>
//           </Card>

//           <div className="text-center mt-6">
//             <Text type="secondary">
//               Already have an account?{' '}
//               <Link onClick={() => navigate('/login')} className="text-primary">
//                 Sign in here
//               </Link>
//             </Text>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default RegisterPage;