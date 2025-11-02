import React from 'react';
import { Typography } from 'antd';

const { Text } = Typography;

interface TokenBalanceProps {
  tokenCount: number;
  size?: 'sm' | 'md';
  className?: string;
}

const TokenBalance: React.FC<TokenBalanceProps> = ({ 
  tokenCount, 
  size = 'md',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-sm'
  };

  return (
    <div className={`bg-gradient-to-br from-blue-500/50 to-purple-500/50 border border-cyan-500/30 px-3 py-1 rounded-full ${className}`}>
      <Text className={`text-cyan-50 ${sizeStyles[size]} font-medium`}>
        🪙 {tokenCount} tokens
      </Text>
    </div>
  );
};

export default TokenBalance;
