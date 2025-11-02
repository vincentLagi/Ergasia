import { useState, useCallback } from 'react';

interface LoadingState {
  isLoading: boolean;
  message: string;
}

interface UseLoadingStateReturn {
  loadingState: LoadingState;
  setLoading: (isLoading: boolean, message?: string) => void;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
}

export const useLoadingState = (initialMessage: string = 'Loading...'): UseLoadingStateReturn => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    message: initialMessage
  });

  const setLoading = useCallback((isLoading: boolean, message: string = initialMessage) => {
    setLoadingState({
      isLoading,
      message
    });
  }, [initialMessage]);

  const showLoading = useCallback((message: string = initialMessage) => {
    setLoadingState({
      isLoading: true,
      message
    });
  }, [initialMessage]);

  const hideLoading = useCallback(() => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, []);

  return {
    loadingState,
    setLoading,
    showLoading,
    hideLoading
  };
};
