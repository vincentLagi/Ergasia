"use client";
import React, { useState, useEffect } from "react";
import { ModalBody, ModalContent, ModalFooter } from "../ui/animated-modal";
import { motion } from "framer-motion";
import { TagIcon } from "lucide-react";
import { FiPlus, FiMinus, FiDollarSign, FiStar, FiUsers } from "react-icons/fi";
import { useModal } from "../../contexts/modal-context";
import { updateJob } from "../../controller/jobController";
import { Job, JobCategory, UpdateJobPayload } from "../../shared/types/Job";

interface EditJobFormProps {
    job: Job | null;
    onSave: (updatedJob: Job) => void;
    onCancel: () => void;
    refreshData?: () => void;
    modalIndex?: number;
  }

const EditJobForm = ({ job, onSave, onCancel, refreshData, modalIndex }: EditJobFormProps) => {
  const { open, setOpen, closeModal } = useModal();
  const [isLoading, setIsLoading] = useState(true);
  const [jobStatus, setJobStatus] = useState<string>(job?.jobStatus || "Start");


  if (isLoading) {
    return <div>Loading...</div>;
  }

 

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: name === "jobName" ? value : value,
  //   }));
  // };

  // const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: Number(value),
  //   }));
  // };

  // const handleDescriptionChange = (index: number, value: string) => {
  //   const updatedDescriptions = [...(formData.jobDescription || [])];
  //   updatedDescriptions[index] = value;
  //   setFormData(prev => ({
  //     ...prev,
  //     jobDescription: updatedDescriptions,
  //   }));
  // };

  // const addDescriptionItem = () => {
  //   setFormData(prev => ({
  //     ...prev,
  //     jobDescription: [...(prev.jobDescription || []), ""],
  //   }));
  // };

  // const removeDescriptionItem = (index: number) => {
  //   const updatedDescriptions = [...(formData.jobDescription || [])];
  //   updatedDescriptions.splice(index, 1);
  //   setFormData(prev => ({
  //     ...prev,
  //     jobDescription: updatedDescriptions,
  //   }));
  // };

  // const handleClose = () => {
  //   if (modalIndex !== undefined) {
  //     closeModal(modalIndex);
  //   } else {
  //     setOpen(false);
  //   }
  //   onCancel();
  // };

  if (!open && modalIndex === undefined) return null;

  return (
    <div>not used</div>
  );
};

export default EditJobForm;
