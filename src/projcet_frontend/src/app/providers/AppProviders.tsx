import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ConfigProvider } from 'antd';
import { Provider as JotaiProvider } from 'jotai';
import { ThemeProvider } from './ThemeProvider';
import { ModalProvider } from '../../contexts/modal-context';
import { InboxPanelProvider } from '../../contexts/InboxPanelContext';
import { ErrorFallback } from '../../shared/components/ErrorFallback';
import FaviconManager from '../../components/FaviconManager';
import { antdTheme } from '../theme/antd-theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo);
      }}
    >
      <BrowserRouter>
        <JotaiProvider>
          <ConfigProvider theme={antdTheme}>
            <ThemeProvider>
              <FaviconManager />
              <ModalProvider>
                <InboxPanelProvider>
                  {children}
                </InboxPanelProvider>
              </ModalProvider>
            </ThemeProvider>
          </ConfigProvider>
        </JotaiProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};