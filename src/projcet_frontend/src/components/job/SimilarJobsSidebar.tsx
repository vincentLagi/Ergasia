import React from 'react';
import { Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../shared/types/Job';

const { Text } = Typography;

interface SimilarJobsSidebarProps {
  similarJobs: Job[] | null;
}

const SimilarJobsSidebar: React.FC<SimilarJobsSidebarProps> = ({ similarJobs }) => {
  const navigate = useNavigate();

  return (
    <Card title="Similar Jobs" size="small">
      <div className="space-y-3">
        {similarJobs && similarJobs.length > 0 ? (
          similarJobs.map(similarJob => (
            <div
              key={similarJob.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/job/${similarJob.id}`)}
            >
              <Text strong className="block mb-1">
                {similarJob.jobName}
              </Text>
              <Text type="secondary" className="text-sm">
                ${similarJob.jobSalary.toLocaleString()} • Fixed Price
              </Text>
            </div>
          ))
        ) : (
          <Text type="secondary">No similar jobs found.</Text>
        )}
      </div>
    </Card>
  );
};

export default SimilarJobsSidebar;
