import { createContext, ReactNode, useContext, useState } from "react";
import { useModal } from "./modal-context";

interface NestedModalContextType {
  openNestedModal: (modalComponent: ReactNode) => void;
  closeNestedModal: (index: number) => void;
  nestedModals: { component: ReactNode; isOpen: boolean }[];
}

const NestedModalContext = createContext<NestedModalContextType | null>(null);

export const NestedModalProvider = ({ children }: { children: ReactNode }) => {
  const [nestedModals, setNestedModals] = useState<{ component: ReactNode; isOpen: boolean }[]>([]);

  const openNestedModal = (modalComponent: ReactNode) => {
    setNestedModals(prev => [...prev, { component: modalComponent, isOpen: true }]);
  };

  const closeNestedModal = (index: number) => {
    setNestedModals(prev => {
      const updated = [...prev];
      if (index >= 0 && index < updated.length) {
        updated[index].isOpen = false;
      }
      return updated;
    });
  };

  return (
    <NestedModalContext.Provider value={{ nestedModals, openNestedModal, closeNestedModal }}>
      {children}
      {nestedModals.map((modal, index) => 
        modal.isOpen ? <div key={index}>{modal.component}</div> : null
      )}
    </NestedModalContext.Provider>
  );
};

export const useNestedModal = () => {
  const context = useContext(NestedModalContext);
  if (!context) {
    throw new Error("useNestedModal must be used within a NestedModalProvider");
  }
  return context;
};

// Combined hook for both modal types
export const useModalSystem = () => {
  const modalContext = useModal();
  const nestedModalContext = useNestedModal();
  
  return {
    ...modalContext,
    ...nestedModalContext
  };
};