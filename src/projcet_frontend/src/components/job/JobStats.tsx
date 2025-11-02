import React from 'react';
import { Row, Col, Typography } from 'antd';
import { DollarOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { Job } from '../../shared/types/Job';
import { User } from '../../shared/types/User';

const { Text } = Typography;

interface JobStatsProps {
  job: Job;
  applicantsCount: number;
  acceptedFreelancers: User[];
  onInvoiceClick: () => void;
}

const JobStats: React.FC<JobStatsProps> = ({ 
  job, 
  applicantsCount, 
  acceptedFreelancers, 
  onInvoiceClick 
}) => {
  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={12} sm={6}>
        <div className="text-center p-4 bg-background rounded-lg">
          <DollarOutlined className="text-2xl text-green-500 mb-2" />
          <div className="font-semibold">${job.jobSalary.toLocaleString()}</div>
          <Text type="secondary">Fixed Price</Text>
        </div>
      </Col>
      <Col xs={12} sm={6}>
        <div className="text-center p-4 bg-background rounded-lg">
          <UserOutlined className="text-2xl text-purple-500 mb-2" />
          <div className="font-semibold">
            {job.jobStatus !== 'Finished'
              ? (Number(job.jobSlots) - acceptedFreelancers.length > 0
                ? `${Number(job.jobSlots) - acceptedFreelancers.length}`
                : "No Slots")
              : "Closed"}
          </div>
          <Text type="secondary">Available Slots</Text>
        </div>
      </Col>
      <Col xs={12} sm={6}>
        <div className="text-center p-4 bg-background rounded-lg">
          <UserOutlined className="text-2xl text-blue-500 mb-2" />
          <div className="font-semibold">{applicantsCount}</div>
          <Text type="secondary">Applicants</Text>
        </div>
      </Col>
      <Col xs={12} sm={6}>
        <div
          className="text-center p-4 bg-background rounded-lg cursor-pointer hover:shadow-md transition"
          onClick={onInvoiceClick}
        >
          <MailOutlined className="text-2xl text-orange-500 mb-2" />
          <div className="font-semibold">{acceptedFreelancers.length}</div>
          <Text type="secondary">Invoice</Text>
        </div>
      </Col>
    </Row>
  );
};

export default JobStats;
