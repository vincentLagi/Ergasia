// import React, { useState, useRef } from 'react';
// import { 
//   Card, 
//   Button, 
//   Typography, 
//   Space, 
//   Alert, 
//   Spin,
//   Progress,
//   message,
//   Tabs,
//   Form,
//   Input,
//   Checkbox,
//   Divider
// } from 'antd';
// import { 
//   CameraOutlined, 
//   UserOutlined, 
//   LockOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
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

// const LoginPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { loginWithMock } = useAuth();
//   const videoRef = useRef<HTMLVideoElement>(null);
  
//   // Face Recognition State
//   const [isScanning, setIsScanning] = useState(false);
//   const [scanProgress, setScanProgress] = useState(0);
//   const [scanResult, setScanResult] = useState<'success' | 'failed' | null>(null);
//   const [stream, setStream] = useState<MediaStream | null>(null);
  
//   // Traditional Login State
//   const [isLoading, setIsLoading] = useState(false);
//   const [form] = Form.useForm();

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

//   const startFaceRecognition = () => {
//     setIsScanning(true);
//     setScanProgress(0);
//     setScanResult(null);

//     // Simulate face recognition process
//     const interval = setInterval(() => {
//       setScanProgress(prev => {
//         if (prev >= 100) {
//           clearInterval(interval);
//           setIsScanning(false);
//           // Simulate random success/failure for demo
//           const success = Math.random() > 0.3;
//           setScanResult(success ? 'success' : 'failed');
          
//           if (success) {
//             message.success('Face recognition successful!');
//             setTimeout(() => {
//               loginWithMock();
//               navigate('/');
//             }, 2000);
//           } else {
//             message.error('Face recognition failed. Please try again.');
//           }
//           return 100;
//         }
//         return prev + 10;
//       });
//     }, 200);
//   };

//   const handleRetry = () => {
//     setScanResult(null);
//     setScanProgress(0);
//   };

//   const handleTraditionalLogin = async (values: any) => {
//     setIsLoading(true);
//     try {
//       // Simulate API call
//       await new Promise(resolve => setTimeout(resolve, 1500));
      
//       // For demo purposes, accept any email/password combination
//       message.success('Login successful!');
//       loginWithMock();
//       navigate('/');
//     } catch (error) {
//       message.error('Login failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleSocialLogin = (provider: string) => {
//     message.info(`${provider} login will be implemented soon`);
//   };

//   const FaceRecognitionTab = () => (
//     <div className="text-center">
//       {/* Camera Feed */}
//       <div className="relative mb-6">
//         <div className="w-full max-w-md mx-auto bg-muted rounded-lg overflow-hidden">
//           {stream ? (
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               muted
//               className="w-full h-64 object-cover"
//             />
//           ) : (
//             <div className="w-full h-64 flex items-center justify-center bg-muted">
//               <CameraOutlined className="text-4xl text-muted-foreground" />
//             </div>
//           )}
          
//           {/* Scanning Overlay */}
//           {isScanning && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
//               <div className="text-white text-center">
//                 <Spin size="large" />
//                 <div className="mt-4">
//                   <Text className="text-white">Scanning face...</Text>
//                   <Progress 
//                     percent={scanProgress} 
//                     showInfo={false}
//                     strokeColor="#6366f1"
//                     className="mt-2"
//                   />
//                 </div>
//               </div>
//             </div>
//           )}
          
//           {/* Result Overlay */}
//           {scanResult && (
//             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
//               <div className="text-center">
//                 {scanResult === 'success' ? (
//                   <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
//                 ) : (
//                   <CloseCircleOutlined className="text-6xl text-red-500 mb-4" />
//                 )}
//                 <Text className={`text-xl ${scanResult === 'success' ? 'text-green-500' : 'text-red-500'}`}>
//                   {scanResult === 'success' ? 'Login Successful!' : 'Recognition Failed'}
//                 </Text>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Status Messages */}
//       {!stream && !isScanning && !scanResult && (
//         <Alert
//           message="Camera Access Required"
//           description="Please allow camera access to use face recognition login."
//           type="info"
//           showIcon
//           className="mb-6"
//         />
//       )}

//       {scanResult === 'failed' && (
//         <Alert
//           message="Recognition Failed"
//           description="Face not recognized. Please ensure good lighting and face the camera directly."
//           type="error"
//           showIcon
//           className="mb-6"
//         />
//       )}

//       {scanResult === 'success' && (
//         <Alert
//           message="Login Successful"
//           description="Redirecting to dashboard..."
//           type="success"
//           showIcon
//           className="mb-6"
//         />
//       )}

//       {/* Action Buttons */}
//       <Space size="large">
//         {!stream ? (
//           <Button
//             type="primary"
//             size="large"
//             icon={<CameraOutlined />}
//             onClick={startCamera}
//           >
//             Start Camera
//           </Button>
//         ) : (
//           <>
//             {!isScanning && !scanResult && (
//               <Button
//                 type="primary"
//                 size="large"
//                 icon={<UserOutlined />}
//                 onClick={startFaceRecognition}
//               >
//                 Start Recognition
//               </Button>
//             )}
            
//             {scanResult === 'failed' && (
//               <Button
//                 type="primary"
//                 size="large"
//                 onClick={handleRetry}
//               >
//                 Try Again
//               </Button>
//             )}
            
//             <Button
//               size="large"
//               onClick={stopCamera}
//               disabled={isScanning}
//             >
//               Stop Camera
//             </Button>
//           </>
//         )}
//       </Space>
//     </div>
//   );

//   const TraditionalLoginTab = () => (
//     <div>
//       <Form
//         form={form}
//         layout="vertical"
//         onFinish={handleTraditionalLogin}
//         size="large"
//       >
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
//           rules={[{ required: true, message: 'Please enter your password' }]}
//         >
//           <Input.Password
//             prefix={<LockOutlined />}
//             placeholder="Enter your password"
//             iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
//           />
//         </Form.Item>

//         <Form.Item>
//           <div className="flex justify-between items-center">
//             <Form.Item name="remember" valuePropName="checked" noStyle>
//               <Checkbox>Remember me</Checkbox>
//             </Form.Item>
//             <Link href="#" className="text-primary">
//               Forgot password?
//             </Link>
//           </div>
//         </Form.Item>

//         <Form.Item>
//           <Button
//             type="primary"
//             htmlType="submit"
//             loading={isLoading}
//             block
//             size="large"
//           >
//             Sign In
//           </Button>
//         </Form.Item>
//       </Form>

//       <Divider>Or continue with</Divider>

//       <Space direction="vertical" style={{ width: '100%' }}>
//         <Button
//           block
//           size="large"
//           icon={<GoogleOutlined />}
//           onClick={() => handleSocialLogin('Google')}
//         >
//           Continue with Google
//         </Button>
//         <Button
//           block
//           size="large"
//           icon={<GithubOutlined />}
//           onClick={() => handleSocialLogin('GitHub')}
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
//             <Title level={2}>Welcome Back</Title>
//             <Text type="secondary">
//               Sign in to your account to continue
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
//                     Traditional Login
//                   </span>
//                 }
//                 key="traditional"
//               >
//                 <TraditionalLoginTab />
//               </TabPane>
//             </Tabs>
//           </Card>

//           <div className="text-center mt-6">
//             <Text type="secondary">
//               Don't have an account?{' '}
//               <Link onClick={() => navigate('/register')} className="text-primary">
//                 Sign up here
//               </Link>
//             </Text>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default LoginPage;