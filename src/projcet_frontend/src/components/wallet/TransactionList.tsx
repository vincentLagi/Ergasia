import React from 'react';
import { List } from 'antd';
import { CashFlowHistory } from '../../../../declarations/projcet_backend_single/projcet_backend_single.did';
import TransactionItem from './TransactionItem';

interface TransactionListProps {
    transactions: CashFlowHistory[];
    loading: boolean;
    emptyMessage: string;
    walletSymbol?: string;
    jobAndOwnerInfo: Record<string, { jobName: string; ownerName: string }>;
    loadingJobInfo: Record<string, boolean>;
    getJobAndOwnerInfo: (jobId: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({
    transactions,
    loading,
    emptyMessage,
    walletSymbol,
    jobAndOwnerInfo,
    loadingJobInfo,
    getJobAndOwnerInfo,
}) => (
    <List
        loading={loading}
        dataSource={transactions}
        locale={{ emptyText: emptyMessage }}
        renderItem={(item, index) => (
            <TransactionItem
                item={item}
                index={index}
                walletSymbol={walletSymbol}
                jobAndOwnerInfo={jobAndOwnerInfo}
                loadingJobInfo={loadingJobInfo}
                getJobAndOwnerInfo={getJobAndOwnerInfo}
            />
        )}
    />
);

export default TransactionList;