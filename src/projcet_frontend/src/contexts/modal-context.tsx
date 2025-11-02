import { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface ModalState {
  isOpen: boolean;
  children?: ModalState[];
}

interface ModalContextType {
  modalStates: ModalState[];
  openModal: (parentIndex?: number) => number;
  closeModal: (index: number, parentIndex?: number) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const ModalContext = createContext<ModalContextType | null>(null);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalStates, setModalStates] = useState<ModalState[]>([]);
  const [open, setOpen] = useState(false);

  const openModal = (parentIndex?: number): number => {
    if (parentIndex === undefined) {
      const newIndex = modalStates.length;
      setModalStates([...modalStates, { isOpen: true }]);
      return newIndex;
    } else {
      let childIndex = 0;
      setModalStates(prevStates => {
        const newStates = [...prevStates];
        if (!newStates[parentIndex].children) {
          newStates[parentIndex].children = [];
        }
        childIndex = newStates[parentIndex].children!.length;
        newStates[parentIndex].children!.push({ isOpen: true });
        return newStates;
      });
      return childIndex;
    }
  };

  const closeModal = (index: number, parentIndex?: number) => {
    setModalStates(prevStates => {
      const newStates = [...prevStates];
      if (parentIndex === undefined) {
        if (index >= 0 && index < newStates.length) {
          newStates[index].isOpen = false;
        }
      } else {
        if (
          parentIndex >= 0 && 
          parentIndex < newStates.length && 
          newStates[parentIndex].children && 
          index >= 0 && 
          index < newStates[parentIndex].children!.length
        ) {
          newStates[parentIndex].children![index].isOpen = false;
        }
      }
      return newStates;
    });
  };

  // Prevent body scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen = modalStates.some(state => state.isOpen || state.children?.some(child => child.isOpen)) || open;
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "auto";
    
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalStates, open]);

  return (
    <ModalContext.Provider value={{ modalStates, openModal, closeModal, open, setOpen }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};