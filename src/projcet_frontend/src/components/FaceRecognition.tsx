import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Modal, Button, Progress, Typography, Space } from "antd";
import { CameraOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";
import { loginWithInternetIdentity, loginWithFace } from "../controller/userController";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

// Face recognition service configuration
const FACE_RECOGNITION_BASE_URL = (import.meta as any).env?.DEV
  ? "/face-api"
  : (process.env.REACT_APP_FACE_RECOGNITION_URL || "https://face.130.211.124.157.sslip.io");

interface FaceRecognitionProps {
  principalId: string;
  onSuccess: (data?: any) => void;
  onError: (error: string) => void;
  isOpen: boolean;
  onClose: () => void;
  purpose: "login" | "setup"; // New prop to define the purpose
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({
  principalId,
  onSuccess,
  onError,
  isOpen,
  onClose,
  purpose, // Destructure the new prop
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mode, setMode] = useState<"register" | "verify" | "loading">("loading");
  const [captureCount, setCaptureCount] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState<
    "idle" | "processing" | "success" | "error"
  >("idle");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Debug camera permissions and browser context
    console.log("FaceRecognition: Checking camera permissions and browser context");
    console.log("FaceRecognition: navigator.mediaDevices:", !!navigator.mediaDevices);
    console.log("FaceRecognition: navigator.mediaDevices.getUserMedia:", !!navigator.mediaDevices?.getUserMedia);
    console.log("FaceRecognition: location.protocol:", location.protocol);
    console.log("FaceRecognition: document.location.protocol:", document.location.protocol);

    // Check permissions API if available
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).then(result => {
        console.log("FaceRecognition: Camera permission state:", result.state);
      }).catch(err => {
        console.log("FaceRecognition: Error checking camera permission:", err);
      });
    }

    const checkRegistrationStatus = async () => {
      if (!isOpen) return;

      if (purpose === "login" && !principalId) {
        // If purpose is login and no principalId (user not logged in),
        // it means we are trying to log in. We should attempt verification.
        setMode("verify"); // Set mode to verify for login attempts
        setRegistrationStatus("idle");
        setLoading(false);
        return;
      }

      try {
        setMode("loading");
        setLoading(true);
        const serviceUrl = `${FACE_RECOGNITION_BASE_URL}/check-registration/${principalId}`;
        // DEBUG: Log SSL and URL details
        console.log("🔍 [FACE RECOG DEBUG] Environment check:");
        console.log("🔍 [FACE RECOG DEBUG] - Current location protocol:", window.location.protocol);
        console.log("🔍 [FACE RECOG DEBUG] - Face recognition URL:", serviceUrl);
        console.log("🔍 [FACE RECOG DEBUG] - Is HTTPS page with HTTP API?", window.location.protocol === 'https:' && serviceUrl.startsWith('http://'));
        console.log("🔍 [FACE RECOG DEBUG] Attempting to connect to face recognition service:", serviceUrl);
        
  const response = await fetch(serviceUrl);
        console.log("Face recognition service response status:", response.status);
        const result = await response.json();
        console.log("Face recognition service response:", result);
        if (result.status === "registered") {
          setMode("verify");
        } else {
          setMode("register");
        }
      } catch (error) {
        console.error("Error checking registration status:", error);
        onError("Could not connect to face recognition service.");
        setMode("register"); // Default to register on error
      } finally {
        setLoading(false);
      }
    };

    checkRegistrationStatus();
  }, [isOpen, principalId, onError, purpose]); // Add purpose to dependency array


  useEffect(() => {
    if (isOpen) {
      setCaptureCount(0);
      setRegistrationStatus("idle");
    }
  }, [isOpen]);

  const capture = async () => {
    if (!webcamRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      setRegistrationStatus("processing");
      const imageSrc = webcamRef.current.getScreenshot();

      if (!imageSrc) {
        throw new Error("Failed to capture image");
      }

      // Convert base64 to blob
      const base64Data = imageSrc.split(",")[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "image/jpeg" });

      // Create form data
      const formData = new FormData();
      formData.append("file", blob, "image.jpg");

      // Only add principal_id if in register mode
      if (mode === "register") {
        formData.append("principal_id", principalId);
      }

      const endpoint =
        mode === "register" ? "/register-face" : "/verify-face";
      const serviceUrl = `${FACE_RECOGNITION_BASE_URL}${endpoint}`;
      // DEBUG: Log SSL and URL details for capture
      console.log("🔍 [FACE RECOG CAPTURE DEBUG] Environment check:");
      console.log("🔍 [FACE RECOG CAPTURE DEBUG] - Current location protocol:", window.location.protocol);
      console.log("🔍 [FACE RECOG CAPTURE DEBUG] - Face recognition URL:", serviceUrl);
      console.log("🔍 [FACE RECOG CAPTURE DEBUG] - Is HTTPS page with HTTP API?", window.location.protocol === 'https:' && serviceUrl.startsWith('http://'));
      console.log("🔍 [FACE RECOG CAPTURE DEBUG] Attempting to connect to face recognition service for capture:", serviceUrl);
      
  const response = await fetch(serviceUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
        mode: 'cors' // Explicitly set CORS mode
      });
      console.log("Face recognition capture response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Response from server:", result);

      if (result.status === "success") {
        console.log(result.message);
        setRegistrationStatus("success");

  if (mode === "verify" && result.principal_id) {
          setTimeout(async () => {
            onSuccess({
              principalId: result.principal_id,
              similarity: result.similarity,
              message: result.message,
            });
            if (purpose === "login") { // Only login if purpose is login
              // Use face-based login to set session without Internet Identity popup
              await loginWithFace(result.principal_id);
              window.location.reload(); // Reload the page after successful login
            }
            onClose();
          }, 500);
        } else {
          // Handle successful registration
          setCaptureCount((prev) => prev + 1);
          setTimeout(async () => { // Make this async to await login
            if (captureCount >= 2) {
              // If this was the 3rd capture (0-indexed)
              onSuccess();
              if (purpose === "login" && principalId) { // Only login if purpose is login
                await loginWithFace(principalId);
                window.location.reload(); // Reload the page after successful login
              }
              onClose();
            } else {
              setRegistrationStatus("idle");
            }
          }, 1500);
        }
      } else {
        setRegistrationStatus("error");
        onError(result.message || "Failed to process request");
      }
    } catch (error) {
      console.error("Error in capture:", error);
      setRegistrationStatus("error");
      onError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const getTitle = () => {
    if (mode === 'loading') return "Checking Status...";
    if (purpose === "login") {
      return mode === "register" ? "Register Face for Login" : "Login with Face Recognition";
    }
    return mode === "register" ? "Face Registration" : "Face Verification";
  }

  const getInstruction = () => {
    if (mode === 'loading') return "Please wait while we check your registration status.";
    if (purpose === "login") {
      return mode === "register"
        ? "Please capture your face 3 times to register for login."
        : "Look at the camera to log in with your face.";
    }
    return mode === "register"
      ? "Please capture your face 3 times to register."
      : "Look at the camera to verify your identity.";
  }

  const getButtonText = () => {
    if (registrationStatus === "processing") return "Processing...";
    if (registrationStatus === "success") return "Captured Successfully!";
    if (registrationStatus === "error") return "Try Again";
    if (mode === "register") {
      return purpose === "login" ? `Register Face ${captureCount + 1}/3` : `Capture Face ${captureCount + 1}/3`;
    }
    return purpose === "login" ? "Login with Face" : "Verify Face";
  }

  return (
    <Modal
      title={
        <Title level={3} style={{ margin: 0 }}>
          {getTitle()}
        </Title>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      destroyOnClose
    >
      <div className="text-center">
        <Text type="secondary" className="block mb-6">
          {getInstruction()}
        </Text>

        <div className="relative inline-block mb-6">
          <div className="w-64 h-64 rounded-full overflow-hidden border-4 border-gray-200 shadow-lg mx-auto">
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              mirrored={true}
              className="w-full h-full object-cover"
              videoConstraints={{ width: 400, height: 400, facingMode: "user" }}
            />
            
            {/* Status Overlay */}
            <AnimatePresence>
              {registrationStatus === "processing" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                >
                  <div className="text-center text-white">
                    <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
                    <Text className="text-white">Processing...</Text>
                  </div>
                </motion.div>
              )}
              {registrationStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <CheckCircleOutlined className="text-6xl text-green-500 mb-2" />
                    <Text className="text-green-600 font-medium">Success!</Text>
                  </div>
                </motion.div>
              )}
              {registrationStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm"
                >
                  <div className="text-center">
                    <ExclamationCircleOutlined className="text-6xl text-red-500 mb-2" />
                    <Text className="text-red-600 font-medium">Error</Text>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {mode === "register" && (
          <div className="mb-6">
            <Progress
              percent={(captureCount / 3) * 100}
              showInfo={false}
              strokeColor="#1890ff"
              className="mb-2"
            />
            <Text type="secondary">
              {captureCount}/3 captures completed
            </Text>
          </div>
        )}

        <Space direction="vertical" size="middle" className="w-full">
          <Button
            type="primary"
            size="large"
            icon={<CameraOutlined />}
            onClick={capture}
            disabled={isCapturing || registrationStatus === "processing" || mode === 'loading'}
            loading={registrationStatus === "processing" || mode === 'loading'}
            className="w-full"
          >
            {getButtonText()}
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default FaceRecognition;
