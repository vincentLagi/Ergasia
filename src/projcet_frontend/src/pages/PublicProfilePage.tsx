import React, { useState, useEffect } from 'react';
import {
  Card,
  Avatar,
  Typography,
  Rate,
  Tag,
  Space,
  Row,
  Col,
  Button,
  Tabs,
  Skeleton,
  message,
  Result,
  List,
  Modal,
} from 'antd';
import {
  UserOutlined,
  EnvironmentOutlined,
  StarOutlined,
  ProjectOutlined,
  MessageOutlined,
  ShareAltOutlined,
  CalendarOutlined,
  SendOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';
import { getUserById } from '../controller/userController';
import { ProfilePictureService } from '../services/profilePictureService';
import { User } from '../shared/types/User';
import dayjs from 'dayjs';
import { formatDate } from '../utils/dateUtils';
import { useManageJobs } from '../shared/hooks';
import InviteModal from '../components/modals/InviteModel';
const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PublicProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const {jobs} = useManageJobs();

  useEffect(() => {
    const fetchUser = async () => {
      if (id) {
        setIsLoading(true);
        try {
          const fetchedUser = await getUserById(id);
          if (fetchedUser && "ok" in fetchedUser) {
            setUser(fetchedUser.ok);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to fetch user:", error);
          message.error("Failed to load user profile.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchUser();
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Profile link copied to clipboard');
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
        <div className="container mx-auto px-4 py-8">
          <Result
            status="404"
            title="User Not Found"
            subTitle="Sorry, the user you are looking for does not exist."
          />
        </div>
      </div>
    );
  }

  const profilePictureUrl = user.profilePictureUrl || ProfilePictureService.getDefaultProfilePictureUrl();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6">
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={6} className="text-center">
                <Avatar size={120} src={profilePictureUrl} icon={<UserOutlined />} />
              </Col>
              <Col xs={24} sm={12}>
                <Title level={2} className="mb-2">{user.username || 'Anonymous User'}</Title>
                <Space direction="vertical" size="small">
                  <Space>
                    <CalendarOutlined />
                    <Text>Member since {formatDate(user.createdAt)}</Text>
                  </Space>
                  <Space>
                    <Rate disabled value={user.rating} allowHalf />
                    <Text>({user.rating.toFixed(1)})</Text>
                  </Space>
                </Space>
              </Col>
              <Col xs={24} sm={6} className="text-center">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" icon={<SendOutlined />} onClick={() => {setIsInviteModalVisible(true)}} block>
                    Invite
                  </Button>
                  <Button icon={<ShareAltOutlined />} onClick={handleShare} block>
                    Share
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>

          <Card>
            <Tabs defaultActiveKey="overview">
              <TabPane tab="Overview" key="overview">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={16}>
                    <div className="mb-6">
                      <Title level={4}>About</Title>
                      <Paragraph>{user.description || 'No description available.'}</Paragraph>
                    </div>
                    <div>
                      <Title level={4}>Skills</Title>
                      <Space wrap>
                        {user.preference?.length > 0 ? (
                          user.preference.map(skill => (
                            <Tag key={skill.id} color="blue">{skill.jobCategoryName}</Tag>
                          ))
                        ) : (
                          <Text type="secondary">No skills listed.</Text>
                        )}
                      </Space>
                    </div>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Details">
                      <List>
                        <List.Item>
                          <List.Item.Meta
                            avatar={<StarOutlined />}
                            title="Rating"
                            description={`${user.rating.toFixed(1)} / 5.0`}
                          />
                        </List.Item>
                        <List.Item>
                          <List.Item.Meta
                            avatar={<ProjectOutlined />}
                            title="Jobs Completed"
                            description="0"
                          />
                        </List.Item>
                      </List>
                    </Card>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </Card>
        </motion.div>
      </div>

      <InviteModal
        visible={isInviteModalVisible}
        onCancel={() => setIsInviteModalVisible(false)}
        jobs={jobs || []}
        freelancer={user}
      />


    </div>
  );
};

export default PublicProfilePage;