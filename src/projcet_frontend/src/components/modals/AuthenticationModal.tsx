"use client";
import React, { useState } from "react";
import { ModalBody, ModalContent, ModalFooter } from "../ui/animated-modal";
import { motion } from "framer-motion";
import { GlobeIcon } from "lucide-react";
import { useModal } from "../../contexts/modal-context";
import { useAuth } from "../../hooks/useAuth";

export function AuthenticationModal({ modalIndex }: { modalIndex?: number }) {
  const { open, setOpen, closeModal } = useModal();
  const { loginWithInternetIdentity, isLoading } = useAuth();

  const handleInternetIdentityLogin = async () => {
    try {
      await loginWithInternetIdentity();
      setOpen(false);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleClose = () => {
    if (modalIndex !== undefined) {
      closeModal(modalIndex);
    } else {
      setOpen(false);
    }
  };

  if (!open && modalIndex === undefined) return null;

  return (
    <div className="hidden md:flex flex-column items-center space-x-4">
      <ModalBody className="flex flex-column items-center space-x-4">
        <ModalContent className="max-w-lg mx-auto bg-[#F9F7F7]">
          <div className="space-y-6 px-6 pt-6 pb-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-[#112D4E]">
                Welcome to ERGASIA
              </h3>
              <p className="mt-2 text-[#112D4E] text-base">
                Sign in with Internet Identity
              </p>
            </div>

            <div className="space-y-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  className="w-full flex items-center justify-center space-x-3 bg-[#112D4E] text-white px-6 py-3 text-base font-medium rounded-xl transition-all hover:bg-[#0f2741] focus:outline-none focus:ring-2 focus:ring-[#112D4E] focus:ring-offset-2 disabled:opacity-50"
                  onClick={handleInternetIdentityLogin}
                  disabled={isLoading}
                >
                  <GlobeIcon className="w-5 h-5" />
                  <span>
                    {isLoading ? "Connecting..." : "Continue with Internet Identity"}
                  </span>
                </button>
              </motion.div>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>
                New user? After signing in, you'll complete your profile setup.
              </p>
            </div>
          </div>

          <ModalFooter className="flex items-center justify-center mt-2 p-0">
            <div
              onClick={handleClose}
              className="w-full text-center font-medium rounded-b-xl border-b border-b-[#112D4E] text-gray-600 transition-colors hover:text-white hover:bg-[#D9534F] hover:border-[#D9534F] py-3 cursor-pointer"
            >
              Cancel
            </div>
          </ModalFooter>
        </ModalContent>
      </ModalBody>
    </div>
  );
}
