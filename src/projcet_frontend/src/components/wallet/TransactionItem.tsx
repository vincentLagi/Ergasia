import React, { useState, useEffect } from 'react';
import { List, Card, Typography, Tag, Skeleton } from 'antd';
import { motion } from 'framer-motion';
import {
    PlusCircleOutlined,
    MinusCircleOutlined,
    SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { CashFlowHistory } from '../../../../declarations/projcet_backend_single/projcet_backend_single.did';
import { useAuth } from '../../hooks/useAuth';

const { Text } = Typography;

interface TransactionItemProps {
    item: CashFlowHistory;
    index: number;
    walletSymbol?: string;
    jobAndOwnerInfo: Record<string, { jobName: string; ownerName: string }>;
    loadingJobInfo: Record<string, boolean>;
    getJobAndOwnerInfo: (jobId: string) => void;
}

const TransactionItem: React.FC<TransactionItemProps> = ({
    item,
    index,
    walletSymbol,
    jobAndOwnerInfo,
    loadingJobInfo,
    getJobAndOwnerInfo,
}) => {
    const { user } = useAuth();
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    let sign = "+";
    let color: "red" | "green" | "blue" = "green";
    let description = "";
    let icon = <PlusCircleOutlined />;

    if ("topUp" in item.transactionType) {
        description = "Account Top Up";
        sign = "+";
        color = "green";
        icon = <PlusCircleOutlined />;
    } else if ("transferToJob" in item.transactionType) {
        description = `Transfer to Job`;
        sign = "-";
        color = "red";
        icon = <SwapOutlined />;
    } else {
        const isOutgoing = item.fromId === user?.id;
        sign = isOutgoing ? "-" : "+";
        color = isOutgoing ? "red" : "green";

        if (isOutgoing) {
            description = `Sent to ${item.toId.join(", ")}`;
        } else {
            const jobId = item.fromId;
            useEffect(() => {
                if (!jobAndOwnerInfo[jobId] && !loadingJobInfo[jobId]) {
                    getJobAndOwnerInfo(jobId);
                }
            }, [jobId, jobAndOwnerInfo, loadingJobInfo, getJobAndOwnerInfo]);

            if (loadingJobInfo[jobId]) {
                description = "Loading job information...";
            } else if (jobAndOwnerInfo[jobId]) {
                const { jobName, ownerName } = jobAndOwnerInfo[jobId];
                description = `Payment from "${jobName}" by ${ownerName}`;
            } else {
                description = `Payment received from job ${jobId}`;
            }
        }
        icon = isOutgoing ? <MinusCircleOutlined /> : <PlusCircleOutlined />;
    }

    return (
        <motion.div
            key={`${item.transactionAt}-${index}`}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, x: 10 }}
            onHoverStart={() => setHoveredItem(`${item.transactionAt}-${index}`)}
            onHoverEnd={() => setHoveredItem(null)}
        >
            <List.Item style={{ padding: 0 }}>
                <Card
                    className="w-full m-2 shadow-sm border border-border hover:shadow-md transition-all duration-300"
                    style={{
                        transform: hoveredItem === `${item.transactionAt}-${index}` ? 'translateY(-2px)' : 'none'
                    }}
                    bodyStyle={{ padding: '1.5rem' }}
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                                className={`p-3 rounded-full ${color === 'green' ? 'bg-green-100 text-green-600' :
                                    color === 'red' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                    }`}
                            >
                                {React.cloneElement(icon, {
                                    className: 'text-xl'
                                })}
                            </motion.div>
                            <div>
                                {loadingJobInfo[item.fromId] && !("topUp" in item.transactionType) && !("transferToJob" in item.transactionType) && item.fromId !== user?.id ? (
                                    <Skeleton.Input
                                        active
                                        size="small"
                                        style={{ width: 200, height: 20 }}
                                        className="mb-1"
                                    />
                                ) : (
                                    <Text className="text-foreground font-semibold text-lg block">
                                        {description}
                                    </Text>
                                )}
                                <Text className="text-muted-foreground">
                                    {dayjs(Number(item.transactionAt) / 1_000_000).format("MMMM DD, YYYY • HH:mm")}
                                </Text>
                            </div>
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Tag
                                color={color}
                                className={`text-lg px-4 py-2 rounded-lg font-semibold border-0 ${color === 'green' ? 'bg-green-100 text-green-700' :
                                    color === 'red' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}
                            >
                                {`${sign}${item.amount} ${walletSymbol}`}
                            </Tag>
                        </motion.div>
                    </div>
                </Card>
            </List.Item>
        </motion.div>
    );
};

export default TransactionItem;