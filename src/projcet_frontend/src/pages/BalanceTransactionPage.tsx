import React from 'react';
import { Card, Typography, Skeleton, DatePicker, Tabs } from 'antd';
import { motion } from 'framer-motion';
import { WalletOutlined, TransactionOutlined } from '@ant-design/icons';
import Navbar from '../ui/components/Navbar';
import { useWallet } from '../hooks/useWallet';
import WalletSummary from '../components/wallet/WalletSummary'; // <-- Import the new component
import BalanceChart from '../components/wallet/BalanceChart';
import TransactionList from '../components/wallet/TransactionList';
import TopUpModal from '../components/wallet/TopUpModal';

const { Title, Text } = Typography;

const BalanceTransactionPage: React.FC = () => {
    // The hook now manages all state and logic
    const {
        user,
        isLoading,
        wallet,
        loadingWallet,
        totalIncome,
        totalExpenses,
        loadingTransactions,
        chartData,
        walletSymbol,
        filteredTransactions,
        incomingTransactions,
        outgoingTransactions,
        selectedMonth,
        setSelectedMonth,
        topUpModalVisible,
        setTopUpModalVisible,
        handleTopUp,
        topUpLoading,
        jobAndOwnerInfo,
        loadingJobInfo,
        getJobAndOwnerInfo,
    } = useWallet();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <Skeleton active paragraph={{ rows: 10 }} />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="flex items-center justify-center min-h-[80vh]">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <WalletOutlined className="text-6xl text-primary mb-4" />
                        <Title level={2} className="text-foreground">
                            Please log in to view your wallet
                        </Title>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    {/* Header */}
                    <motion.div
                        className="text-center mb-8"
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Title level={1} className="text-foreground mb-2">
                            Digital Wallet
                        </Title>
                        <Text className="text-muted-foreground text-lg">
                            Manage your finances with ease
                        </Text>
                    </motion.div>

                    {/* New WalletSummary Component */}
                    <WalletSummary
                        loadingWallet={loadingWallet}
                        loadingTransactions={loadingTransactions}
                        wallet={wallet}
                        totalIncome={totalIncome}
                        totalExpenses={totalExpenses}
                        onTopUpClick={() => setTopUpModalVisible(true)}
                    />

                    {/* Balance Chart Component */}
                    <BalanceChart
                        loading={loadingTransactions}
                        chartData={chartData}
                        walletSymbol={walletSymbol}
                    />

                    {/* Transaction History */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card
                            title={
                                <div className="flex items-center gap-3">
                                    <TransactionOutlined className="text-xl text-primary" />
                                    <span className="text-foreground text-xl font-semibold">
                                        Transaction History
                                    </span>
                                    <DatePicker
                                        picker="month"
                                        value={selectedMonth}
                                        onChange={setSelectedMonth}
                                        placeholder="Select month"
                                        allowClear
                                        className="w-44"
                                    />
                                </div>
                            }
                            className="shadow-sm border border-border px-12"
                        >
                            <Tabs
                                defaultActiveKey="all"
                                className="mx-6"
                                items={[
                                    {
                                        key: 'all',
                                        label: `All Transactions (${filteredTransactions?.length})`,
                                        children: (
                                            <TransactionList
                                                transactions={
                                                    filteredTransactions
                                                }
                                                loading={loadingTransactions}
                                                emptyMessage={
                                                    selectedMonth
                                                        ? `No transactions found for ${selectedMonth.format(
                                                              'MMMM YYYY'
                                                          )}.`
                                                        : 'No transactions yet.'
                                                }
                                                walletSymbol={walletSymbol}
                                                jobAndOwnerInfo={
                                                    jobAndOwnerInfo
                                                }
                                                loadingJobInfo={loadingJobInfo}
                                                getJobAndOwnerInfo={
                                                    getJobAndOwnerInfo
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        key: 'incoming',
                                        label: `Income (${incomingTransactions?.length})`,
                                        children: (
                                            <TransactionList
                                                transactions={
                                                    incomingTransactions
                                                }
                                                loading={loadingTransactions}
                                                emptyMessage={
                                                    selectedMonth
                                                        ? `No incoming transactions for ${selectedMonth.format(
                                                              'MMMM YYYY'
                                                          )}.`
                                                        : 'No incoming transactions yet.'
                                                }
                                                walletSymbol={walletSymbol}
                                                jobAndOwnerInfo={
                                                    jobAndOwnerInfo
                                                }
                                                loadingJobInfo={loadingJobInfo}
                                                getJobAndOwnerInfo={
                                                    getJobAndOwnerInfo
                                                }
                                            />
                                        ),
                                    },
                                    {
                                        key: 'outgoing',
                                        label: `Expenses (${outgoingTransactions?.length})`,
                                        children: (
                                            <TransactionList
                                                transactions={
                                                    outgoingTransactions
                                                }
                                                loading={loadingTransactions}
                                                emptyMessage={
                                                    selectedMonth
                                                        ? `No outgoing transactions for ${selectedMonth.format(
                                                              'MMMM YYYY'
                                                          )}.`
                                                        : 'No outgoing transactions yet.'
                                                }
                                                walletSymbol={walletSymbol}
                                                jobAndOwnerInfo={
                                                    jobAndOwnerInfo
                                                }
                                                loadingJobInfo={loadingJobInfo}
                                                getJobAndOwnerInfo={
                                                    getJobAndOwnerInfo
                                                }
                                            />
                                        ),
                                    },
                                ]}
                            />
                        </Card>
                    </motion.div>
                </motion.div>
            </div>

            {/* Top-up Modal Component */}
            <TopUpModal
                visible={topUpModalVisible}
                onClose={() => setTopUpModalVisible(false)}
                onTopUp={handleTopUp}
                tokenSymbol={walletSymbol}
                loading={topUpLoading}
            />
        </div>
    );
};

export default BalanceTransactionPage;
