import React, { useState } from 'react';
import {
    Modal,
    Form,
    Select,
    Input,
    Button,
    Space,
    Typography,
    Tag,
    Card,
    message,
    Row,
    Col
} from 'antd';
import { SendOutlined, DollarOutlined, CalendarOutlined, TagOutlined } from '@ant-design/icons';
import { Job } from '../../shared/types/Job';
import { formatDate } from '../../utils/dateUtils';
import { createInvitation } from '../../controller/invitationController';
import { User } from '../../shared/types/User';
import { useAuth } from '../../hooks/useAuth';
import { useUserManagement } from '../../shared/hooks';


const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;

interface InviteModalProps {
    visible: boolean;
    onCancel: () => void;
    jobs: Job[];
    freelancer: User;
}

const InviteModal: React.FC<InviteModalProps> = ({
    visible,
    onCancel,
    jobs,
    freelancer
}) => {
    const [form] = Form.useForm();
    const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const { sendInvitation } = useUserManagement();
    const selectedJob = jobs.find(job => job.id === selectedJobId);
    const { user } = useAuth();
    
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setIsLoading(true);

            if(user){

                sendInvitation(freelancer.id, user?.id,values.jobId)
            }else{

                message.error('Failed to send invitation. Please Login.');
            }


            form.resetFields();
            setSelectedJobId(undefined);
            onCancel();
        } catch (error) {
            console.error('Failed to send invitation:', error);
            message.error('Failed to send invitation. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedJobId(undefined);
        onCancel();
    };

    const formatSalary = (salary: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(salary);
    };

    return (
        <Modal
            title={
                <Space>
                    <SendOutlined />
                    <span>Invite {freelancer.username} to Job</span>
                </Space>
            }
            open={visible}
            onCancel={handleCancel}
            width={700}
            footer={[
                <Button key="cancel" onClick={handleCancel}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    icon={<SendOutlined />}
                    loading={isLoading}
                    onClick={handleSubmit}
                >
                    Send Invitation
                </Button>,
            ]}
        >
            <Form
                form={form}
                layout="vertical"
                requiredMark={false}
            >
                <Form.Item
                    label="Select Job"
                    name="jobId"
                    rules={[{ required: true, message: 'Please select a job' }]}
                >
                    <Select
                        placeholder="Choose a job to invite the user for"
                        onChange={setSelectedJobId}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {jobs.map((job) => (
                            <Option key={job.id} value={job.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{job.jobName}</span>
                                    <Text type="secondary">{formatSalary(job.jobSalary)}</Text>
                                </div>
                            </Option>
                        ))}
                    </Select>
                </Form.Item>

                {selectedJob && (
                    <Card
                        size="small"
                        className="mb-4"
                        title={<Text strong>Job Details</Text>}
                    >
                        <Row gutter={[16, 8]}>
                            <Col span={24}>
                                <Title level={5} className="mb-2">{selectedJob.jobName}</Title>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Space>
                                    <DollarOutlined />
                                    <Text>Budget: {formatSalary(selectedJob.jobSalary)}</Text>
                                </Space>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Space>
                                    <CalendarOutlined />
                                    <Text>Created: {formatDate(selectedJob.createdAt)}</Text>
                                </Space>
                            </Col>
                            <Col span={24}>
                                <Space>
                                    <TagOutlined />
                                    <span>Tags:</span>
                                </Space>
                                <div className="mt-1">
                                    {selectedJob.jobTags.map((tag) => (
                                        <Tag key={tag.id} color="blue">
                                            {tag.jobCategoryName}
                                        </Tag>
                                    ))}
                                </div>
                            </Col>
                            {selectedJob.jobDescription && selectedJob.jobDescription.length > 0 && (
                                <Col span={24}>
                                    <Text type="secondary">
                                        {selectedJob.jobDescription[0]}
                                        {selectedJob.jobDescription.length > 1 && '...'}
                                    </Text>
                                </Col>
                            )}
                        </Row>
                    </Card>
                )}

                <Form.Item
                    label="Invitation Message"
                    name="message"
                    rules={[
                        { required: true, message: 'Please enter an invitation message' },
                        { min: 10, message: 'Message must be at least 10 characters long' },
                        { max: 500, message: 'Message cannot exceed 500 characters' }
                    ]}
                >
                    <TextArea
                        rows={4}
                        placeholder={`Hi ${freelancer.username}, I would like to invite you to work on this project. Please let me know if you're interested!`}
                        showCount
                        maxLength={500}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default InviteModal;