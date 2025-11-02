import { useState, useCallback, useEffect } from "react";
import { message } from "antd";
import {
  getJobById,
  getJobApplier,
  getAcceptedFreelancer,
  startJob,
  finishJob,
  viewAllJobs,
} from "../../controller/jobController";
import {
  applyJob,
  hasUserApplied,
  acceptApplier,
  rejectApplier,
} from "../../controller/applyController";
import {
  createInbox,
  getInboxMessagesFromAppliers,
} from "../../controller/inboxController";
import { isFreelancerRegistered } from "../../controller/jobTransactionController";
import { User } from "../types/User";
import { Job } from "../types/Job";
import { get } from "http";
import { InboxResponse } from "../types/Inbox";
import { send } from "vite";
import { createRating } from "../../controller/ratingController";
import { ApplierPayload } from "../types/Applier";
import ChatService from "../../services/chatService";

interface ApplicantData {
  user: User;
  appliedAt: string;
}

interface UseJobDetailsReturn {
  // Data
  job: Job | null;
  applicants: ApplicantData[];
  acceptedFreelancers: User[];
  hasApplied: boolean;
  isJobOwner: boolean;
  isJobFreelancer: boolean;
  similarJobs: Job[];

  // State
  loading: boolean;
  isApplying: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  isFetchingLetter: boolean;
  isStartingJob: boolean;

  // Actions
  fetchJobDetails: () => Promise<void>;
  handleApply: (values: any) => Promise<boolean>;
  handleAcceptApplicant: (userId: string, values: any) => Promise<boolean>;
  handleRejectApplicant: (userId: string, values: any) => Promise<boolean>;
  handleStartJob: () => Promise<boolean>;
  handleFinishJob: () => Promise<boolean>;
  handleCoverLetter: (
    jobId: string,
    userId: string,
    applicantId: string
  ) => Promise<string>;
  refreshData: () => Promise<void>;
}

