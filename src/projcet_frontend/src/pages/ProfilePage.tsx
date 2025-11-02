import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Tabs,
  Tag,
  Space,
  List,
  Skeleton,
  Row,
  Col,
  message,
} from 'antd';
import {
  GlobalOutlined,
  InfoCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import Navbar from '../ui/components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { ProfilePictureService } from '../services/profilePictureService';
import dayjs from 'dayjs';
import { JobCategory } from '../shared/types/Job';
import { User } from '../shared/types/User';
import { useInvitation } from '../shared/hooks/useInvitation';
import { acceptInvitation, rejectInvitation } from '../controller/invitationController';
import EditProfileModal from './profile/EditProfileModal';
import ProfileHeader from './profile/ProfileHeader';
import StatsCards from './profile/StatsCards';
import InvitationsTab from './profile/InvitationsTab';
import { acceptApplier } from '../controller/applyController';
import { UserInvitationPayload } from '../shared/types/Invitation';
import { appendFreelancers } from '../controller/jobTransactionController';
import { useAcceptedJobs } from '../shared/hooks/useAcceptedJobs';
import FreelancerJobCard from '../components/tabs/FreelancerJobCard';
import { ProjectOutlined } from '@ant-design/icons';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const mockJobCategories: JobCategory[] = [
  { id: '1', jobCategoryName: 'Web Development' },
  { id: '2', jobCategoryName: 'Mobile Development' },
  { id: '3', jobCategoryName: 'UI/UX Design' },
  { id: '4', jobCategoryName: 'Data Science' },
  { id: '5', jobCategoryName: 'DevOps' },
];

const ProfilePage: React.FC = () => {
  const { user, isLoading, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { invitations, refetch, processingInvitation, setProcessingInvitation } = useInvitation(user!.id)
  const { activeJobs, historyJobs, loading: loadingAccepted, refetch: refetchAccepted } = useAcceptedJobs(user?.id)
 
  useEffect(() => {
    if (user && user.profilePictureUrl) {
      setProfileImage(user.profilePictureUrl);
    } else if (user) {
      // Set default profile picture
      setProfileImage(ProfilePictureService.getDefaultProfilePictureUrl());
    }
  }, [user]);

  const handleSave = async (values: any) => {
    if (!user) return;

    const payload: Partial<User> = {
      username: values.username,
      description: values.description,
    };

    if (values.dob) {
      payload.dob = values.dob.format('YYYY-MM-DD');
    }

    if (values.preference) {
      payload.preference = values.preference.map((id: string) => mockJobCategories.find(cat => cat.id === id)).filter(Boolean);
    }

    if (uploadedFile) {
      payload.profilePicture = uploadedFile; // Pass File directly for Supabase upload
    }

    payload.isProfileCompleted = user.isProfileCompleted;

    const success = await updateProfile(payload);
    if (success) {
      setIsEditing(false);
      setUploadedFile(null); // Reset uploaded file state
    }
  };

  const handleAvatarUpload = ({ file }: any) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setUploadedFile(file);
    }
  };

  const handleAcceptInvitation = async (invitation: UserInvitationPayload) => {
    if (!user) return;
    setProcessingInvitation(invitation.id.toString());
    try {
      const success = await acceptInvitation(user.id, invitation.id);
      if (success) {
        const res = await appendFreelancers(invitation.job.id,user.id)
        if (res) {
 
          message.success("Invitation accepted successfully!");
          refetch();
          refetchAccepted();
        } else {
          message.error("Error at applied");
        }
      } else {
        message.error('Job slot already full, please reject it!.');
      }
    } catch (error) {
      console.error("An error occurred while accepting the invitation.", error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleRejectInvitation = async (invitationId: bigint) => {
    if (!user) return;
    setProcessingInvitation(invitationId.toString());
    try {
      const success = await rejectInvitation(user.id, invitationId);
      if (success) {
        message.success("Invitation rejected successfully.");
        refetch();
      } else {
        message.error("Failed to reject invitation.");
      }
    } catch (error) {
      console.error("An error occurred while rejecting the invitation.", error);
    } finally {
      setProcessingInvitation(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton active avatar paragraph={{ rows: 4 }} />
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <Title level={2}>Please log in to view your profile.</Title>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:25px_25px]" />
      
      {/* Subtle Gradient Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl" />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6">
            <ProfileHeader
              user={user}
              profileImage={profileImage}
              onEdit={() => setIsEditing(true)}
            />
          </Card>

          <StatsCards user={user} jobsCompleted={historyJobs.length}/>

          <Card>
            <Tabs defaultActiveKey="overview">
              <TabPane tab="Overview" key="overview">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={16}>
                    <div className="space-y-6">
                      <Card title="About Me">
                        <Paragraph>{user.description || 'No description provided.'}</Paragraph>
                      </Card>
                      <div></div>
                      <Card title="Skills">
                        <Space wrap>
                          {user.preference?.length > 0 ? (
                            user.preference.map(skill => (
                              <Tag key={skill.id} color="blue">{skill.jobCategoryName}</Tag>
                            ))
                          ) : (
                            <Text type="secondary">No skills listed.</Text>
                          )}
                        </Space>
                      </Card>
                    </div>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Details">
                      <List>
                        <List.Item>
                          <List.Item.Meta
                            avatar={<InfoCircleOutlined />}
                            title="Date of Birth"
                            description={user.dob ? dayjs(user.dob).format('MMMM D, YYYY') : 'Not specified'}
                          />
                        </List.Item>
                        <List.Item>
                          <List.Item.Meta
                            avatar={<GlobalOutlined />}
                            title="Face Recognition"
                            description={user.isFaceRecognitionOn ? 'Enabled' : 'Disabled'}
                          />
                        </List.Item>
                      </List>
                    </Card>
                  </Col>
                </Row>
              </TabPane>

              <TabPane
                tab={
                  <Space>
                    <ProjectOutlined />
                    Jobs
                  </Space>
                }
                key="accepted-jobs"
              >
                {loadingAccepted ? (
                  <Skeleton active paragraph={{ rows: 6 }} />
                ) : (
                  <Row gutter={[24, 24]}>
                    <Col xs={24} lg={12}>
                      <Card title="Active Jobs">
                        {activeJobs.length === 0 ? (
                          <Text type="secondary">No active jobs.</Text>
                        ) : (
                          activeJobs.map((jt, index) => (
                            <FreelancerJobCard
                              key={jt.jobId + String(index)}
                              jobId={jt.jobId}
                              isLoading={() => {}}
                            />
                          ))
                        )}
                      </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                      <Card title="History Jobs">
                        {historyJobs.length === 0 ? (
                          <Text type="secondary">No history yet.</Text>
                        ) : (
                          historyJobs.map((jt, index) => (
                            <FreelancerJobCard
                              key={jt.jobId + 'hist' + String(index)}
                              jobId={jt.jobId}
                              isLoading={() => {}}
                            />
                          ))
                        )}
                      </Card>
                    </Col>
                  </Row>
                )}
              </TabPane>

              <TabPane
                tab={
                  <Space>
                    <InboxOutlined />
                    Invitations
                  </Space>
                }
                key="invitations"
              >
                <InvitationsTab
                  invitations={invitations || []}
                  processingInvitation={processingInvitation}
                  onAccept={handleAcceptInvitation}
                  onReject={handleRejectInvitation}
                />
              </TabPane>
            </Tabs>
          </Card>
        </motion.div>
      </div>

      <EditProfileModal
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        onSave={handleSave}
        user={user}
        profileImage={profileImage}
        handleAvatarUpload={handleAvatarUpload}
        mockJobCategories={mockJobCategories}
      />
    </div>
  );
};

export default ProfilePage;