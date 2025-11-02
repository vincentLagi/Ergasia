import { createContext, useState, useContext, ReactNode } from 'react';

interface BooleanContextType {
  isActive: boolean;
  setIsActive: (value: boolean) => void;
}

const BooleanContext = createContext<BooleanContextType | undefined>(undefined);

export const BooleanProvider = ({ children }: { children: ReactNode }) => {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <BooleanContext.Provider value={{ isActive, setIsActive }}>
      {children}
    </BooleanContext.Provider>
  );
};

export const useBoolean = () => {
  const context = useContext(BooleanContext);
  if (!context) throw new Error('useBoolean must be used within BooleanProvider');
  return context;
};