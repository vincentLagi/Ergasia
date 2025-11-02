import React, { useState } from 'react';
import {
    Modal,
    Form,
    InputNumber,
    Button,
    message,
    Typography,
    Alert,
    Card,
} from 'antd';
import { motion } from 'framer-motion';
import {
    CreditCardOutlined,
    DollarOutlined,
    InfoCircleOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

const TopUpModal: React.FC<{
    visible: boolean;
    onClose: () => void;
    onTopUp: (amount: number) => Promise<void>;
    tokenSymbol?: string;
    loading: boolean;
}> = ({ visible, onClose, onTopUp, tokenSymbol = 'ICP', loading }) => {
    const [form] = Form.useForm();
    const [amount, setAmount] = useState<number | null>(null);
    const [topUpLoading, setTopUpLoading] = useState(false);

    const quickAmounts = [10, 25, 50, 100, 250, 500];

    const handleTopUp = async () => {
        try {
            const values = await form.validateFields();
            setTopUpLoading(true);
            await onTopUp(values.amount);
            message.success(`Successfully topped up ${values.amount} ${tokenSymbol}!`);
            form.resetFields();
            setAmount(null);
            onClose();
        } catch (error) {
            console.error('Top-up error:', error);
            message.error('Top-up failed. Please try again.');
        } finally {
            setTopUpLoading(false);
        }
    };

    const handleQuickAmount = (quickAmount: number) => {
        setAmount(quickAmount);
        form.setFieldsValue({ amount: quickAmount });
    };

    const handleCancel = () => {
        form.resetFields();
        setAmount(null);
        onClose();
    };

    return (
        <Modal
            title={null}
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width={520}
            centered
            className="top-up-modal"
            bodyStyle={{ padding: 0 }}
            maskStyle={{ backdropFilter: 'blur(8px)' }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
            >
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 rounded-t-lg">
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                            className="inline-block mb-4"
                        >
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                                <CreditCardOutlined className="text-3xl text-primary" />
                            </div>
                        </motion.div>
                        <Title level={3} className="text-foreground mb-2">
                            Top Up Your Wallet
                        </Title>
                        <Text className="text-muted-foreground">
                            Add funds to your digital wallet instantly
                        </Text>
                    </div>
                </div>
                <div className="p-8">
                    <Form form={form} layout="vertical" onFinish={handleTopUp}>
                        <div className="mb-6">
                            <Text className="text-foreground font-medium mb-3 block">
                                Quick Select Amount
                            </Text>
                            <div className="grid grid-cols-3 gap-3">
                                {quickAmounts.map((quickAmount) => (
                                    <motion.div
                                        key={quickAmount}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Button
                                            type={amount === quickAmount ? "primary" : "default"}
                                            className={`h-12 w-full font-medium ${amount === quickAmount
                                                    ? 'bg-primary border-primary'
                                                    : 'hover:border-primary hover:text-primary'
                                                }`}
                                            onClick={() => handleQuickAmount(quickAmount)}
                                        >
                                            {quickAmount} {tokenSymbol}
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <Form.Item
                            label={
                                <span className="text-foreground font-medium">
                                    Custom Amount ({tokenSymbol})
                                </span>
                            }
                            name="amount"
                            rules={[
                                { required: true, message: 'Please enter an amount' },
                                { type: 'number', min: 1, message: 'Amount must be at least 1' },
                                { type: 'number', max: 10000, message: 'Maximum amount is 10,000' },
                            ]}
                        >
                            <InputNumber
                                size="large"
                                className="w-full"
                                placeholder="Enter amount"
                                prefix={<DollarOutlined className="text-muted-foreground" />}
                                suffix={tokenSymbol}
                                min={1}
                                max={10000}
                                precision={2}
                                value={amount}
                                onChange={setAmount}
                                style={{ fontSize: '16px', padding: '12px' }}
                            />
                        </Form.Item>
                        <Alert
                            icon={<InfoCircleOutlined />}
                            message="Instant Processing"
                            description="Your top-up will be processed immediately and reflected in your wallet balance."
                            type="info"
                            showIcon
                            className="mb-6"
                        />
                        {amount && amount > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6"
                            >
                                <Card className="bg-primary/5 border-primary/20">
                                    <div className="flex justify-between items-center">
                                        <Text className="text-foreground font-medium">
                                            Amount to Add:
                                        </Text>
                                        <Text className="text-primary font-bold text-lg">
                                            +{amount.toFixed(2)} {tokenSymbol}
                                        </Text>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                        <div className="flex gap-4 pt-4">
                            <Button
                                size="large"
                                onClick={handleCancel}
                                disabled={topUpLoading || loading}
                                className="flex-1 h-12"
                            >
                                Cancel
                            </Button>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1"
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    htmlType="submit"
                                    loading={topUpLoading || loading}
                                    disabled={!amount || amount <= 0}
                                    className="w-full h-12 font-medium"
                                    icon={!topUpLoading && !loading ? <CheckCircleOutlined /> : undefined}
                                >
                                    {topUpLoading || loading ? 'Processing...' : `Top Up ${amount ? amount.toFixed(2) : '0'} ${tokenSymbol}`}
                                </Button>
                            </motion.div>
                        </div>
                    </Form>
                </div>
            </motion.div>
        </Modal>
    );
};

export default TopUpModal;