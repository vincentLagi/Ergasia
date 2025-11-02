import React from 'react';
import { useAtom } from 'jotai';
import { globalLoadingAtom } from '../../app/store/loading';
import LoadingOverlay from './LoadingOverlay';

const GlobalLoadingOverlay: React.FC = () => {
  const [loadingState] = useAtom(globalLoadingAtom);

  return (
    <LoadingOverlay 
      visible={loadingState.isLoading} 
      message={loadingState.message}
    />
  );
};

export default GlobalLoadingOverlay;
