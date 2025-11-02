import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  duration?: number; // Auto-close duration in ms (optional)
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  title = "Error",
  message,
  duration,
}) => {
  const [isVisible, setIsVisible] = useState(isOpen);

  // Handle auto-close if duration is provided
  useEffect(() => {
    setIsVisible(isOpen);

    let timer: NodeJS.Timeout;
    if (isOpen && duration) {
      timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Delay actual close until animation completes
      }, duration);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, duration, onClose]);

  // Handle manual close
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Delay actual close until animation completes
    console.log("kanjut");
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
            {/* Modal */}
            <motion.div
              className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="pointer-events-auto mt-6 mx-4 w-full max-w-md overflow-hidden rounded-lg shadow-lg bg-white border border-red-200">
                <div className="relative p-4">
                  {/* Top section with icon */}
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                      </div>
                    </div>

                    <div className="ml-3 w-0 flex-1 pt-0.5">
                      <h3 className="text-sm font-medium text-gray-900">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{message}</p>
                    </div>

                    <div className="ml-4 flex-shrink-0 flex">
                      <button
                        className="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        onClick={handleClose}
                      >
                        <span className="sr-only">Close</span>
                        <X className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Aurora light effect */}
                  {/* <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 opacity-30 blur-xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-tl from-red-200 via-orange-200 to-yellow-200 opacity-30 blur-xl" /> */}
                </div>

                {/* Progress bar for auto-close */}
                {duration && (
                  <motion.div
                    className="h-1 bg-gradient-to-r from-red-400 to-red-600"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: duration / 1000, ease: "linear" }}
                  />
                )}
              </div>
            </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ErrorModal;
