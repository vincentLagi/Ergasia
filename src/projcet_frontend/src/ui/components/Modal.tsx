import React, { memo, createContext, useContext, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal as AntModal, Button, Space } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

// Modal Context for compound component pattern
interface ModalContextType {
  onClose: () => void;
  loading?: boolean;
}

const ModalContext = createContext<ModalContextType | null>(null);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within Modal');
  }
  return context;
};

// Main Modal Component
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  loading?: boolean;
  className?: string;
  destroyOnClose?: boolean;
}

const ModalComponent: React.FC<ModalProps> = memo(({
  open,
  onClose,
  children,
  width = 520,
  centered = true,
  closable = true,
  maskClosable = true,
  loading = false,
  className = '',
  destroyOnClose = true
}) => {
  const contextValue: ModalContextType = {
    onClose,
    loading
  };

  return (
    <ModalContext.Provider value={contextValue}>
      <AntModal
        open={open}
        onCancel={onClose}
        width={width}
        centered={centered}
        closable={closable}
        maskClosable={maskClosable}
        footer={null}
        className={`custom-modal ${className}`}
        destroyOnClose={destroyOnClose}
        styles={{
          mask: {
            backdropFilter: 'blur(4px)',
          },
        }}
        modalRender={(modal) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
          >
            {modal}
          </motion.div>
        )}
      >
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </AntModal>
    </ModalContext.Provider>
  );
});

// Modal Header Component
interface ModalHeaderProps {
  children: React.ReactNode;
  closable?: boolean;
  className?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = memo(({
  children,
  closable = true,
  className = ''
}) => {
  const { onClose } = useModalContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center justify-between p-6 pb-4 ${className}`}
    >
      <div className="flex-1">
        {typeof children === 'string' ? (
          <h2 className="text-xl font-semibold text-gray-900 m-0">
            {children}
          </h2>
        ) : (
          children
        )}
      </div>
      {closable && (
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={onClose}
            className="ml-4 hover:bg-gray-100 rounded-full"
          />
        </motion.div>
      )}
    </motion.div>
  );
});

// Modal Body Component
interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

const ModalBody: React.FC<ModalBodyProps> = memo(({
  children,
  className = '',
  padding = true
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={`${padding ? 'px-6 py-4' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
});

// Modal Footer Component
interface ModalFooterProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

const ModalFooter: React.FC<ModalFooterProps> = memo(({
  children,
  className = '',
  align = 'right'
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.2 }}
      className={`flex ${alignmentClasses[align]} p-6 pt-4 border-t border-gray-100 ${className}`}
    >
      {children}
    </motion.div>
  );
});

// Modal Actions Component (for common action patterns)
interface ModalActionsProps {
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  confirmDanger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

const ModalActions: React.FC<ModalActionsProps> = memo(({
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmType = 'primary',
  confirmDanger = false,
  loading,
  disabled = false,
  className = ''
}) => {
  const { onClose, loading: contextLoading } = useModalContext();
  const isLoading = loading ?? contextLoading;

  const handleCancel = useCallback(() => {
    onCancel?.();
    onClose();
  }, [onCancel, onClose]);

  return (
    <ModalFooter className={className}>
      <Space>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
        </motion.div>
        {onConfirm && (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type={confirmType}
              danger={confirmDanger}
              onClick={onConfirm}
              loading={isLoading}
              disabled={disabled}
            >
              {confirmText}
            </Button>
          </motion.div>
        )}
      </Space>
    </ModalFooter>
  );
});

// Create the compound component
const Modal = ModalComponent as React.FC<ModalProps> & {
  Header: typeof ModalHeader;
  Body: typeof ModalBody;
  Footer: typeof ModalFooter;
  Actions: typeof ModalActions;
};

// Set display names
Modal.displayName = 'Modal';
ModalHeader.displayName = 'Modal.Header';
ModalBody.displayName = 'Modal.Body';
ModalFooter.displayName = 'Modal.Footer';
ModalActions.displayName = 'Modal.Actions';

// Attach compound components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Actions = ModalActions;

export default Modal;

// Export individual components for direct use
export { ModalHeader, ModalBody, ModalFooter, ModalActions };

// Utility hook for modal state management
export const useModal = (initialOpen = false) => {
  const [open, setOpen] = React.useState(initialOpen);
  
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const toggleModal = useCallback(() => setOpen(prev => !prev), []);
  
  return {
    open,
    openModal,
    closeModal,
    toggleModal,
    setOpen
  };
};

// Pre-built modal variants
export const ConfirmModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}> = ({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  loading = false
}) => (
  <Modal open={open} onClose={onClose} width={400}>
    <Modal.Header>{title}</Modal.Header>
    <Modal.Body>{content}</Modal.Body>
    <Modal.Actions
      onConfirm={onConfirm}
      confirmText={confirmText}
      cancelText={cancelText}
      confirmDanger={danger}
      loading={loading}
    />
  </Modal>
);