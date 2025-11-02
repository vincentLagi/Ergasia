import React, { useState } from 'react';
import {
  Card,
  Typography,
  Form,
  Input,
  Button,
  Upload,
  Skeleton,
  Space,
  Tag,
  List,
  Avatar
} from 'antd';
import {
  SendOutlined,
  PaperClipOutlined,
  LinkOutlined,
  FileOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useWorkSubmission } from '../shared/hooks';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Submission {
  id: string;
  title: string;
  description: string;
  link?: string;
  file?: File;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const WorkSubmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { user } = useAuth();
  
  // Use optimized custom hook
  const {
    job,
    submissions,
    loading,
    isSubmitting,
    handleSubmitWork
  } = useWorkSubmission(jobId, user);
  
  const [form] = Form.useForm();

  // Handle work submission
  const handleSubmit = async (values: any) => {
    const success = await handleSubmitWork(values);
    if (success) {
      form.resetFields();
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'processing';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleOutlined />;
      case 'rejected': return <ClockCircleOutlined />;
      case 'pending': return <ClockCircleOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton active />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <div className="text-center py-8">
              <Text type="secondary">Job not found or you don't have access to this job.</Text>
              <br />
              <Button type="primary" onClick={() => navigate('/jobs')} className="mt-4">
                Browse Jobs
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Job Information */}
          <Card className="mb-6">
            <div className="flex justify-between items-start">
              <div>
                <Title level={3}>{job.jobName}</Title>
                <Space>
                  <Tag color="blue">{job.jobTags[0]?.jobCategoryName || 'General'}</Tag>
                  <Tag color="green">${job.jobSalary.toLocaleString()}</Tag>
                  <Tag color={job.jobStatus === 'Ongoing' ? 'processing' : 'default'}>
                    {job.jobStatus}
                  </Tag>
                </Space>
              </div>
              <Button onClick={() => navigate(`/jobs/${jobId}`)}>
                View Job Details
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Submit New Work */}
            <Card title="Submit Your Work" className="h-fit">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
              >
                <Form.Item
                  name="title"
                  label="Submission Title"
                  rules={[{ required: true, message: 'Please enter a title for your submission' }]}
                >
                  <Input
                    placeholder="e.g., Initial Design Mockups, Backend API Implementation"
                    maxLength={100}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="description"
                  label="Description"
                  rules={[{ required: true, message: 'Please describe your work' }]}
                >
                  <TextArea
                    rows={6}
                    placeholder="Describe what you've completed, any challenges faced, and next steps..."
                    maxLength={2000}
                    showCount
                  />
                </Form.Item>

                <Form.Item
                  name="link"
                  label="Work Link (Optional)"
                  extra="Provide a link to your work (GitHub, Google Drive, etc.)"
                >
                  <Input
                    prefix={<LinkOutlined />}
                    placeholder="https://github.com/username/project or https://drive.google.com/..."
                  />
                </Form.Item>

                <Form.Item
                  name="attachments"
                  label="File Attachments (Optional)"
                  extra="Upload relevant files, screenshots, or documents"
                >
                  <Upload
                    multiple
                    beforeUpload={() => false}
                    listType="text"
                  >
                    <Button icon={<PaperClipOutlined />}>
                      Attach Files
                    </Button>
                  </Upload>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={isSubmitting}
                    icon={<SendOutlined />}
                    size="large"
                    block
                  >
                    Submit Work
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            {/* Previous Submissions */}
            <Card title="Your Submissions" className="h-fit">
              {submissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileOutlined className="text-4xl text-gray-400 mb-4" />
                  <Text type="secondary">No submissions yet</Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    Submit your work using the form on the left
                  </Text>
                </div>
              ) : (
                <List
                  dataSource={submissions}
                  renderItem={(submission) => (
                    <List.Item
                      actions={[
                        <Button
                          key="view"
                          type="text"
                          icon={<EyeOutlined />}
                          size="small"
                        >
                          View
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            icon={getStatusIcon(submission.status)} 
                            style={{ 
                              backgroundColor: getStatusColor(submission.status) === 'success' ? '#52c41a' : 
                                              getStatusColor(submission.status) === 'error' ? '#ff4d4f' : '#1890ff'
                            }}
                          />
                        }
                        title={
                          <div className="flex items-center justify-between">
                            <Text strong>{submission.title}</Text>
                            <Tag color={getStatusColor(submission.status)}>
                              {submission.status.toUpperCase()}
                            </Tag>
                          </div>
                        }
                        description={
                          <div>
                            <Text className="text-sm line-clamp-2">
                              {submission.description}
                            </Text>
                            <br />
                            <Text type="secondary" className="text-xs">
                              Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                            </Text>
                            {submission.link && (
                              <div className="mt-1">
                                <a 
                                  href={submission.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-500 text-xs"
                                >
                                  <LinkOutlined className="mr-1" />
                                  View Work
                                </a>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkSubmissionPage;