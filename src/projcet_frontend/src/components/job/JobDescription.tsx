import React from 'react';
import { Typography, Tag, Space, Divider } from 'antd';
import { Job } from '../../shared/types/Job';

const { Title, Paragraph } = Typography;

interface JobDescriptionProps {
  job: Job;
}

const JobDescription: React.FC<JobDescriptionProps> = ({ job }) => {
  return (
    <>
      <Divider />
      
      <div className="mb-6">
        <Title level={4}>Job Description</Title>
        <div className="whitespace-pre-line">
          {job.jobDescription.map((desc, index) => (
            <Paragraph key={index}>{desc}</Paragraph>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <Title level={4}>Required Skills</Title>
        <Space wrap>
          {job.jobTags.map((tag) => (
            <Tag key={tag.id} color="processing" className="mb-2">
              {tag.jobCategoryName}
            </Tag>
          ))}
        </Space>
      </div>
    </>
  );
};

export default JobDescription;
