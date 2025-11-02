import React from "react";
import { motion } from "framer-motion";

interface LoadingOverlayProps {
  message?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center m-0">
      {/* Semi-transparent backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/10 backdrop-blur-md"></div>

      {/* Content container */}
      <motion.div
        className="relative z-10 bg-white/50 shadow-xl rounded-2xl px-10 py-8 items-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Loading animation */}
        <div className=" flex flex-row space-x-3 mb-4 justify-center">
          <div>
            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 animate-pulse"
              animate={{
                y: ["0%", "-100%", "0%"],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.1,
                ease: "easeInOut",
              }}
            ></motion.div>
          </div>
          <div>
            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-400 to-indigo-400 animate-pulse"
              animate={{
                y: ["0%", "-100%", "0%"],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.3,
                ease: "easeInOut",
              }}
            ></motion.div>
          </div>
          <div>
            <motion.div
              className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-400 to-indigo-400 animate-pulse"
              animate={{
                y: ["0%", "-100%", "0%"],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.5,
                ease: "easeInOut",
              }}
            ></motion.div>
          </div>
        </div>

        <div>
          <motion.p
            className="text-[#3F72AF] font-medium text-lg"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {message}
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoadingOverlay;
