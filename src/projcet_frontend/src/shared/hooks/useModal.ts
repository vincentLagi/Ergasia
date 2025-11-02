import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { activeModalAtom, modalDataAtom } from '../../app/store/ui';

export interface UseModalReturn {
  activeModal: string | null;
  modalData: any;
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  isModalOpen: (modalId: string) => boolean;
}

export const useModal = (): UseModalReturn => {
  const [activeModal, setActiveModal] = useAtom(activeModalAtom);
  const [modalData, setModalData] = useAtom(modalDataAtom);

  const openModal = useCallback((modalId: string, data?: any) => {
    setActiveModal(modalId);
    setModalData(data || null);
    
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  }, [setActiveModal, setModalData]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalData(null);
    
    // Restore body scrolling when modal is closed
    document.body.style.overflow = 'auto';
  }, [setActiveModal, setModalData]);

  const isModalOpen = useCallback((modalId: string) => {
    return activeModal === modalId;
  }, [activeModal]);

  return {
    activeModal,
    modalData,
    openModal,
    closeModal,
    isModalOpen,
  };
};

// Specific modal hooks for common modals
export const useAuthModal = () => {
  const { openModal, closeModal, isModalOpen } = useModal();
  
  return {
    openLoginModal: () => openModal('login'),
    openRegisterModal: () => openModal('register'),
    openForgotPasswordModal: () => openModal('forgotPassword'),
    closeAuthModal: closeModal,
    isLoginModalOpen: isModalOpen('login'),
    isRegisterModalOpen: isModalOpen('register'),
    isForgotPasswordModalOpen: isModalOpen('forgotPassword'),
  };
};

export const useJobModal = () => {
  const { openModal, closeModal, isModalOpen, modalData } = useModal();
  
  return {
    openJobDetailModal: (jobId: string) => openModal('jobDetail', { jobId }),
    openJobApplicationModal: (jobId: string) => openModal('jobApplication', { jobId }),
    openJobEditModal: (jobId: string) => openModal('jobEdit', { jobId }),
    closeJobModal: closeModal,
    isJobDetailModalOpen: isModalOpen('jobDetail'),
    isJobApplicationModalOpen: isModalOpen('jobApplication'),
    isJobEditModalOpen: isModalOpen('jobEdit'),
    jobModalData: modalData,
  };
};

export const useConfirmModal = () => {
  const { openModal, closeModal, isModalOpen, modalData } = useModal();
  
  return {
    openConfirmModal: (config: {
      title: string;
      message: string;
      onConfirm: () => void;
      onCancel?: () => void;
      confirmText?: string;
      cancelText?: string;
      type?: 'warning' | 'danger' | 'info';
    }) => openModal('confirm', config),
    closeConfirmModal: closeModal,
    isConfirmModalOpen: isModalOpen('confirm'),
    confirmModalData: modalData,
  };
};