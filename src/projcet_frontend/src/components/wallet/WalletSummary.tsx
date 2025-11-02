import React from 'react';
import { Card, Col, Row, Skeleton, Statistic, Button, Typography } from 'antd';
import { motion } from 'framer-motion';
import {
    ArrowDownOutlined,
    ArrowUpOutlined,
    DollarOutlined,
    CreditCardOutlined,
    WalletOutlined,
} from '@ant-design/icons';
import { Token } from '../../interface/Token';

const { Title } = Typography;

interface BalanceCardsProps {
    loadingWallet: boolean;
    loadingTransactions: boolean;
    wallet: Token | undefined;
    totalIncome: number;
    totalExpenses: number;
    onTopUpClick: () => void;
}

const WalletSummary: React.FC<BalanceCardsProps> = ({
    loadingWallet,
    loadingTransactions,
    wallet,
    totalIncome,
    totalExpenses,
    onTopUpClick,
}) => {
    return (
        <div className='mb-8'>
            <Card
                className="mb-8 shadow-sm border border-border"
                title={
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <WalletOutlined className="text-xl text-primary" />
                            <Title level={4} className="mt-2 text-foreground">
                                Wallet Overview
                            </Title>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button
                                type="primary"
                                icon={<CreditCardOutlined />}
                                onClick={onTopUpClick}
                            >
                                Top Up Wallet
                            </Button>
                        </motion.div>
                    </div>
                }
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                        <motion.div
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <Card className="text-center bg-background h-full">
                                <DollarOutlined className="text-4xl text-primary mb-3" />
                                {loadingWallet ? (
                                    <Skeleton active paragraph={{ rows: 1 }} />
                                ) : (
                                    <Statistic
                                        title={
                                            <span className="text-muted-foreground">
                                                Current Balance
                                            </span>
                                        }
                                        value={
                                            wallet?.token_value.toFixed(2) ||
                                            '0.00'
                                        }
                                        suffix={wallet?.token_symbol || 'ICP'}
                                        valueStyle={{
                                            color: 'hsl(var(--foreground))',
                                            fontSize: '2rem',
                                            fontWeight: 'bold',
                                        }}
                                    />
                                )}
                            </Card>
                        </motion.div>
                    </Col>

                    <Col xs={24} md={8}>
                        <motion.div
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <Card className="text-center bg-background h-full">
                                <ArrowUpOutlined className="text-4xl text-green-500 mb-3" />
                                {loadingTransactions ? (
                                    <Skeleton active paragraph={{ rows: 1 }} />
                                ) : (
                                    <Statistic
                                        title={
                                            <span className="text-muted-foreground">
                                                Monthly Income
                                            </span>
                                        }
                                        value={totalIncome.toFixed(2)}
                                        suffix={wallet?.token_symbol || 'ICP'}
                                        valueStyle={{
                                            color: '#16a34a',
                                            fontSize: '1.5rem',
                                        }}
                                    />
                                )}
                            </Card>
                        </motion.div>
                    </Col>

                    <Col xs={24} md={8}>
                        <motion.div
                            whileHover={{ y: -5, scale: 1.02 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                        >
                            <Card className="text-center bg-background h-full">
                                <ArrowDownOutlined className="text-4xl text-red-500 mb-3" />
                                {loadingTransactions ? (
                                    <Skeleton active paragraph={{ rows: 1 }} />
                                ) : (
                                    <Statistic
                                        title={
                                            <span className="text-muted-foreground">
                                                Monthly Expenses
                                            </span>
                                        }
                                        value={totalExpenses.toFixed(2)}
                                        suffix={wallet?.token_symbol || 'ICP'}
                                        valueStyle={{
                                            color: '#dc2626',
                                            fontSize: '1.5rem',
                                        }}
                                    />
                                )}
                            </Card>
                        </motion.div>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default WalletSummary;
