import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  size?: 'small' | 'default' | 'large';
  className?: string;
  zIndex?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  message = 'Loading...',
  size = 'large',
  className = '',
  zIndex = 1000
}) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center ${className}`}
          style={{ zIndex: Math.max(zIndex, 10000) }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex flex-col items-center space-y-4"
          >
            <Spin
              size={size}
              tip={message}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingOverlay;
