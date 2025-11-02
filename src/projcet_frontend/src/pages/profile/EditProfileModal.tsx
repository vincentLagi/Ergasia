import React from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Upload,
  Button,
  Avatar,
  Row,
  Col,
  DatePicker,
} from 'antd';
import { UserOutlined, CameraOutlined } from '@ant-design/icons';
import { User } from '../../shared/types/User';
import { JobCategory } from '../../shared/types/Job';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

interface EditProfileModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (values: any) => void;
  user: User;
  profileImage: string | null;
  handleAvatarUpload: (options: any) => void;
  mockJobCategories: JobCategory[];
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onCancel,
  onSave,
  user,
  profileImage,
  handleAvatarUpload,
  mockJobCategories,
}) => {
  const [form] = Form.useForm();

  React.useEffect(() => {
    if (user) {
      form.setFieldsValue({
        ...user,
        dob: user.dob ? dayjs(user.dob) : null,
        preference: user.preference?.map(p => p.id) || [],
      });
    }
  }, [user, form]);

  return (
    <Modal
      title="Edit Profile"
      open={open}
      onCancel={onCancel}
      footer={null}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={onSave}>
        <Row gutter={[24, 24]}>
          <Col span={24} className="text-center mb-8">
            <div className="space-y-4">
              <Upload
                customRequest={handleAvatarUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Avatar size={120} src={profileImage} icon={<UserOutlined />} className="cursor-pointer" />
              </Upload>
              <div>
                <Button icon={<CameraOutlined />} type="dashed">
                  Change Photo
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Click to upload a new profile picture (optional)
                </p>
              </div>
            </div>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item 
              name="username" 
              label="Username" 
              rules={[{ required: true, message: 'Please enter your username' }]}
            >
              <Input placeholder="Enter your username" />
            </Form.Item>
          </Col>
          
          <Col xs={24} sm={12}>
            <Form.Item 
              name="dob" 
              label="Date of Birth" 
              rules={[{ required: true, message: 'Please select your date of birth' }]}
            >
              <DatePicker className="w-full" placeholder="Select your date of birth" />
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item 
              name="description" 
              label="Description" 
              rules={[{ required: true, message: 'Please enter a description' }]}
            >
              <TextArea 
                rows={4} 
                placeholder="Tell us about yourself, your skills, and experience..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>
          
          <Col span={24}>
            <Form.Item 
              name="preference" 
              label="Skills & Interests" 
              rules={[{ required: true, message: 'Please select at least one skill' }]}
            >
              <Select 
                mode="multiple" 
                placeholder="Select your skills and interests"
                size="large"
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              >
                {mockJobCategories.map(cat => (
                  <Option key={cat.id} value={cat.id}>
                    {cat.jobCategoryName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        
        <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <Button onClick={onCancel} size="large">
            Cancel
          </Button>
          <Button type="primary" htmlType="submit" size="large">
            Save Changes
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditProfileModal;