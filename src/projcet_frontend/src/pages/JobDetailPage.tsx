import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  message,
  Skeleton,
  Tabs,
  Row,
  Col
} from 'antd';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useJobDetails, useUserManagement, useRating } from '../shared/hooks';
import { User } from '../shared/types/User';
import { useWallet } from '../hooks/useWallet';

// Import komponen job yang baru
import {
  JobHeader,
  JobStats,
  JobDescription,
  JobActions,
  JobModals,
  ApplicantsTable,
  AcceptedFreelancersTable,
  RatingSection,
  SimilarJobsSidebar,
  ApplyJobModal
} from '../components/job';

// Import untuk komponen submission yang masih diperlukan
import type { Submission } from '../../../declarations/projcet_backend_single/projcet_backend_single.did';
import { createSubmission, getUserSubmissionsByJobId, getSubmissionByJobId, updateSubmissionStatus } from '../controller/submissionController';
import { getUserById } from '../controller/userController';
import { formatDate } from '../utils/dateUtils';
import { RcFile } from 'antd/es/upload';
import {
  Table,
  Avatar,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Upload,
  Tag,
  AutoComplete,
  UploadFile
} from 'antd';
import {
  UserOutlined,
  SendOutlined,
  PaperClipOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';


const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface ApplicantData {
  user: User;
  appliedAt: string;
}

const JobDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { user } = useAuth();

  // Use optimized custom hooks
  const {
    job,
    applicants,
    acceptedFreelancers,
    hasApplied,
    isJobOwner,
    loading,
    isApplying,
    isJobFreelancer,
    isAccepting,
    isRejecting,
    isFetchingLetter,
    isStartingJob,
    similarJobs,
    handleApply,
    handleAcceptApplicant,
    handleRejectApplicant,
    handleStartJob,
    handleFinishJob,
    handleCoverLetter
  } = useJobDetails(jobId, user);

  const {
    walletSymbol
  } = useWallet();

  const {
    allUsers,
    fetchAllUsers,
    sendInvitation,
    clearSearch
  } = useUserManagement();

  const [isApplyModalVisible, setIsApplyModalVisible] = useState(false);
  const [isInviteModalVisible, setIsInviteModalVisible] = useState(false);
  const [isCoverModalVisible, setIsCoverModalVisible] = useState(false);
  const [localLoading, setlocalLoading] = useState<boolean>(false);
  const [isStartJobModalVisible, setIsStartJobModalVisible] = useState(false);
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);

  const [activeTab, setActiveTab] = useState('details');
  const [inviteForm] = Form.useForm();

  const [coverLetter, setCoverLetter] = useState<string>("");
  const [selectedWalletSymbol, setSelectedWalletSymbol] = useState(walletSymbol);


  // Data untuk invoice modal
  const invoiceData = acceptedFreelancers.map((f, index) => ({
    key: index,
    name: f.username || `Freelancer ${index + 1}`,
    amount: job ? (job.jobSalary).toLocaleString() : 'N/A',
  }));


  // Handle user invitation
  const handleInviteUser = async (values: any) => {
    if (!user || !jobId || !values.userId) return;

    try {
      setlocalLoading(true);
      const success = await sendInvitation(values.userId, user.id, jobId);
      if (success) {
        message.success('Invitation sent successfully');
        setIsInviteModalVisible(false);
        inviteForm.resetFields();
        clearSearch();
      } else {
        message.error('Failed to send invitation');
      }
      setlocalLoading(false)
    } catch (error) {
      console.error('Error sending invitation:', error);
      message.error('Error sending invitation');
    }
  };

  const handleApplicationSubmit = async (values: any) => {
    if (Number(job!.jobSlots) - acceptedFreelancers.length <= 0) {
      message.error('No available slots for new applicants');
      return;
    }
    const success = await handleApply(values);
    if (success) {
      setIsApplyModalVisible(false);
    }
  };


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success('Job link copied to clipboard');
  };


  // Inside ApplicantsContent
  const getLatestCoverLetter = async (applicantId: string) => {
    setIsCoverModalVisible(true)
    if (!jobId || !user) return null;

    const message = await handleCoverLetter(jobId, user.id, applicantId);
    setCoverLetter(message);
  };

  const JobDetailsContent = () => {
    if (!job) {
      return null;
    }
    const {
      ratingRecords,
      localRatings,
      isSubmittingRating,
      isRatingFinalized,
      loading: ratingLoading,
      handleRateChange,
      handleFinalizeRatings,
    } = useRating(jobId, isJobOwner);

    return (
      <Row gutter={[24, 24]}>
        {/* Main Content */}
        <Col xs={24} lg={16}>
          <Card className="mb-6">
            {/* Job Header */}
            <JobHeader job={job} onShare={handleShare} />

            {/* Job Stats */}
            <JobStats 
              job={job}
              applicantsCount={applicants.length}
              acceptedFreelancers={acceptedFreelancers}
              onInvoiceClick={() => setIsInvoiceModalVisible(true)}
            />

            {/* Job Description */}
            <JobDescription job={job} />

            {/* Job Actions */}
            <JobActions
              job={job}
              user={user}
              isJobOwner={isJobOwner}
              hasApplied={hasApplied}
              acceptedFreelancers={acceptedFreelancers}
              isStartingJob={isStartingJob}
              onApplyClick={() => setIsApplyModalVisible(true)}
              onStartJobClick={() => setIsStartJobModalVisible(true)}
              onFinishJob={handleFinishJob}
            />

            {/* Job Modals */}
            <JobModals
              job={job}
              acceptedFreelancers={acceptedFreelancers}
              walletSymbol={walletSymbol}
              selectedWalletSymbol={selectedWalletSymbol}
              setSelectedWalletSymbol={setSelectedWalletSymbol}
              isStartJobModalVisible={isStartJobModalVisible}
              setIsStartJobModalVisible={setIsStartJobModalVisible}
              isInvoiceModalVisible={isInvoiceModalVisible}
              setIsInvoiceModalVisible={setIsInvoiceModalVisible}
              onStartJob={async () => {
                await handleStartJob();
              }}
            />


            {/* Rating Section for Job Owner */}
            {isJobOwner && job.jobStatus === 'Finished' && (
              <RatingSection
                acceptedFreelancers={acceptedFreelancers}
                localRatings={localRatings}
                ratingRecords={ratingRecords}
                isSubmittingRating={isSubmittingRating}
                isRatingFinalized={isRatingFinalized}
                onRateChange={handleRateChange}
                onFinalizeRatings={handleFinalizeRatings}
              />
            )}
          </Card>
        </Col>

        {/* Sidebar */}
        <Col xs={24} lg={8}>
          <SimilarJobsSidebar similarJobs={similarJobs} />
        </Col>
      </Row>
    );
  };

  // Component for applicants content
  const ApplicantsContent = () => {
    return (
      <ApplicantsTable
        applicants={applicants}
        onAcceptApplicant={async (userId: string, values: any) => {
          const success = await handleAcceptApplicant(userId, values);
          return success;
        }}
        onRejectApplicant={async (userId: string, values: any) => {
          await handleRejectApplicant(userId, values);
          return true;
        }}
        onViewCoverLetter={getLatestCoverLetter}
        coverLetter={coverLetter}
        isFetchingLetter={isFetchingLetter}
        isCoverModalVisible={isCoverModalVisible}
        setIsCoverModalVisible={setIsCoverModalVisible}
        isAccepting={isAccepting}
        isRejecting={isRejecting}
      />
    );
  };

  // Component for accepted freelancers content
  const AcceptedContent = () => {
    return (
      <AcceptedFreelancersTable acceptedFreelancers={acceptedFreelancers} />
    );
  };

  // Component for invite users content
  const InviteContent = () => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [optionsUsers, setOptionsUsers] = useState<User[]>([]);
    const [open, setOpen] = useState(false);

    const baseUsers = (allUsers || []).filter(u => (user ? u.id !== user.id : true));

    useEffect(() => {
      setOptionsUsers(baseUsers);
    }, [allUsers, user?.id]);

    const handleSelectUser = (value: string) => {
      const found = baseUsers.find(u => u.id === value) || null;
      setSelectedUser(found);
    };

    const handleSearch = (text: string) => {
      const query = text.trim().toLowerCase();
      if (!query) {
        setOptionsUsers(baseUsers);
        return;
      }
      const filtered = baseUsers
        .filter(u => (u.username || '').toLowerCase().includes(query))
        .slice(0, 20);
      setOptionsUsers(filtered);
    };

    return (
      <Card>
        <Form
          form={inviteForm}
          layout="vertical"
          onFinish={handleInviteUser}
        >
          <Form.Item
            name="userId"
            label="Search and Select User"
            rules={[{ required: true, message: 'Please select a user to invite' }]}
          >
            <AutoComplete
              placeholder="Select a freelancer or type a username..."
              open={open}
              onSearch={handleSearch}
              onSelect={(value) => {
                handleSelectUser(value as string);
                setOpen(false);
              }}
              onFocus={async () => {
                if (!allUsers || allUsers.length === 0) {
                  await fetchAllUsers();
                }
                setOptionsUsers(baseUsers);
                setOpen(true);
              }}
              onBlur={() => setOpen(false)}
              options={optionsUsers.map(u => ({
                value: u.id,
                label: (
                  <div className="flex items-center space-x-2">
                    <Avatar
                      size="small"
                      src={u.profilePictureUrl || undefined}
                      icon={<UserOutlined />}
                    />
                    <span>{u.username}</span>
                  </div>
                )
              }))}
            />
          </Form.Item>

          {selectedUser && (
            <Card size="small" className="mb-4" title="Selected User">
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={selectedUser.profilePictureUrl || undefined}
                      icon={<UserOutlined />}
                    />
                    <div>
                      <Text strong>{selectedUser.username}</Text>
                      <div className="text-sm text-gray-500">Rating: {(Number(selectedUser.rating) / 10).toFixed(1)}</div>
                    </div>
                  </div>
                </Col>

                {selectedUser.description && (
                  <Col span={24}>
                    <Text type="secondary">
                      {selectedUser.description.length > 160
                        ? `${selectedUser.description.slice(0, 160)}...`
                        : selectedUser.description}
                    </Text>
                  </Col>
                )}

                {selectedUser.preference && selectedUser.preference.length > 0 && (
                  <Col span={24}>
                    <Space wrap>
                      {selectedUser.preference.slice(0, 5).map(tag => (
                        <Tag key={tag.id} color="blue">
                          {tag.jobCategoryName}
                        </Tag>
                      ))}
                    </Space>
                  </Col>
                )}
              </Row>
            </Card>
          )}

          <Form.Item
            name="message"
            label="Invitation Message"
            rules={[
              { required: true, message: 'Please enter an invitation message' },
              { min: 10, message: 'Message must be at least 10 characters long' },
              { max: 500, message: 'Message cannot exceed 500 characters' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder={`Hi ${selectedUser ? selectedUser.username : 'there'}, I would like to invite you to work on this job. Please let me know if you're interested!`}
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                onClick={() => {
                  inviteForm.resetFields();
                  setSelectedUser(null);
                  clearSearch();
                  setOptionsUsers(baseUsers);
                }}
              >
                Clear
              </Button>
              <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                Send Invitation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  const SubmissionContent = () => {
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [submissionHistory, setSubmissionHistory] = useState<Submission[]>([]);
    const [ownerSubmissions, setOwnerSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
      const run = async () => {
        try {
          if (user && jobId && !isJobOwner) {
            const list = await getUserSubmissionsByJobId(jobId, user.id);
            setSubmissionHistory(list);
          }
          if (isJobOwner && jobId) {
            const listOwner = await getSubmissionByJobId(jobId);
            setOwnerSubmissions(listOwner);
          }
        } catch (err) {
          console.error('Failed to load submission history', err);
        }
      };
      run();
    }, [user, jobId, isJobOwner]);

    const handleFileUpload = (info: any) => {
      let newList = [...info.fileList].slice(-1); // keep only last file
      setFileList(newList);
    };

    const beforeUpload = (file: RcFile) => {
      const validZipTypes = [
        "application/zip",
        "application/x-zip-compressed",
        "multipart/x-zip",
      ];

      const isZip = validZipTypes.includes(file.type);
      if (!isZip) {
        message.error("You can only upload ZIP files!");
      }

      return false;
    };

    const handleSubmit = async (values: any) => {
      try {
        if (!user || !jobId) {
          message.error("You must be logged in and have a valid job selected.");
          return;
        }
        if (!fileList.length || !fileList[0]?.originFileObj) {
          message.error("Please upload your submission file.");
          return;
        }

        const file = fileList[0].originFileObj as File;
        // Save the file to src/projcet_frontend/src/shared/FreelancerAnswer/{jobId}/{userId}/{filename}
        const resp = await fetch('/api/save-file', {
          method: 'POST',
          headers: {
            'x-job-id': jobId,
            'x-user-id': user.id,
            'x-filename': file.name,
          },
          body: file,
        });

        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(`Failed to save file: ${resp.status} ${errText}`);
        }

        const data = await resp.json() as { path: string };
        const relativePath = data.path; // e.g. src/projcet_frontend/src/shared/FreelancerAnswer/{jobId}/{userId}/{filename}

        // Store the relative path in canister
        const result = await createSubmission(jobId, user as any, relativePath, values.message);
        if (result[0] === "Ok") {
          message.success("Submission sent successfully!");
          form.resetFields();
          setFileList([]);
          // refresh history
          try {
            if (user && jobId) {
              const list = await getUserSubmissionsByJobId(jobId, user.id);
              setSubmissionHistory(list);
            }
          } catch (e) {
            console.warn('Failed to refresh submission history', e);
          }
        } else {
          throw new Error("Create submission did not return Ok");
        }
      } catch (e: any) {
        console.error("Submission error:", e);
        message.error(e?.message || "Failed to submit work.");
      }
    };

    // UI for Freelancer
    if (!isJobOwner) {
      // submissionHistory loaded from canister via useEffect

      return (
        <Row gutter={[16, 24]}>
          <Col xs={24} md={12}>
            <Card title="Submit Your Work">
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  name="message"
                  label="Message"
                  rules={[{ required: true, message: 'Please enter a message for your submission.' }]}
                >
                  <TextArea rows={4} placeholder="Add a message about your submission..." />
                </Form.Item>

                <Form.Item
                  name="submissionFile"
                  label="Submission File (ZIP only)"
                  rules={[{ required: true, message: 'Please upload your submission file.' }]}
                >
                  <Upload
                    beforeUpload={beforeUpload}
                    onChange={handleFileUpload}
                    fileList={fileList}
                    maxCount={1}
                  >
                    <Button icon={<PaperClipOutlined />}>Click to Upload</Button>
                  </Upload>
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SendOutlined />}>
                    Submit Work
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Submission History">
              <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '16px' }}>
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {submissionHistory.length > 0 ? (
                    submissionHistory.map((sub) => {
                      const filePath = sub.submissionFilePath || '';
                      const fileName = (filePath.split('/').pop() || 'file.zip');
                      return (
                        <Card key={sub.id} type="inner">
                          <Paragraph>{sub.submissionMessage || '-'}</Paragraph>
                          <Tag color={sub.status === 'Accept' ? 'green' : sub.status === 'Reject' ? 'red' : 'blue'}>
                            {sub.status}
                          </Tag>
                          <br />
                          <Text type="secondary">File: {fileName}</Text>
                          <br />
                          {filePath && (
                            <Button
                              href={`/api/download-file?path=${encodeURIComponent(filePath)}`}
                              download
                              icon={<PaperClipOutlined />}
                              size="small"
                              style={{ marginTop: 8 }}
                            >
                              Download File
                            </Button>
                          )}
                        </Card>
                      );
                    })
                  ) : (
                    <Text>No submission history.</Text>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        </Row>
      );
    }

    // UI for Job Owner
    const SubmitterInfo = ({ sub }: { sub: Submission }) => {
      const [submitter, setSubmitter] = useState<User | null>(null);

      useEffect(() => {
        const fetchSubmitter = async () => {
          const result = await getUserById(sub.userId);
          if (result && 'ok' in result) {
            setSubmitter(result.ok);
          }
        };
        fetchSubmitter();
      }, [sub.userId]);

      const filePath = sub.submissionFilePath || '';
      const fileName = (filePath.split('/').pop() || 'file.zip');

      return (
        <Card key={sub.id} title={`Submission from ${submitter?.username || '...'}`}>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <div className="flex items-center space-x-3">
                <Avatar icon={<UserOutlined />} />
                <div>
                  <Text strong>{submitter?.username || '...'}</Text>
                  <br />
                  <Tag color={sub.status === 'Accept' ? 'green' : sub.status === 'Reject' ? 'red' : 'blue'}>
                    {sub.status}
                  </Tag>
                </div>
              </div>
            </Col>
            <Col span={24}>
              <Title level={5}>Message:</Title>
              <Paragraph>{sub.submissionMessage || '-'}</Paragraph>
            </Col>
            <Col span={24}>
              {filePath ? (
                <Button href={`/api/download-file?path=${encodeURIComponent(filePath)}`} download icon={<PaperClipOutlined />}>
                  Download Submission ({fileName})
                </Button>
              ) : (
                <Text type="secondary">No file attached</Text>
              )}
            </Col>
            <Col span={24}>
              {sub.status === 'Waiting' && (
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={async () => {
                      try {
                        const res = await updateSubmissionStatus(sub.id, 'Accept', sub.submissionMessage || '');
                        if (res[0] === 'Ok') {
                          message.success('Submission accepted');
                          const listOwner = await getSubmissionByJobId(jobId!);
                          setOwnerSubmissions(listOwner);
                        }
                      } catch (e) {
                        message.error('Failed to accept submission');
                      }
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    danger
                    icon={<CloseOutlined />}
                    onClick={async () => {
                      try {
                        const res = await updateSubmissionStatus(sub.id, 'Reject', sub.submissionMessage || '');
                        if (res[0] === 'Ok') {
                          message.success('Submission rejected');
                          const listOwner = await getSubmissionByJobId(jobId!);
                          setOwnerSubmissions(listOwner);
                        }
                      } catch (e) {
                        message.error('Failed to reject submission');
                      }
                    }}
                  >
                    Decline
                  </Button>
                </Space>
              )}
            </Col>
          </Row>
        </Card>
      );
    }

    const submissions = ownerSubmissions;

    return (
      <Space direction="vertical" size="large" className="w-full">
        {submissions.map(sub => <SubmitterInfo key={sub.id} sub={sub} />)}
        {submissions.length === 0 && <Text>No submissions yet.</Text>}
      </Space>
    );
  };

  if (loading || localLoading ||!job) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Skeleton active />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Job Management Tabs for Job Owner */}
          {isJobOwner ? (
            <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">
              <TabPane tab="Job Details" key="details">
                <JobDetailsContent />
              </TabPane>
              <TabPane tab={`Applicants (${applicants.length})`} key="applicants">
                <ApplicantsContent />
              </TabPane>
              <TabPane tab={`Accepted (${acceptedFreelancers.length})`} key="accepted">
                <AcceptedContent />
              </TabPane>
              

              {job.jobStatus === "Open" && (
                <TabPane tab="Invite Users" key="invite">
                  <InviteContent />
                </TabPane>
              )}
              {job.jobStatus === "Ongoing" && (
                <TabPane tab="Submission Answer" key="submission">
                  <SubmissionContent />
                </TabPane>
              )}
            </Tabs>
          ) : (
            <Tabs activeKey={activeTab} onChange={setActiveTab} className="mb-6">

              <TabPane tab="Job Details" key="details">
                <JobDetailsContent />
              </TabPane>
              {isJobFreelancer && job!.jobStatus === "Ongoing" && (
                <TabPane tab="Submission Upload" key="submission">
                  <SubmissionContent />

                </TabPane>
              )}
            </Tabs>
          )}
        </motion.div>
      </div>

      {/* Apply Job Modal */}
      <ApplyJobModal
        isVisible={isApplyModalVisible}
        onCancel={() => setIsApplyModalVisible(false)}
        onSubmit={handleApplicationSubmit}
        isApplying={isApplying}
      />
    </div>
  );
};

export default JobDetailPage;
