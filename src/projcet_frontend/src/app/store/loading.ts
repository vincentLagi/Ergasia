import { atom } from 'jotai';

export interface LoadingState {
  isLoading: boolean;
  message: string;
}

export const globalLoadingAtom = atom<LoadingState>({
  isLoading: false,
  message: 'Loading...'
});

export const setLoadingAtom = atom(
  null,
  (get, set, { isLoading, message }: { isLoading: boolean; message?: string }) => {
    set(globalLoadingAtom, {
      isLoading,
      message: message || 'Loading...'
    });
  }
);
