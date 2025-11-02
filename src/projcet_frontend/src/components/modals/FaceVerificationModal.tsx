"use client";
import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { ModalBody, ModalContent, ModalFooter } from "../ui/animated-modal";
import { motion } from "framer-motion";
import { CameraIcon } from "lucide-react";
import { useModal } from "../../contexts/modal-context";
import { useNavigate } from 'react-router-dom';
import { loginWithInternetIdentity } from '../../controller/userController';

export function FaceVerificationModal({ parentIndex, index }: { parentIndex: number, index: number }) {
  const { closeModal } = useModal();
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const navigate = useNavigate();

  const verifyFace = async () => {
    if (!webcamRef.current) return;
  
    try {
      setIsCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        throw new Error('Failed to capture image');
      }
  
      // Convert base64 to blob
      const base64Data = imageSrc.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
  
      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');

      // Use dev proxy in development to avoid SSL issues, real HTTPS in production
      const apiUrl = (import.meta as any).env?.DEV
        ? '/face-api/verify-face'
        : `${process.env.REACT_APP_FACE_RECOGNITION_URL || 'https://face.130.211.124.157.sslip.io'}/verify-face`;
      
      // DEBUG: Log SSL and URL details
      console.log('🔍 [FACE VERIFY DEBUG] Environment check:');
      console.log('🔍 [FACE VERIFY DEBUG] - Current location protocol:', window.location.protocol);
      console.log('🔍 [FACE VERIFY DEBUG] - Face verify URL:', apiUrl);
      console.log('🔍 [FACE VERIFY DEBUG] - Is HTTPS page with HTTP API?', window.location.protocol === 'https:' && apiUrl.startsWith('http://'));

      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const result = await response.json();
      console.log('Response from server:', result);
  
      if (result.status === 'success' && result.principal_id) {
        console.log("Verified successfully:", result.message);
        
        // Login the user
        await loginWithInternetIdentity();
        
        // Close the modal
        closeModal(index, parentIndex);
        
        // Navigate to home page
        navigate('/');
      } else {
        throw new Error(result.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error in face verification:', error);

    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="hidden md:flex flex-column items-center space-x-4">
      <ModalBody className="flex flex-column items-center space-x-4">
        <ModalContent className="max-w-2xl mx-auto bg-[#F9F7F7]">
          <div className="space-y-6 px-8 pt-8 pb-6">
            <div className="text-center">
              <h3 className="text-3xl font-bold text-[#112D4E]">
                Face Verification
              </h3>
              <p className="mt-3 text-[#112D4E] text-lg">
                Please look at the camera to verify your identity
              </p>
            </div>

            <div className="webcam-container flex justify-center my-6">
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                mirrored={true}
                className="webcam border-4 border-[#112D4E] rounded-lg"
                style={{
                  width: '100%',
                  maxWidth: '480px',
                }}
              />
            </div>

            <div className="space-y-5">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button 
                  className="relative w-full flex items-center justify-center space-x-2 bg-[#112D4E] text-white border-2 border-[#112D4E] px-24 py-4 text-lg rounded-4xl transition-all hover:bg-[#1A3E6C] focus:outline-none focus:ring-2 focus:ring-[#112D4E] focus:ring-offset-2"
                  onClick={verifyFace}
                  disabled={isCapturing}
                >
                  <CameraIcon className="w-6 h-6" />
                  <span>{isCapturing ? 'Verifying...' : 'Verify Face'}</span>
                </button>
              </motion.div>
            </div>
          </div>

          <ModalFooter className="flex items-center justify-center mt-2 p-0">
            <div
              onClick={() => closeModal(index, parentIndex)}
              className="w-full h-full text-lg text-center font-semibold rounded-b-2xl border-b border-b-[#112D4E] text-black transition-colors hover:text-white hover:bg-[#D9534F] hover:border-[#D9534F] py-4"
            >
              Cancel
            </div>
          </ModalFooter>
        </ModalContent>
      </ModalBody>
    </div>
  );
}