import React, { useState, useCallback, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Steps,
  Select,
  InputNumber,
  DatePicker,
  Upload,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  message,
  App,
  Modal,
  Spin
} from 'antd';
import {
  PlusOutlined,
  InboxOutlined,
  EyeOutlined,
  SaveOutlined,
  SendOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';
import { useJobs } from '../shared/hooks/useJobs';
import { createJob } from '../controller/jobController';
import { useAuth } from '../hooks/useAuth';
import { useGlobalLoading } from '../shared/hooks/useGlobalLoading';
import { storage } from '../utils/storage';
import { ensureUserData } from '../utils/sessionUtils';
import { JobPayload } from '../shared/types/Job';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Dragger } = Upload;

interface JobFormData {
  title: string;
  description: string;
  category: string[];
  budget: number;
  startdate: Date;
  deadline: Date;
  skills: string[];
  experienceLevel: 'entry' | 'intermediate' | 'expert';
  projectType: 'one-time' | 'ongoing';
  maxApplicants: number;
  attachments?: File[];
}

const PostJobPage: React.FC = () => {
  const navigate = useNavigate();
  const { isLoading } = useJobs();
  const { isAuthenticated, loginWithInternetIdentity } = useAuth();
  const [form] = Form.useForm<JobFormData>();
  const [messageApi, contextHolder] = message.useMessage();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<JobFormData>>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const { showLoading, hideLoading } = useGlobalLoading();

  useEffect(() => {
    const checkUserData = async () => {
      try {
        const userData = localStorage.getItem('current_user');
        console.log('current_user in localStorage:', userData);

        if (userData) {
          const parsedUser = JSON.parse(userData);
          console.log('Parsed user data:', parsedUser);
        } else {
          console.log('No user data in localStorage, attempting to load from session...');
          const hasUserData = await ensureUserData();
          console.log('User data loaded from session:', hasUserData);
        }

        const storageUser = storage.getUser();
        console.log('User from storage utility:', storageUser);
      } catch (error) {
        console.error('Error checking user data:', error);
      }
    };

    checkUserData();
  }, [isAuthenticated]);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated) {
        Modal.confirm({
          title: 'Authentication Required',
          content: 'You need to be logged in to post a job. Would you like to login now?',
          okText: 'Login',
          cancelText: 'Cancel',
          onOk: () => {
            loginWithInternetIdentity();
          },
          onCancel: () => {
            navigate('/');
          }
        });
      } else {
        // If authenticated, ensure user data is available
        await ensureUserData();
      }
    };

    checkAuth();
  }, [isAuthenticated, loginWithInternetIdentity, navigate]);

  const steps = [
    {
      title: 'Info',
      description: 'Job title and category'
    },
    {
      title: 'Details',
      description: 'Description and requirements'
    },
    {
      title: 'Budget & Timeline',
      description: 'Budget and deadline'
    },
    {
      title: 'Review',
      description: 'Review and publish'
    }
  ];

  const categories = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Data Science',
    'Digital Marketing',
    'Content Writing',
    'Graphic Design',
    'Video Editing',
    'Translation',
    'Virtual Assistant'
  ];

  const handleNext = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setFormData(prev => ({ ...prev, ...values }));
      setCurrentStep(prev => prev + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  }, [form]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => prev - 1);
  }, []);

  const handleAddSkill = useCallback(() => {
    if (skillInput && !skills.includes(skillInput)) {
      const newSkills = [...skills, skillInput];
      setSkills(newSkills);
      form.setFieldValue('skills', newSkills);
      setSkillInput('');
    }
  }, [skillInput, skills, form]);

  const handleRemoveSkill = useCallback((skillToRemove: string) => {
    const newSkills = skills.filter(skill => skill !== skillToRemove);
    setSkills(newSkills);
    form.setFieldValue('skills', newSkills);
  }, [skills, form]);

  const handleSubmit = useCallback(async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      Modal.confirm({
        title: 'Authentication Required',
        content: 'You need to be logged in to post a job. Would you like to login now?',
        okText: 'Login',
        cancelText: 'Cancel',
        onOk: () => {
          loginWithInternetIdentity();
        },
        onCancel: () => {
          // Stay on the same page
        }
      });
      return;
    }

    try {
      showLoading('Creating job...');
      const values = await form.validateFields();
      const allFormData = { ...formData, ...values, skills };

      const startDate = new Date(allFormData.startdate)
      const deadline = new Date(allFormData.deadline)

      const payload: JobPayload = {
        jobName: allFormData.title,
        jobDescription: [allFormData.description],
        jobTags: allFormData.category,
        jobSalary: allFormData.budget,
        jobSlots: allFormData.maxApplicants,
        jobSkills: skills,
        jobExprienceLevel: allFormData.experienceLevel,
        jobProjectType: allFormData.projectType,
        jobStartDate: BigInt(startDate.getTime()) * 1_000_000n,
        jobDeadline: BigInt(deadline.getTime()) * 1_000_000n
      }
      const result = await createJob(payload);

      console.log(result);
      if (result[0] === 'Success') {
        message.success(`Job published successfully!`);
        navigate('/manage');
      } else {
        message.error(result[1] || 'Failed to create job. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      messageApi.error('Please fill out all required fields before submitting.');
    } finally {
      hideLoading();
    }
  }, [form, formData, skills, navigate, messageApi, isAuthenticated, loginWithInternetIdentity, showLoading, hideLoading]);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >

            <Form.Item
              name="title"
              label="Job Title"
              rules={[{ required: true, message: 'Please enter job title' }]}
            >
              <Input
                size="large"
                placeholder="e.g., Full Stack Developer for E-commerce Platform"
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Categories"
              rules={[
                { required: true, message: 'Please select at least one category' },
                { type: 'array', min: 1, message: 'Please select at least one category' }
              ]}
            >
              <Select
                mode="multiple" // Enable multiple selection
                size="large"
                placeholder="Select job categories"
                maxTagCount="responsive"
                showSearch
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {categories.map(category => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="projectType"
              label="Project Type"
              rules={[{ required: true, message: 'Please select project type' }]}
            >
              <Select size="large" placeholder="Select project type">
                <Option value="one-time">One-time Project</Option>
                <Option value="ongoing">Ongoing Work</Option>
              </Select>
            </Form.Item>
          </motion.div>
        );

      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Form.Item
              name="description"
              label="Job Description"
              rules={[{ required: true, message: 'Please enter job description' }]}
            >
              <TextArea
                rows={6}
                placeholder="Describe your project in detail..."
                maxLength={2000}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="experienceLevel"
              label="Experience Level"
              rules={[{ required: true, message: 'Please select experience level' }]}
            >
              <Select size="large" placeholder="Select required experience level">
                <Option value="entry">Entry Level</Option>
                <Option value="intermediate">Intermediate</Option>
                <Option value="expert">Expert</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Required Skills">
              <Space.Compact style={{ width: '100%' }}>
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add a skill"
                  onPressEnter={handleAddSkill}
                />
                <Button type="primary" onClick={handleAddSkill} icon={<PlusOutlined />}>
                  Add
                </Button>
              </Space.Compact>
              <div className="mt-2">
                {skills.map(skill => (
                  <Tag
                    key={skill}
                    closable
                    onClose={() => handleRemoveSkill(skill)}
                    className="mb-1"
                  >
                    {skill}
                  </Tag>
                ))}
              </div>
            </Form.Item>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Form.Item
              name="budget"
              label="Budget Amount ($)"
              rules={[{ required: true, message: 'Please enter budget amount' }]}
            >
              <InputNumber
                size="large"
                min={1}
                max={100000}
                style={{ width: '100%' }}
                placeholder="Enter budget amount"
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => Number(value!.replace(/\$\s?|(,*)/g, '')) as any}
              />
            </Form.Item>

            <Form.Item
              name="maxApplicants"
              label="Maximum Number of Applicants"
              rules={[{ required: true, message: 'Please enter maximum applicants' }]}
            >
              <InputNumber
                size="large"
                min={1}
                max={50}
                style={{ width: '100%' }}
                placeholder="Enter maximum number of applicants"
              />
            </Form.Item>

            <Form.Item
              name="startdate"
              label="Project Start Date"
              rules={[{ required: true, message: 'Please select project start date' }]}
            >
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                placeholder="Select start date"
                disabledDate={(current) => current && current.valueOf() < Date.now()}
                onChange={() => {
                  form.validateFields(['deadline']);
                }}
              />
            </Form.Item>

            <Form.Item
              name="deadline"
              label="Project Deadline"
              rules={[
                { required: true, message: 'Please select deadline' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) {
                      return Promise.resolve();
                    }

                    const startDate = getFieldValue('startdate');
                    if (!startDate) {
                      return Promise.reject(new Error('Please select start date first'));
                    }

                    const start = new Date(startDate);
                    const deadline = new Date(value);

                    // Check if deadline is the same as start date
                    if (start.toDateString() === deadline.toDateString()) {
                      return Promise.reject(new Error('Deadline cannot be the same as start date'));
                    }

                    // Check minimum 3 days gap
                    const diffTime = deadline.getTime() - start.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays < 3) {
                      return Promise.reject(new Error('Deadline must be at least 3 days after start date'));
                    }

                    return Promise.resolve();
                  },
                }),
              ]}
              dependencies={['startdate']} // Re-validate when start date changes
            >
              <DatePicker
                size="large"
                style={{ width: '100%' }}
                placeholder="Select deadline"
                disabledDate={(current) => {
                  const startDate = form.getFieldValue('startdate');
                  if (startDate) {
                    const start = new Date(startDate);
                    const minDeadline = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after start
                    return current && current.valueOf() < minDeadline.valueOf();
                  }
                  return current && current.valueOf() < Date.now();
                }}
              />
            </Form.Item>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-4">
              <Title level={4}>Job Preview</Title>
              <Divider />

              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Title level={5}>{formData.title}</Title>
                  <Text type="secondary">
                    {Array.isArray(formData.category)
                      ? formData.category.join(', ')
                      : formData.category
                    } • {formData.projectType}
                  </Text>
                </Col>

                <Col span={24}>
                  <Text strong>Description:</Text>
                  <div className="mt-2">
                    <Text>{formData.description}</Text>
                  </div>
                </Col>

                <Col span={12}>
                  <Text strong>Budget:</Text>
                  <div>
                    <Text>${formData.budget} ({"Fixed"})</Text>
                  </div>
                </Col>

                <Col span={12}>
                  <Text strong>Experience Level:</Text>
                  <div>
                    <Text className="capitalize">{formData.experienceLevel}</Text>
                  </div>
                </Col>

                <Col span={24}>
                  <Text strong>Required Skills:</Text>
                  <div className="mt-2">
                    {skills.map(skill => (
                      <Tag key={skill} color="blue">{skill}</Tag>
                    ))}
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {contextHolder}

      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <Title level={2}>Post a New Job</Title>
                  <Text type="secondary">
                    Create a detailed job posting to attract the best freelancers
                  </Text>
                </div>

                <Card className="mb-6">
                  <Steps current={currentStep} items={steps} />
                </Card>

                <Card style={{marginTop: '2rem'}}>
                  <Form
                  form={form}
                  layout="vertical"
                  initialValues={formData}
                  onValuesChange={(_, allValues) => setFormData(prev => ({ ...prev, ...allValues }))}
                  >
                  {renderStepContent()}

                  <Divider />

                  <div className="flex justify-between">
                    <Button
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    size="large"
                    >
                    Previous
                    </Button>

                    <Space>
                    {currentStep < steps.length - 1 ? (
                      <Button
                      type="primary"
                      onClick={handleNext}
                      size="large"
                      >
                      Next
                      </Button>
                    ) : (
                      <Button
                      type="primary"
                      onClick={() => {
                        console.log('Publish Job button clicked!');
                        handleSubmit();
                      }}
                      loading={isLoading}
                      size="large"
                      icon={<SendOutlined />}
                      >
                            Publish Job
                          </Button>
                        )}

                      </Space>
                    </div>
                  </Form>
                </Card>
              </div>
            </motion.div>
        </div>
      </div>
    </>
  );
};

export default PostJobPage;