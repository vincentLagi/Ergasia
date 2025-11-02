"use client";
import { cn } from "../../lib/tvMerge";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useOutsideClick } from "../../utils/useTapOutside";
import "../../styles/style.css";
import { useModal } from "../../contexts/modal-context";

interface ModalContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const ModalTrigger = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { setOpen } = useModal();
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-md text-black dark:text-white text-center relative overflow-hidden",
        className
      )}
      onClick={() => setOpen(true)}
    >
      {children}
    </button>
  );
};

export const ModalBody = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { open, setOpen } = useModal();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [open]);

  const modalRef = useRef(null);
  useOutsideClick(modalRef, () => setOpen(false));

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed h-screen w-screen inset-0 bg-black/30 backdrop-blur-sm z-50 m-0"
          />

          {/* Modal Content */}
          <motion.div
            key="modal"
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 20,
            }}
            transition={{
              type: "spring",
              bounce: 0.5,
              duration: 0.3,
              exit: { duration: 0.2 },
            }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div
              ref={modalRef}
              className={`pointer-events-auto ${className || ""}`}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export const ModalContent = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={`bg-white rounded-2xl shadow-xl overflow-hidden ${
        className || ""
      }`}
    >
      {children}
    </div>
  );
};

export const ModalFooter = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return <div className={`${className || ""}`}>{children}</div>;
};
