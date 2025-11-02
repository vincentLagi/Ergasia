import React from 'react';
import { Modal, Typography, Button, Select, Table, Tag } from 'antd';
import { Job } from '../../shared/types/Job';
import { User } from '../../shared/types/User';
import dayjs from "dayjs";

const { Paragraph, Title } = Typography;
const { Option } = Select;

interface JobModalsProps {
  job: Job | null;
  acceptedFreelancers: User[];
  walletSymbol: string;
  selectedWalletSymbol: string;
  setSelectedWalletSymbol: (symbol: string) => void;
  isStartJobModalVisible: boolean;
  setIsStartJobModalVisible: (visible: boolean) => void;
  isInvoiceModalVisible: boolean;
  setIsInvoiceModalVisible: (visible: boolean) => void;
  onStartJob: () => Promise<void>;
}

const JobModals: React.FC<JobModalsProps> = ({
  job,
  acceptedFreelancers,
  walletSymbol,
  selectedWalletSymbol,
  setSelectedWalletSymbol,
  isStartJobModalVisible,
  setIsStartJobModalVisible,
  isInvoiceModalVisible,
  setIsInvoiceModalVisible,
  onStartJob
}) => {
  const columns = [
    {
      title: "Freelancer",
      dataIndex: "name",
      key: "name",
    },
    {
      title: `Amount (${walletSymbol})`,
      dataIndex: "amount",
      key: "amount",
    },
  ];

  const data = acceptedFreelancers.map((f, index) => ({
    key: index,
    name: f.username || `Freelancer ${index + 1}`,
    amount: job ? (job.jobSalary).toLocaleString() : 'N/A',
  }));

  return (
    <>
      {/* Start Job Modal */}
      <Modal
        title="Start Job"
        open={isStartJobModalVisible}
        onCancel={() => setIsStartJobModalVisible(false)}
        width={600}
        footer={null}
      >
        {job && (
          <div>
            <Paragraph>
              Are you sure you want to start this job? Once started, your wallet will be
              charged {job.jobSalary * acceptedFreelancers.length}{" "}
              <strong>{selectedWalletSymbol}</strong>, the job status will change to
              "Ongoing" and freelancers can begin their work.
            </Paragraph>

            <div className="mb-4">
              <span className="mr-2 font-semibold">Choose Wallet:</span>
              <Select
                value={selectedWalletSymbol}
                style={{ width: 160 }}
                onChange={(value) => setSelectedWalletSymbol(value)}
              >
                <Option value={walletSymbol}>{walletSymbol}</Option>
              </Select>
            </div>

            <div className="text-right">
              <Button
                type="primary"
                onClick={async () => {
                  console.log('🚀 Start Job clicked. Job data:', job);
                  if (!job) {
                    console.error('❌ Job is null when trying to start job');
                    return;
                  }
                  setIsStartJobModalVisible(false);
                  await onStartJob();
                  setIsInvoiceModalVisible(false);
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invoice Modal */}
      <Modal
        title="Invoice"
        open={isInvoiceModalVisible}
        onCancel={() => setIsInvoiceModalVisible(false)}
        width={700}
        footer={null}
      >
        {job && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-3">
              <Paragraph className="m-0">
                <strong>Status:</strong>{" "}
                <Tag color="green" className="ml-2">PAID</Tag>
              </Paragraph>
              <Paragraph className="m-0 text-gray-500">
                <strong>Date:</strong> {dayjs().format("YYYY-MM-DD HH:mm:ss")}
              </Paragraph>
            </div>

            <div>
              <Title level={5} className="mb-3">Freelancers</Title>
              <Table
                columns={columns}
                dataSource={data}
                pagination={false}
                bordered
                size="middle"
              />
            </div>

            <div className="flex justify-end border-t pt-3">
              <Paragraph className="text-lg font-semibold m-0">
                Total: {job.jobSalary / acceptedFreelancers.length} {walletSymbol}
              </Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default JobModals;