export const useJobDetails = (
  jobId: string | undefined,
  user: User | null
): UseJobDetailsReturn => {
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<ApplicantData[]>([]);
  const [acceptedFreelancers, setAcceptedFreelancers] = useState<User[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isJobOwner, setIsJobOwner] = useState(false);
  const [isJobFreelancer, setisJobFreelancer] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isFetchingLetter, setIsFetchingLetter] = useState(false);
  const [isStartingJob, setIsStartingJob] = useState(false);

  // Fetch all job-related data in a single optimized call
  const fetchJobDetails = useCallback(async () => {
    if (!jobId) return;

    setLoading(true);
    // Reset states to prevent stale data
    setApplicants([]);
    setAcceptedFreelancers([]);
    setHasApplied(false);
    setisJobFreelancer(false);

    try {
      const jobData = await getJobById(jobId);
      if (!jobData) {
        throw new Error("Job not found");
      }

      const convertedJob: Job = {
        ...(jobData as any),
        jobTags: (jobData as any).jobTags?.map((t: any) => ({
          id: t.id?.toString?.() ?? String(t.id),
          jobCategoryName: t.jobCategoryName,
        })) || [],
        subAccount: (jobData as any).subAccount && (jobData as any).subAccount[0]
          ? [new Uint8Array((jobData as any).subAccount[0])]
          : [],
        jobSlots: BigInt((jobData as any).jobSlots),
        createdAt: BigInt((jobData as any).createdAt),
        updatedAt: BigInt((jobData as any).updatedAt),
      };
      setJob(convertedJob);

      const isOwner = user?.id === (jobData as any).userId;
      setIsJobOwner(isOwner);

      // Fetch all other data in parallel
      const promises = [];
      if (user) {
        if (!isOwner) {
          promises.push(hasUserApplied(user.id, jobId));
          promises.push(isFreelancerRegistered(jobId, user.id));
        }
        // Always fetch applicants and accepted freelancers
        promises.push(getJobApplier(jobId));
        promises.push(getAcceptedFreelancer(jobId));
      }
      promises.push(viewAllJobs());


      const results = await Promise.all(promises);
      let resultIndex = 0;

      if (user && !isOwner) {
        setHasApplied(results[resultIndex++] as boolean);
        const freelancerStatus = results[resultIndex++] as [string, string];
        if (freelancerStatus?.[0] === "succ") {
          setisJobFreelancer(freelancerStatus[1] === "true");
        }
      }

      const applicantsData = (user ? results[resultIndex++] : []) as ApplierPayload[];
      const acceptedDataResult = (user ? results[resultIndex++] : []) as User[];
      const allJobsData = results[resultIndex++] as Job[];

      const acceptedData: User[] = (acceptedDataResult || []).map((u: any) => ({
        ...u,
        id: u.id.toString(),
        rating: Number(u.rating) / 10,
        wallet: Number(u.wallet),
        createdAt: new Date(Number(u.createdAt) / 1000000),
        updatedAt: new Date(Number(u.updatedAt) / 1000000),
        profilePicture: u.profilePicture?.[0] ? new Blob([u.profilePicture[0]]) : null,
      }));

      const acceptedUserIds = new Set(
        acceptedData.map((user: User) => user.id)
      );

      const mappedData = (applicantsData || []).map((app: any) => ({
        user: app.user,
        appliedAt: new Date(Number(app.appliedAt) / 1000000).toISOString(),
      }));

      const filteredData = mappedData.filter(
        (app: any) => !acceptedUserIds.has(app.user.id)
      );

      setApplicants(filteredData);
      setAcceptedFreelancers(acceptedData);

      // Logic for similar jobs
      if (convertedJob && allJobsData) {
        const convertedAllJobs: Job[] = (allJobsData || []).map((jobData: any) => ({
          ...jobData,
          jobTags: jobData.jobTags?.map((t: any) => ({
            id: t.id?.toString?.() ?? String(t.id),
            jobCategoryName: t.jobCategoryName,
          })) || [],
          subAccount: jobData.subAccount && jobData.subAccount[0]
            ? [new Uint8Array(jobData.subAccount[0])]
            : [],
          jobSlots: BigInt(jobData.jobSlots),
          createdAt: BigInt(jobData.createdAt),
          updatedAt: BigInt(jobData.updatedAt),
        }));

        const currentJobTags = new Set(
          convertedJob.jobTags.map((tag) => tag.jobCategoryName)
        );

        const similar = convertedAllJobs
          .filter((j: Job) => {
            if (j.id === convertedJob.id) return false; // Exclude self
            const jobTags = new Set(j.jobTags.map((tag) => tag.jobCategoryName));
            const intersection = new Set(
              [...currentJobTags].filter((tag) => jobTags.has(tag))
            );
            return intersection.size > 0; // Find jobs with at least one common tag
          })
          .slice(0, 3); // Take top 3
        setSimilarJobs(similar);
      }

    } catch (error) {
      console.error("Error fetching job details:", error);
      message.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  // Handle job application
  const handleApply = useCallback(
    async (values: any): Promise<boolean> => {
      if (!user || !jobId || !job) return false;

      setIsApplying(true);
      try {
        const success = await applyJob(user.id, jobId);
        if (success) {
          // Create inbox notification for job owner
          await createInbox(
            job.userId,
            jobId,
            user.id,
            "application",
            values.coverLetter
          );

          message.success("Application submitted successfully!");
          setHasApplied(true);

          // Refresh applicant data if user is job owner
          if (isJobOwner) {
            await fetchJobDetails();
          }

          return true;
        } else {
          message.error("Failed to submit application. Please try again.");
          return false;
        }
      } catch (error) {
        console.error("Error applying to job:", error);
        message.error("Failed to submit application. Please try again.");
        return false;
      } finally {
        setIsApplying(false);
      }
    },
    [user, jobId, job, isJobOwner, fetchJobDetails]
  );

  // Handle applicant acceptance
  const handleAcceptApplicant = useCallback(
    async (userId: string, values: any): Promise<boolean> => {
      if (!jobId || !user) return false;

      try {
        setIsAccepting(true);
        const success = await acceptApplier(userId, jobId);
        if (success) {
          // Create inbox notification for applicant
          await createInbox(
            userId,
            jobId,
            user.id,
            "application",
            values.acceptancereason
          );
          await fetchJobDetails(); // Refresh data
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error accepting applicant:", error);
        message.error("Failed to accept applicant.");
        return false;
      } finally {
        setIsAccepting(false);
      }
    },
    [jobId, user, fetchJobDetails]
  );

  // Handle applicant rejection
  const handleRejectApplicant = useCallback(
    async (userId: string, values: any): Promise<boolean> => {
      if (!jobId || !user) return false;

      try {
        setIsRejecting(true);
        const success = await rejectApplier(userId, jobId);
        if (success) {
          // Create inbox notification for applicant
          await createInbox(
            userId,
            jobId,
            user.id,
            "application",
            values.rejectionreason
          );

          message.success("Applicant rejected.");
          await fetchJobDetails(); // Refresh data
          return true;
        } else {
          message.error("Failed to reject applicant.");
          return false;
        }
      } catch (error) {
        console.error("Error rejecting applicant:", error);
        message.error("Failed to reject applicant.");
        return false;
      } finally {
        setIsRejecting(false);
      }
    },
    [jobId, user, fetchJobDetails]
  );

  // Handle job start
  const handleStartJob = useCallback(async (): Promise<boolean> => {
    if (!job || !user || !isJobOwner) return false;

    setIsStartingJob(true);

    try {
      setLoading(true);
      const result = await startJob(job.id, user);
      if (result.jobStarted) {
        message.success("Job started successfully!");
        setLoading(false);
        await fetchJobDetails();
        
        // Create chat rooms for each accepted freelancer
        console.log('🚀 Creating chat rooms for accepted freelancers...');
        for (const freelancer of acceptedFreelancers) {
          try {
            console.log(`📨 Creating chat room for job ${job.id} with freelancer ${freelancer.id}`);
            const chatRoom = await ChatService.getOrCreateChatRoom(
              job.id,
              user.id, // client_id
              freelancer.id // freelancer_id
            );
            
            if (chatRoom) {
              console.log(`✅ Chat room created: ${chatRoom.id}`);
            } else {
              console.warn(`⚠️ Failed to create chat room for freelancer ${freelancer.id}`);
            }
          } catch (error) {
            console.error(`❌ Error creating chat room for freelancer ${freelancer.id}:`, error);
          }
        }
        
        if (acceptedFreelancers.length > 0) {
          console.log(`🎉 Created ${acceptedFreelancers.length} chat room(s) for job ${job.id}`);
        }
        
        return true;
      } else {
        message.error(result.message);
        setLoading(false);
        return false;
      }
    } catch (error) {
      message.error("Failed to start job.");
      return false;
    } finally {
      setIsStartingJob(false);
    }
  }, [job, user, isJobOwner, acceptedFreelancers, fetchJobDetails]);

  // Handle job finish
  const handleFinishJob = useCallback(async (): Promise<boolean> => {
    if (!job) return false;

    try {
      setLoading(true);
      const result = await finishJob(job.id);
      if (result.jobFinished) {
        message.success("Job finished successfully!");
        const userIds = acceptedFreelancers
          .map((u) => u.id)
          .filter((id): id is string => typeof id === "string" && id.length > 0);

        if (userIds.length > 0) {
          const res = await createRating(job.id, userIds);
          if (typeof res === "string" && res.toLowerCase().includes("success")) {
            message.success("Rating created successfully");
          } else {
            message.warning(res);
          }
        } else {
          message.info("No accepted freelancers to create ratings for.");
        }

        await fetchJobDetails();
        setLoading(false);
        return true;
      } else {
        setLoading(false);
        message.error(result.message);
        return false;
      }
    } catch (error) {
      setLoading(false);
      console.error("Error finishing job:", error);
      message.error("Failed to finish job.");
      return false;
    }
  }, [job, acceptedFreelancers, fetchJobDetails]);

  const handleCoverLetter = useCallback(
    async (jobId: string, userId: string, applicantId: string) => {
      if (!jobId || !userId) return;
      setIsFetchingLetter(true)
      try {
        const inboxMessages = await getInboxMessagesFromAppliers(jobId, userId);
        if (inboxMessages) {
          const messages = inboxMessages.map((msg) => ({
            createdAt: msg.createdAt,
            message: msg.message,
            senderId: msg.senderId,
          }));
          const filteredMessages = messages.filter(
            (msg) => msg.senderId === applicantId
          );
          
          if (filteredMessages.length > 0) {
            // Mengembalikan pesan pertama yang cocok secara keseluruhan
            return filteredMessages[0].message;
          }
          return "Cover letter not found."; // Pesan jika tidak ada
        }
      } catch (error) {
        console.error("Error submitting cover letter:", error);
      } finally {
        setIsFetchingLetter(false);
      }
    },
    [job, user, fetchJobDetails]
  );

  // Refresh data manually
  const refreshData = useCallback(async () => {
    await fetchJobDetails();
  }, [fetchJobDetails]);

  // Initialize data on mount or when dependencies change
  useEffect(() => {
    fetchJobDetails();
  }, [fetchJobDetails]);

  return {
    // Data
    job,
    applicants,
    acceptedFreelancers,
    hasApplied,
    isJobOwner,
    isJobFreelancer,
    similarJobs,

    // State
    loading,
    isApplying,
    isAccepting,
    isRejecting,
    isFetchingLetter,
    isStartingJob,

    // Actions
    fetchJobDetails,
    handleApply,
    handleAcceptApplicant,
    handleRejectApplicant,
    handleStartJob,
    handleFinishJob,
    handleCoverLetter,
    refreshData,
  };
};

