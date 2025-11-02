import { useAtom } from 'jotai';
import { globalLoadingAtom, setLoadingAtom } from '../../app/store/loading';

export const useGlobalLoading = () => {
  const [loadingState] = useAtom(globalLoadingAtom);
  const [, setLoading] = useAtom(setLoadingAtom);

  const showLoading = (message: string = 'Loading...') => {
    setLoading({ isLoading: true, message });
  };

  const hideLoading = () => {
    setLoading({ isLoading: false });
  };

  const setLoadingMessage = (message: string) => {
    setLoading({ isLoading: true, message });
  };

  return {
    loadingState,
    showLoading,
    hideLoading,
    setLoadingMessage,
  };
};
