import React, { useState, useCallback } from 'react';
import {
  Form,
  Input,
  Button,
  Upload,
  DatePicker,
  Select,
  Card,
  Typography,
  Space,
  message,
  Row,
  Col,
  Avatar,
  Divider
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  CalendarOutlined,
  TagsOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGlobalLoading } from '../shared/hooks/useGlobalLoading';
import { JobCategory } from '../shared/types/Job';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface CompleteProfileFormData {
  username: string;
  dob: string;
  description: string;
  preference: string[];
  profilePicture?: File;
}

// Mock job categories - in real app, fetch from backend
const mockJobCategories: JobCategory[] = [
  { id: '1', jobCategoryName: 'Web Development' },
  { id: '2', jobCategoryName: 'Mobile Development' },
  { id: '3', jobCategoryName: 'UI/UX Design' },
  { id: '4', jobCategoryName: 'Data Science' },
  { id: '5', jobCategoryName: 'DevOps' },
  { id: '6', jobCategoryName: 'Machine Learning' },
  { id: '7', jobCategoryName: 'Blockchain' },
  { id: '8', jobCategoryName: 'Cybersecurity' },
  { id: '9', jobCategoryName: 'Content Writing' },
  { id: '10', jobCategoryName: 'Digital Marketing' },
];

const CompleteProfilePage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { showLoading, hideLoading } = useGlobalLoading();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { updateProfile, user } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload: UploadProps['customRequest'] = useCallback((options: any) => {
    const { file, onSuccess } = options;

    if (file instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
        setUploadedFile(file);
        onSuccess?.('ok');
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('You can only upload JPG/PNG files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    return true;
  };

  const handleSubmit = async (values: any) => {
    try {
      showLoading('Updating profile...');
      setLoading(true);
      console.log('Form values received:', values);

      // Convert form data to update payload
      const updatePayload: any = {
        username: values.username,
        dob: values.dob ? values.dob.format('YYYY-MM-DD') : '', // Convert dayjs to string
        description: values.description,
        preference: values.preference.map((id: string) => {
          const category = mockJobCategories.find(cat => cat.id === id);
          console.log('Selected category for ID', id, ':', category);
          return category;
        }).filter(Boolean),
        isProfileCompleted: true,
      };

      // Add profile picture if uploaded
      if (uploadedFile) {
        updatePayload.profilePicture = uploadedFile; // Pass File directly for Supabase upload
      }

      console.log('Update payload prepared:', updatePayload);

      const success = await updateProfile(updatePayload);

      if (success) {
        message.success('Profile completed successfully!');
        // Navigate to home page instead of profile page for better UX
        navigate('/');
      } else {
        message.error('Failed to complete profile. Please try again.');
      }
    } catch (error) {
      console.error('Profile completion error:', error);
      message.error('An error occurred while completing your profile.');
    } finally {
      hideLoading();
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:25px_25px]" />
      
      {/* Subtle Gradient Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl" />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-4 py-12 relative z-10"
      >

        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border border-border rounded-xl overflow-hidden bg-card">
            <div className="p-8">
              <motion.div variants={itemVariants} className="text-center mb-16">
                <Title level={1} className="text-4xl font-bold text-foreground mb-6">
                  Complete Your Profile
                </Title>
                <Paragraph className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Welcome to <span className="font-semibold text-primary">ERGASIA</span>! Let's set up your profile to help you connect with the best opportunities.
                </Paragraph>
              </motion.div>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                  username: user?.username || '',
                  dob: user?.dob ? dayjs(user.dob) : undefined,
                  description: user?.description || '',
                  preference: user?.preference?.map(p => p.id) || [],
                }}
                className="space-y-6"
              >
                <Row gutter={[24, 24]}>
                  {/* Profile Picture Section */}
                  <Col xs={24} md={8}>
                    <motion.div variants={itemVariants} className="text-center">
                      <Title level={4} className="flex items-center justify-center mb-6 text-card-foreground">
                        <CameraOutlined className="mr-2 text-primary" />
                        Profile Picture
                      </Title>

                      <div className="flex flex-col items-center space-y-6">
                        <div className="relative">
                          <Avatar
                            size={120}
                            src={profileImage}
                            icon={<UserOutlined />}
                            className="border-2 border-border shadow-lg"
                          />
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                            <CameraOutlined className="text-primary-foreground text-xs" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Upload
                            customRequest={handleImageUpload}
                            beforeUpload={beforeUpload}
                            showUploadList={false}
                            accept="image/*"
                          >
                            <Button 
                              icon={<CameraOutlined />} 
                              type="primary" 
                              className="rounded-lg"
                            >
                              Choose Photo
                            </Button>
                          </Upload>

                          <div className="text-center">
                            <Text type="secondary" className="text-sm text-muted-foreground">
                              JPG or PNG, max 2MB
                            </Text>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </Col>

                  {/* Form Fields */}
                  <Col xs={24} md={16}>
                    <Space direction="vertical" size="large" className="w-full">
                      <motion.div variants={itemVariants}>
                        <Form.Item
                          name="username"
                          label={
                            <span className="flex items-center text-card-foreground font-medium">
                              <UserOutlined className="mr-2 text-primary" />
                              Username
                            </span>
                          }
                          rules={[
                            { required: true, message: 'Please enter your username' },
                            { min: 3, message: 'Username must be at least 3 characters' },
                            { max: 50, message: 'Username must be less than 50 characters' }
                          ]}
                        >
                          <Input
                            placeholder="Enter your username"
                            size="large"
                            className="rounded-lg"
                          />
                        </Form.Item>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Form.Item
                          name="dob"
                          label={
                            <span className="flex items-center text-card-foreground font-medium">
                              <CalendarOutlined className="mr-2 text-primary" />
                              Date of Birth
                            </span>
                          }
                          rules={[{ required: true, message: 'Please select your date of birth' }]}
                        >
                          <DatePicker
                            placeholder="Select your date of birth"
                            size="large"
                            className="w-full rounded-lg"
                            suffixIcon={<CalendarOutlined className="text-muted-foreground" />}
                            disabledDate={(current) => current && current > dayjs().subtract(13, 'years')}
                          />
                        </Form.Item>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Form.Item
                          name="preference"
                          label={
                            <span className="flex items-center text-card-foreground font-medium">
                              <TagsOutlined className="mr-2 text-primary" />
                              Skills & Preferences
                            </span>
                          }
                          rules={[
                            { required: true, message: 'Please select at least one skill' },
                            { type: 'array', min: 1, message: 'Please select at least one skill' }
                          ]}
                        >
                          <Select
                            mode="multiple"
                            placeholder="Select your skills and preferences"
                            size="large"
                            className="rounded-lg"
                            maxTagCount={3}
                            maxTagTextLength={15}
                            suffixIcon={<TagsOutlined className="text-muted-foreground" />}
                          >
                            {mockJobCategories.map(category => (
                              <Option key={category.id} value={category.id}>
                                {category.jobCategoryName}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </motion.div>

                      <motion.div variants={itemVariants}>
                        <Form.Item
                          name="description"
                          label={
                            <span className="flex items-center text-card-foreground font-medium">
                              <FileTextOutlined className="mr-2 text-primary" />
                              About You
                            </span>
                          }
                          rules={[
                            { required: true, message: 'Please write a brief description about yourself' },
                            { min: 50, message: 'Description must be at least 50 characters' },
                            { max: 500, message: 'Description must be less than 500 characters' }
                          ]}
                        >
                          <TextArea
                            placeholder="Tell us about yourself, your experience, and what you're looking for..."
                            rows={4}
                            className="rounded-lg"
                            showCount
                            maxLength={500}
                          />
                        </Form.Item>
                      </motion.div>
                    </Space>
                  </Col>
                </Row>

                <Divider />

                <motion.div variants={itemVariants} className="text-center">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    className="px-12 py-2 h-auto rounded-lg"
                  >
                    <span className="flex items-center">
                      <CheckCircleOutlined className="mr-2" />
                      Complete Profile
                    </span>
                  </Button>

                  <div className="mt-4">
                    <Text type="secondary" className="text-muted-foreground">
                      By completing your profile, you agree to our <u>Terms of Service</u> and <u>Privacy Policy</u>
                    </Text>
                  </div>
                </motion.div>
              </Form>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CompleteProfilePage;