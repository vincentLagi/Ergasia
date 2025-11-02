import React from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ApplyJobModalProps {
  isVisible: boolean;
  onCancel: () => void;
  onSubmit: (values: any) => Promise<void>;
  isApplying: boolean;
}

const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  isVisible,
  onCancel,
  onSubmit,
  isApplying
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      title="Apply for this Job"
      open={isVisible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="coverLetter"
          label="Cover Letter"
          rules={[{ required: true, message: 'Please write a cover letter' }]}
        >
          <TextArea
            rows={6}
            placeholder="Explain why you're the perfect fit for this job..."
            maxLength={1000}
            showCount
          />
        </Form.Item>

        <div className="flex justify-end space-x-2">
          <Button onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isApplying}
            icon={<SendOutlined />}
          >
            Submit Application
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default ApplyJobModal;
