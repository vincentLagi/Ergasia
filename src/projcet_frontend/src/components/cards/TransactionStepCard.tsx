import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { CheckCircle, DollarSign, Briefcase, Users, Award } from "lucide-react";

const ProcessFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      setIsAutoPlaying(true);
    }
  }, [isInView]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying && currentStep < steps.length) {
      timer = setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setIsAutoPlaying(false);
        }
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep]);

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    setIsAutoPlaying(false);
  };

  const steps = [
    {
      title: "Client Posts Job",
      description:
        "Client states base price and deposits cryptocurrency into a job-specific wallet.",
      icon: <DollarSign className="w-10 h-10 text-white" />,
      color: "bg-gradient-to-br from-blue-300 to-purple-500",
    },
    {
      title: "Freelancer Selection",
      description: "Client invites or approves a freelancer for the job.",
      icon: <Users className="w-10 h-10 text-white" />,
      color: "bg-gradient-to-br from-blue-400 to-purple-600",
    },
    {
      title: "Work Completion",
      description:
        "Freelancer completes the job and submits work for client review.",
      icon: <Briefcase className="w-10 h-10 text-white" />,
      color: "bg-gradient-to-br from-blue-500 to-purple-700",
    },
    {
      title: "Payment Release",
      description:
        "Client approves the work, funds transfer to freelancer's wallet.",
      icon: <Award className="w-10 h-10 text-white" />,
      color: "bg-gradient-to-br from-green-500 to-teal-700",
    },
  ];

  return (
    <div ref={ref} className="relative w-full max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-center my-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
        How It Works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            className={`${step.color} rounded-2xl shadow-lg p-6 cursor-pointer relative`}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: currentStep >= index ? 1 : 0.6,
              y: 0,
              scale: currentStep === index ? 1.05 : 1,
              boxShadow:
                currentStep === index
                  ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                  : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3 }}
            onClick={() => setCurrentStep(index)}
          >
            {currentStep >= index && (
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-white/20"
                    style={{
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30],
                      opacity: [0, 0.5, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      repeatType: "loop",
                      ease: "easeInOut",
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>
            )}
            <div className="bg-white/20 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              {step.icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {index + 1}. {step.title}
            </h3>
            <p className="text-white/90">{step.description}</p>
            <AnimatePresence>
              {currentStep > index && (
                <motion.div
                  className="absolute top-4 right-4 bg-white/20 rounded-full p-1"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  <CheckCircle className="w-6 h-6 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        {steps.map((step, index) => (
          <div
            key={index}
            className="relative flex flex-col items-center flex-1 z-10"
            onClick={() => goToStep(index)}
          >
            <motion.div
              className={`flex items-center justify-center w-10 h-10 rounded-full border-2 cursor-pointer transition-all
                  ${
                    currentStep >= index
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentStep >= index ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <span className="text-gray-500">{index + 1}</span>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlow;
