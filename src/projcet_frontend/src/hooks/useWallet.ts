import { useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useAuth } from './useAuth';
import { getUserTransaction, getUserById } from '../controller/userController';
import { getJobById } from '../controller/jobController';
import {
    getBalanceController,
    topUpWalletController,
} from '../controller/tokenController';
import { CashFlowHistory } from '../../../declarations/projcet_backend_single/projcet_backend_single.did';
import { Token } from '../interface/Token';

export const useWallet = () => {
    // isLoading from useAuth is the primary loading state for the user object
    const { user, isLoading } = useAuth();
    const [transactions, setTransactions] = useState<CashFlowHistory[]>([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [jobAndOwnerInfo, setJobAndOwnerInfo] = useState<
        Record<string, { jobName: string; ownerName: string }>
    >({});
    const [loadingJobInfo, setLoadingJobInfo] = useState<
        Record<string, boolean>
    >({});
    const [loadingWallet, setLoadingWallet] = useState(true);
    const [wallet, setWallet] = useState<Token>();
    const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(
        dayjs()
    );
    const [chartPeriod, setChartPeriod] = useState<'3m' | '6m' | '1y' | 'all'>(
        '6m'
    );
    const [topUpModalVisible, setTopUpModalVisible] = useState(false);
    const [topUpLoading, setTopUpLoading] = useState(false);

    const fetchWalletData = async () => {
        if (!user) return;

        setLoadingWallet(true);
        try {
            const walletData = await getBalanceController(user);
            setWallet(walletData as Token);
        } catch (err) {
            console.error('Failed to fetch wallet data:', err);
            message.error('Failed to load wallet data');
        } finally {
            setLoadingWallet(false);
        }
    };

    const fetchTransactions = async () => {
        if (!user) return;

        setLoadingTransactions(true);
        try {
            const history = await getUserTransaction(user.id);
            console.log('Transaction history:', history);
            setTransactions(history as CashFlowHistory[]);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
            message.error('Failed to load transaction history');
        } finally {
            setLoadingTransactions(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (user) {
                await Promise.all([fetchWalletData(), fetchTransactions()]);
            }
        };

        fetchData();
    }, [user]);

    const getJobAndOwnerInfo = async (jobId: string) => {
        setLoadingJobInfo((prev) => ({ ...prev, [jobId]: true }));
        try {
            const job = await getJobById(jobId);
            if (!job) return;

            const owner = await getUserById(job.userId);
            const ownerName = (owner && "ok" in owner) ? owner.ok.username : 'Unknown Owner';

            setJobAndOwnerInfo((prev) => ({
                ...prev,
                [jobId]: { jobName: job.jobName, ownerName },
            }));
        } catch (err) {
            console.error(
                `Failed to fetch job and owner info for ${jobId}`,
                err
            );
        } finally {
            setLoadingJobInfo((prev) => ({ ...prev, [jobId]: false }));
        }
    };


    const handleTopUp = async (amount: number) => {
        if (!user?.id) {
            message.error('User not found');
            return;
        }

        setTopUpLoading(true);
        try {
            await topUpWalletController(user, amount);
            await Promise.all([fetchWalletData(), fetchTransactions()]);
            message.success(
                `Successfully topped up ${amount} ${
                    wallet?.token_symbol || 'ICP'
                }!`
            );
        } catch (error) {
            console.error('Top-up failed:', error);
            message.error('Top-up failed. Please try again.');
            throw error;
        } finally {
            setTopUpLoading(false);
        }
    };

    const filteredTransactions = useMemo(
        () =>
            transactions.filter((tx) => {
                if (!selectedMonth) return true;
                const transactionDate = dayjs(
                    Number(tx.transactionAt) / 1_000_000
                );
                return transactionDate.isSame(selectedMonth, 'month');
            }),
        [transactions, selectedMonth]
    );

    // **MOVED LOGIC INTO HOOK**
    const incomingTransactions = useMemo(
        () =>
            filteredTransactions.filter((tx) => {
                if ('topUp' in tx.transactionType) return true;
                return tx.fromId !== user?.id;
            }),
        [filteredTransactions, user?.id]
    );

    const outgoingTransactions = useMemo(
        () =>
            filteredTransactions.filter((tx) => {
                if ('transferToJob' in tx.transactionType) return true;
                return (
                    tx.fromId === user?.id && !('topUp' in tx.transactionType)
                );
            }),
        [filteredTransactions, user?.id]
    );

    const { totalIncome, totalExpenses } = useMemo(() => {
        let income = 0;
        let expenses = 0;
        filteredTransactions.forEach((tx) => {
            if ('topUp' in tx.transactionType || tx.fromId !== user?.id) {
                income += tx.amount;
            } else {
                expenses += tx.amount;
            }
        });
        return { totalIncome: income, totalExpenses: expenses };
    }, [filteredTransactions, user?.id]);

    const chartData = useMemo(() => {
        // Chart data calculation logic remains the same...
        if (!transactions.length) return [];
        const sortedTransactions = [...transactions].sort(
            (a, b) => Number(a.transactionAt) - Number(b.transactionAt)
        );
        const now = dayjs();
        let startDate;
        switch (chartPeriod) {
            case '3m':
                startDate = now.subtract(3, 'months');
                break;
            case '6m':
                startDate = now.subtract(6, 'months');
                break;
            case '1y':
                startDate = now.subtract(1, 'year');
                break;
            default:
                startDate =
                    sortedTransactions.length > 0
                        ? dayjs(
                              Number(sortedTransactions[0].transactionAt) /
                                  1_000_000
                          )
                        : now.subtract(6, 'months');
        }
        const monthlyData = new Map<
            string,
            {
                income: number;
                expenses: number;
                balance: number;
                transactions: number;
            }
        >();
        let cumulativeBalance = 0;
        let current = startDate.startOf('month');
        while (current.isBefore(now) || current.isSame(now, 'month')) {
            const monthKey = current.format('YYYY-MM');
            monthlyData.set(monthKey, {
                income: 0,
                expenses: 0,
                balance: 0,
                transactions: 0,
            });
            current = current.add(1, 'month');
        }
        sortedTransactions.forEach((tx) => {
            const txDate = dayjs(Number(tx.transactionAt) / 1_000_000);
            if (txDate.isBefore(startDate)) {
                if ('topUp' in tx.transactionType || tx.fromId !== user?.id)
                    cumulativeBalance += tx.amount;
                else cumulativeBalance -= tx.amount;
                return;
            }
            const monthKey = txDate.format('YYYY-MM');
            const monthData = monthlyData.get(monthKey);
            if (monthData) {
                if ('topUp' in tx.transactionType || tx.fromId !== user?.id)
                    monthData.income += tx.amount;
                else monthData.expenses += tx.amount;
                monthData.transactions += 1;
            }
        });
        const chartArray: any[] = [];
        let runningBalance = cumulativeBalance;
        monthlyData.forEach((data, monthKey) => {
            runningBalance += data.income - data.expenses;
            chartArray.push({
                month: dayjs(monthKey).format('MMM YY'),
                balance: Math.max(0, runningBalance),
                income: data.income,
                expenses: data.expenses,
            });
        });
        return chartArray;
    }, [transactions, chartPeriod, user?.id]);

    // **ADDED DERIVED STATE**
    const walletSymbol = useMemo(() => wallet?.token_symbol || 'ICP', [wallet]);

    return {
        user,
        isLoading, // **ADDED**
        wallet,
        loadingWallet,
        totalIncome,
        totalExpenses,
        loadingTransactions,
        chartData,
        walletSymbol, // **ADDED**
        filteredTransactions,
        incomingTransactions, // **ADDED**
        outgoingTransactions, // **ADDED**
        selectedMonth,
        setSelectedMonth,
        topUpModalVisible,
        setTopUpModalVisible,
        handleTopUp,
        topUpLoading,
        jobAndOwnerInfo,
        loadingJobInfo,
        getJobAndOwnerInfo,
        setChartPeriod,
    };
};
