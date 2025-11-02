import React, { memo, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  Card, 
  Tag, 
  Button, 
  Avatar, 
  Space, 
  Tooltip, 
  Typography,
  Divider,
  Progress
} from 'antd';
import {
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  HeartOutlined,
  HeartFilled,
  EyeOutlined,
  CalendarOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../shared/types/Job';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../shared/hooks/useNotifications';
import { formatDate } from '../../utils/dateUtils';
import { getStatusColor } from '../../utils/JobStatusCololer';
const { Text, Title } = Typography;

interface JobCardProps {
  job: Job;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onSave?: (jobId: string) => void;
  onUnsave?: (jobId: string) => void;
  isSaved?: boolean;
}

const JobCard: React.FC<JobCardProps> = memo(({
  job,
  className = '',
  variant = 'default',
  showActions = true,
  onSave,
  onUnsave,
  isSaved = false
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { success } = useNotifications();
  const [isHovered, setIsHovered] = useState(false);
  const [localSaved, setLocalSaved] = useState(isSaved);

  const handleViewDetails = useCallback(() => {
    navigate(`/jobs/${job.id}`);
  }, [navigate, job.id]);

  const handleSaveToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    
    if (!isAuthenticated) {
      navigate('/face-recognition/login');
      return;
    }

    const newSavedState = !localSaved;
    setLocalSaved(newSavedState);

    if (newSavedState) {
      onSave?.(job.id);
      success('Success', 'Job saved to your favorites!');
    } else {
      onUnsave?.(job.id);
      success('Success', 'Job removed from favorites');
    }
  }, [isAuthenticated, localSaved, onSave, onUnsave, job.id, navigate, success]);


  const getExperienceColor = (level?: string) => {
    switch (level) {
      case 'Beginner': return 'green';
      case 'Intermediate': return 'orange';
      case 'Expert': return 'red';
      default: return 'default';
    }
  };

  const calculateProgress = () => {
    // Mock progress calculation based on job slots
    const totalSlots = Number(job.jobSlots);
    const filledSlots = Math.floor(totalSlots * 0.3); // 30% filled for demo
    return totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;
  };

  const cardVariants = {
    default: "min-h-[280px]",
    compact: "min-h-[200px]",
    featured: "min-h-[320px] border-2 border-primary/20"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2, ease: 'easeOut' }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={className}
    >
      <Card
        hoverable
        className={`${cardVariants[variant]} relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl`}
        onClick={handleViewDetails}
        styles={{
          actions: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }
        }}
        cover={
          variant === 'featured' && (
            <div className="h-2 bg-gradient-to-r from-primary to-purple-600" />
          )
        }
        actions={showActions ? [
          // <Tooltip title={localSaved ? 'Remove from favorites' : 'Save job'} key="save">
          //   <Button
          //     type="text"
          //     icon={localSaved ? <HeartFilled className="text-red-500" /> : <HeartOutlined />}
          //     onClick={handleSaveToggle}
          //     className="hover:scale-110 transition-transform"
          //   />
          // </Tooltip>,
          // <Tooltip title="View details" key="view">
          //   <Button
          //     type="text"
          //     icon={<EyeOutlined />}
          //     onClick={handleViewDetails}
          //     className="hover:scale-110 transition-transform"
          //   />
          // </Tooltip>,
          // <Tooltip title="Quick apply" key="apply">
          //   <Button
          //     type="primary"
          //     size="small"
          //     onClick={(e) => {
          //       e.stopPropagation();
          //       navigate(`/jobs/${job.id}/apply`);
          //     }}
          //     className="hover:scale-105 transition-transform "
          //   >
          //     Apply
          //   </Button>
          // </Tooltip>
        ] : undefined}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <Title level={4} className="mb-1 line-clamp-2">
              {job.jobName}
            </Title>
            <Space wrap>
              <Tag color={getStatusColor(job.jobStatus)}>{job.jobStatus}</Tag>
              {job.experienceLevel && (
                <Tag color={getExperienceColor(job.experienceLevel)}>
                  {job.experienceLevel}
                </Tag>
              )}
              {job.jobType && (
                <Tag>{job.jobType}</Tag>
              )}
            </Space>
          </div>
          
        </div>

        {/* Job Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <Space>
              <DollarOutlined className="text-green-500" />
              <Text strong className="text-lg">${job.jobSalary}</Text>
              <Text type="secondary">fixed price</Text>
            </Space>
            <Space>
              <UserOutlined className="text-blue-500" />
              <Text>{Number(job.jobSlots)} slots</Text>
            </Space>
          </div>

          {job.deadline && (
            <div className="flex items-center space-x-2">
              <CalendarOutlined className="text-orange-500" />
              <Text type="secondary">
                Due: {new Date(job.deadline).toLocaleDateString()}
              </Text>
            </div>
          )}

          {/* Progress Bar for Slots */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <Text type="secondary" className="text-xs">Applications</Text>
              <Text type="secondary" className="text-xs">
                {Math.floor(calculateProgress())}% filled
              </Text>
            </div>
            <Progress 
              percent={calculateProgress()} 
              size="small" 
              showInfo={false}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </div>
        </div>

        <Divider className="my-3" />

        {/* Job Description Preview */}
        <div className="mb-4">
          <Text type="secondary" className="text-sm line-clamp-3">
            {job.jobDescription.slice(0, 2).join(' • ')}
            {job.jobDescription.length > 2 && '...'}
          </Text>
        </div>

        {/* Skills/Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {job.jobTags.slice(0, 3).map((tag, index) => (
            <Tag key={index} className="text-xs">
              {tag.jobCategoryName}
            </Tag>
          ))}
          {job.jobTags.length > 3 && (
            <Tag className="text-xs">
              +{job.jobTags.length - 3} more
            </Tag>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <ClockCircleOutlined />
            <span>Posted {formatDate(job.createdAt)}</span>
          </div>
          {/* <div className="flex items-center space-x-2">
            <Avatar size="small" icon={<UserOutlined />} />
            <span>Client</span>
          </div> */}
        </div>

        {/* Hover Overlay Effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none"
            />
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
});

JobCard.displayName = 'JobCard';


export default JobCard;