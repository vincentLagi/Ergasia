import React, { useState } from 'react';
import { Card, Table, Avatar, Typography, Button, Space, Modal, Form, Input, message } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { User } from '../../shared/types/User';
import { formatDate } from '../../utils/dateUtils';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ApplicantData {
  user: User;
  appliedAt: string;
}

interface ApplicantsTableProps {
  applicants: ApplicantData[];
  onAcceptApplicant: (userId: string, values: any) => Promise<boolean>;
  onRejectApplicant: (userId: string, values: any) => Promise<boolean>;
  onViewCoverLetter: (applicantId: string) => void;
  coverLetter: string;
  isFetchingLetter: boolean;
  isCoverModalVisible: boolean;
  setIsCoverModalVisible: (visible: boolean) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

const ApplicantsTable: React.FC<ApplicantsTableProps> = ({
  applicants,
  onAcceptApplicant,
  onRejectApplicant,
  onViewCoverLetter,
  coverLetter,
  isFetchingLetter,
  isCoverModalVisible,
  setIsCoverModalVisible,
  isAccepting,
  isRejecting
}) => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [isAcceptModalVisible, setIsAcceptModalVisible] = useState(false);
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<User | null>(null);

  const handleAccept = (user: User) => {
    setSelectedApplicant(user);
    setIsAcceptModalVisible(true);
  };

  const handleReject = (user: User) => {
    setSelectedApplicant(user);
    setIsRejectModalVisible(true);
  };

  const columns = [
    {
      title: 'Freelancer',
      key: 'freelancer',
      render: (_: any, record: ApplicantData) => (
        <div className="flex items-center space-x-3">
          <Avatar src={record.user.profilePictureUrl || undefined} icon={<UserOutlined />} />
          <div>
            <Text strong>{record.user.username}</Text>
            <div className="flex items-center space-x-1">
              <Text type="secondary" className="text-sm">Rating: </Text>
              <Text className="text-sm">{(Number(record.user.rating) / 10).toFixed(1)}</Text>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Applied',
      dataIndex: 'appliedAt',
      key: 'appliedAt',
      render: (date: string) => formatDate(BigInt(new Date(date).getTime()) * 1_000_000n),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApplicantData) => (
        <Space>
          <Button
            size="small"
            onClick={() => navigate(`/profile/${record.user.id}`)}
          >
            View Profile
          </Button>
          <Button
            size="small"
            onClick={() => onViewCoverLetter(record.user.id)}
          >
            View Cover Letter
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleAccept(record.user)}
          >
            Accept
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record.user)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <Table
          columns={columns}
          dataSource={applicants}
          rowKey={(record) => record.user.id}
          pagination={false}
          locale={{ emptyText: 'No applicants yet' }}
        />
      </Card>

      {/* Cover Letter Modal */}
      <Modal
        title="Cover Letter"
        open={isCoverModalVisible}
        onCancel={() => setIsCoverModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsCoverModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        {isFetchingLetter ? (
          <div className="container mx-auto px-4 py-8">
            <div>Loading...</div>
          </div>
        ) : (
          <Paragraph style={{ whiteSpace: "pre-line" }}>
            {coverLetter}
          </Paragraph>
        )}
      </Modal>

      {/* Accept Modal */}
      <Modal
        title="Accept Applicant"
        open={isAcceptModalVisible}
        onCancel={() => setIsAcceptModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            if (selectedApplicant) {
              const success = await onAcceptApplicant(selectedApplicant.id, values);
              if (success) {
                message.success("Applicant accepted successfully!");
                setIsAcceptModalVisible(false);
                form.resetFields();
              } else {
                message.error("Failed to accept applicant.");
              }
            }
          }}
        >
          <Form.Item
            name="acceptancereason"
            label="Acceptance Reason"
            rules={[{ required: true, message: 'Please write an acceptance reason' }]}
          >
            <TextArea
              rows={6}
              placeholder="Explain why this applicant is fit for this job..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsAcceptModalVisible(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isAccepting}
              icon={<CheckOutlined />}
            >
              Accept Applicant
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        title="Reject Applicant"
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            if (selectedApplicant) {
              onRejectApplicant(selectedApplicant.id, values);
              setIsRejectModalVisible(false);
              form.resetFields();
            }
          }}
        >
          <Form.Item
            name="rejectionreason"
            label="Rejection Reason"
            rules={[{ required: true, message: 'Please write a rejection reason' }]}
          >
            <TextArea
              rows={6}
              placeholder="Explain why this applicant isn't fit for this job..."
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsRejectModalVisible(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={isRejecting}
              icon={<CloseOutlined />}
            >
              Reject Applicant
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default ApplicantsTable;
