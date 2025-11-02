import React from 'react';
import {
  Card,
  Typography,
  Button,
  Row,
  Col,
  Tag,
  Space,
  Divider,
  Empty,
  Popconfirm,
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { Invitation, UserInvitationPayload } from '../../shared/types/Invitation';
import { formatDate } from '../../utils/dateUtils';
import { formatSalary } from '../../utils/formatter';
import { acceptInvitation, rejectInvitation } from '../../controller/invitationController';

const { Title, Text, Paragraph } = Typography;

interface InvitationsTabProps {
  invitations: UserInvitationPayload[];
  processingInvitation: string | null;
  onAccept: (invitationId: UserInvitationPayload) => Promise<void>;
  onReject: (invitationId: bigint) => Promise<void>;
}

const InvitationsTab: React.FC<InvitationsTabProps> = ({
  invitations,
  processingInvitation,
  onAccept,
  onReject,
}) => {
  const handleAccept = async (invitation: UserInvitationPayload) => {
    await onAccept(invitation);
  };

  const handleReject = async (invitationId: bigint) => {
    await onReject(invitationId);
  };
  const renderInvitationCard = (invitation: UserInvitationPayload) => (
    <Card
      key={invitation.id.toString()}
      className="mb-4 hover:shadow-lg transition-shadow duration-300"
    >
      <Row gutter={[24, 16]}>
        <Col xs={24} lg={16}>
          <div className="flex items-start justify-between mb-3">
            <Title level={4} className="mb-1">{invitation.job.jobName}</Title>
            {invitation.isAccepted && (
              <Tag color="green" icon={<CheckOutlined />} className="ml-2">
                Accepted
              </Tag>
            )}
          </div>

          <Space direction="vertical" size="small" className="w-full mb-4">
            <div className="flex items-center">
              <DollarOutlined className="text-green-500 mr-2" />
              <Text strong className="text-lg">{invitation.job.jobSalary} Ergn</Text>
            </div>

            <div className="flex items-center">
              <ClockCircleOutlined className="text-blue-500 mr-2" />
              <Text type="secondary">Invited on {formatDate(invitation.invitedAt)}</Text>
            </div>
          </Space>

          <Paragraph className="mb-3" type="secondary">
            {invitation.job.jobDescription.join(' ').substring(0, 150)}
            {invitation.job.jobDescription.join(' ').length > 150 && '...'}
          </Paragraph>

          <Space wrap>
            {invitation.job.jobTags.map(tag => (
              <Tag key={tag.id} color="blue">{tag.jobCategoryName}</Tag>
            ))}
          </Space>
        </Col>

        {/* Actions & Status - Right Side */}
        <Col xs={24} lg={8}>
          <div className="h-full flex flex-col justify-between">
            {/* Status Section */}
            <div className="text-center lg:text-right mb-4">
              <div className="rounded-lg p-4 mb-4">
                <Text type="secondary" className="text-sm block mb-1">
                  Invitation Status
                </Text>
                <Text strong style={{color: invitation.isAccepted? 'green' : 'orange'}}>
                  {invitation.isAccepted ? "Accepted" : "Pending Response"}
                </Text>
              </div>
            </div>

            {/* Action Buttons */}
            {!invitation.isAccepted ? (
              <Space direction="vertical" size="middle" className="w-full">
                <Popconfirm
                  title="Accept this invitation?"
                  description="Are you sure you want to accept this job invitation?"
                  onConfirm={() => handleAccept(invitation)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    loading={processingInvitation === invitation.id.toString()}
                    className="w-full bg-green-600 border-green-600 hover:bg-green-700"
                    size="large"
                  >
                    Accept Invitation
                  </Button>
                </Popconfirm>
                
                <Popconfirm
                  title="Reject this invitation?"
                  description="Are you sure you want to reject this job invitation?"
                  onConfirm={() => handleReject(invitation.id)}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button
                    icon={<CloseOutlined />}
                    loading={processingInvitation === invitation.id.toString()}
                    className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    size="large"
                  >
                    Reject Invitation
                  </Button>
                </Popconfirm>
              </Space>
            ) : (
              <div className="text-center">
                <CheckOutlined className="text-green-600 text-2xl mb-2" />
                <Text type="secondary" className="block text-sm">
                  You accepted this invitation on<br />
                </Text>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </Card>
  );

  const pendingInvitations = invitations?.filter(inv => !inv.isAccepted && inv.job.jobStatus === "Open") || [];
  const acceptedInvitations = invitations?.filter(inv => inv.isAccepted) || [];

  return (
    <div className="space-y-4">
      {invitations && invitations.length > 0 ? (
        <>
          {pendingInvitations.length > 0 && (
            <>
              <Title level={4} className="mb-4">
                Pending Invitations
              </Title>
              {pendingInvitations.map(renderInvitationCard)}
            </>
          )}

          {acceptedInvitations.length > 0 && (
            <>
              <Divider />
              <Title level={4} className="mb-4">Accepted Invitations</Title>
              {acceptedInvitations.map(renderInvitationCard)}
            </>
          )}
        </>
      ) : (
        <Empty
          image={<InboxOutlined style={{ fontSize: '64px', color: '#d9d9d9' }} />}
          description={
            <div>
              <Text type="secondary" className="text-lg">No invitations yet</Text>
              <br />
              <Text type="secondary">Job invitations will appear here when you receive them.</Text>
            </div>
          }
        />
      )}
    </div>
  );
};

export default InvitationsTab;