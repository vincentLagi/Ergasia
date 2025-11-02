import React, { createContext, useContext, useState, ReactNode } from 'react';

interface InboxPanelContextType {
  isInboxPanelOpen: boolean;
  openInboxPanel: () => void;
  closeInboxPanel: () => void;
  toggleInboxPanel: () => void;
}

const InboxPanelContext = createContext<InboxPanelContextType | undefined>(undefined);

interface InboxPanelProviderProps {
  children: ReactNode;
}

export const InboxPanelProvider: React.FC<InboxPanelProviderProps> = ({ children }) => {
  const [isInboxPanelOpen, setIsInboxPanelOpen] = useState(false);

  const openInboxPanel = () => setIsInboxPanelOpen(true);
  const closeInboxPanel = () => setIsInboxPanelOpen(false);
  const toggleInboxPanel = () => setIsInboxPanelOpen(prev => !prev);

  const value: InboxPanelContextType = {
    isInboxPanelOpen,
    openInboxPanel,
    closeInboxPanel,
    toggleInboxPanel,
  };

  return (
    <InboxPanelContext.Provider value={value}>
      {children}
    </InboxPanelContext.Provider>
  );
};

export const useInboxPanel = (): InboxPanelContextType => {
  const context = useContext(InboxPanelContext);
  if (context === undefined) {
    throw new Error('useInboxPanel must be used within an InboxPanelProvider');
  }
  return context;
};