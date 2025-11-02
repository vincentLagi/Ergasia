import React from 'react';
import { Card, Table, Avatar, Typography, Button, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { User } from '../../shared/types/User';

const { Text } = Typography;

interface AcceptedFreelancersTableProps {
  acceptedFreelancers: User[];
}

const AcceptedFreelancersTable: React.FC<AcceptedFreelancersTableProps> = ({ 
  acceptedFreelancers 
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Freelancer',
      key: 'freelancer',
      render: (_: any, record: User) => (
        <div className="flex items-center space-x-3">
          <Avatar src={record.profilePictureUrl || undefined} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.username}</Text>
            <div className="flex items-center space-x-1">
              <Text type="secondary" className="text-sm">Rating: </Text>
              <Text className="text-sm">{(Number(record.rating) / 10).toFixed(1)}</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button
            onClick={() => navigate(`/profile/${record.id}`)}
          >
            View Profile
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Table
        columns={columns}
        dataSource={acceptedFreelancers}
        rowKey="id"
        pagination={false}
        locale={{ emptyText: 'No accepted freelancers yet' }}
      />
    </Card>
  );
};

export default AcceptedFreelancersTable;
