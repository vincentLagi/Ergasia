import React from 'react';
import { Typography, Tag, Space, Button, Tooltip } from 'antd';
import { ClockCircleOutlined, ShareAltOutlined } from '@ant-design/icons';
import { Job } from '../../shared/types/Job';
import { getStatusColor } from '../../utils/JobStatusCololer';

const { Title, Text } = Typography;

interface JobHeaderProps {
  job: Job;
  onShare: () => void;
}

const JobHeader: React.FC<JobHeaderProps> = ({ job, onShare }) => {
  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  return (
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <Title level={2} className="mb-2">{job.jobName}</Title>
        <Space size="middle" wrap>
          <Tag color="blue">{job.jobTags[0]?.jobCategoryName || 'General'}</Tag>
          <Tag color={getStatusColor(job.jobStatus)}>{job.jobStatus}</Tag>
          <Text type="secondary">
            <ClockCircleOutlined className="mr-1" />
            Posted {getTimeAgo(new Date(Number(job.createdAt) / 1_000_000).toISOString())}
          </Text>
        </Space>
      </div>

      <Space>
        <Tooltip title="Share job">
          <Button icon={<ShareAltOutlined />} onClick={onShare} />
        </Tooltip>
      </Space>
    </div>
  );
};

export default JobHeader;