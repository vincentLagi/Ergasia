import React from 'react';
import { Card, Skeleton, Typography } from 'antd';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Line } from 'recharts';
import { LineChartOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface ChartData {
    month: string;
    balance: number;
    income: number;
    expenses: number;
}

interface BalanceChartProps {
    loading: boolean;
    chartData: ChartData[];
    walletSymbol?: string;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ loading, chartData, walletSymbol }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
        >
            <Card
                title={
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center">
                            </div>
                            <span className="text-foreground text-2xl font-bold">Balance Progress</span>
                        </div>
                    </div>
                }
                className="shadow-xl border-2 border-border hover:border-primary/30 transition-all duration-300 rounded-2xl overflow-hidden"
                bodyStyle={{ padding: '2rem' }}
            >
                <div className="h-96">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <Skeleton.Input active style={{ width: '100%', height: '300px' }} />
                        </div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <defs>
                                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1890ff" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1890ff" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="month"
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="#666"
                                    fontSize={12}
                                    tickLine={false}
                                    tickFormatter={(value) => `${value} ${walletSymbol || 'ICP'}`}
                                />
                                <RechartsTooltip
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                        padding: '16px'
                                    }}
                                    formatter={(value: any, name: string) => [
                                        `${Number(value).toFixed(2)} ${walletSymbol || 'ICP'}`,
                                        name === 'balance' ? 'Balance' :
                                            name === 'income' ? 'Income' :
                                                name === 'expenses' ? 'Expenses' : 'Net'
                                    ]}
                                    labelFormatter={(label) => `Month: ${label}`}
                                />
                                <Legend
                                    wrapperStyle={{ paddingTop: '20px' }}
                                    iconType="circle"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="balance"
                                    stroke="#1890ff"
                                    strokeWidth={3}
                                    fill="url(#balanceGradient)"
                                    name="Balance"
                                    dot={{ fill: '#1890ff', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, stroke: '#1890ff', strokeWidth: 2, fill: 'white' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#52c41a"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Monthly Income"
                                    dot={false}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expenses"
                                    stroke="#ff4d4f"
                                    strokeWidth={2}
                                    strokeDasharray="5 5"
                                    name="Monthly Expenses"
                                    dot={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200 }}
                                className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6"
                            >
                                <LineChartOutlined className="text-3xl text-gray-400" />
                            </motion.div>
                            <Text className="text-muted-foreground text-lg">
                                No transaction data available for the selected period
                            </Text>
                            <Text className="text-muted-foreground">
                                Make your first transaction to see the balance chart
                            </Text>
                        </div>
                    )}
                </div>
            </Card>
        </motion.div>
    );
};

export default BalanceChart;