import { AuthClient } from "@dfinity/auth-client";
import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import {
  Job,
  CreateJobPayload,
  UpdateJobPayload,
  JobCategory,
  User as BackendUser,
} from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { User } from "../shared/types/User";
import { ApplierPayload } from "../shared/types/Applier";
import { agentService } from "../singleton/agentService";
import { storage } from "../utils/storage";
import { ensureUserData } from "../utils/sessionUtils";
import { debugUserData } from "../utils/debugUtils";
import { fixUserData } from "../utils/userDataFixer";
import { Job as JobShared, JobPayload } from "../shared/types/Job";
import { getBalanceController, transferToJobController, transfertoWorkerController } from "./tokenController";
import { HttpAgent } from "@dfinity/agent";
import { backendJobToFrontendJob, backendJobsToFrontendJobs, backendUserToFrontendUser, backendUsersToFrontendUsers } from "../utils/typeConverters";

export const createJob = async (payload: JobPayload): Promise<string[]> => {
  const agent = await agentService.getAgent();
  try {
    if (!payload.jobName.trim()) return ["Failed", "Job name is required"];
    if (payload.jobDescription.length === 0)
      return ["Failed", "Job description is required"];
    if (payload.jobTags.length === 0)
      return ["Failed", "At least one job tag is required"];
    if (payload.jobSalary < 1)
      return ["Failed", "Job salary must be at least 1"];
    if (payload.jobSlots < 1) return ["Failed", "Job slots must be at least 1"];

    // First, ensure we have user data if there's a session
    const hasUserData = await ensureUserData();
    if (!hasUserData) {
      return [
        "Failed",
        "Authentication required. Please login before posting a job.",
      ];
    }

    // Run debug utility to help troubleshoot
    debugUserData();

    // Get user data from storage utility
    let currentUser = storage.getUser();
    console.log("Current user from storage for job creation:", currentUser);

    // If user data has issues, try to fix it
    if (!currentUser || !currentUser.id) {
      console.log("User data has issues, attempting to fix...");
      currentUser = await fixUserData();
    }
    if (currentUser) {
      console.log("User ID:", currentUser.id);
      console.log("User structure type:", typeof currentUser);
      console.log("User keys:", Object.keys(currentUser));
    } else {
      console.log("No user data available");
    }


    const newJobTags: JobCategory[] = [];

    for (const tag of payload.jobTags) {
      let existingCategory = await projcet_backend_single.findJobCategoryByName(tag);

      if (!("ok" in existingCategory)) {
        existingCategory = await projcet_backend_single.createJobCategory(tag);
      }

      if ("ok" in existingCategory) {
        newJobTags.push(existingCategory.ok);
      }
    }

    if (currentUser) {

      // Make sure the ID is a string
      const userId = String(currentUser.id);
      console.log("User ID as string:", userId);

      // Safely create the payload
      const createJobPayload: CreateJobPayload = {
        jobProjectType: payload.jobProjectType,
        jobRequirementSkills: payload.jobSkills,
        jobName: payload.jobName,
        jobTags: newJobTags,
        userId: userId,
        jobDescription: payload.jobDescription,
        jobStartDate: payload.jobStartDate,
        jobSalary: payload.jobSalary,
        jobExperimentLevel: payload.jobExprienceLevel,
        jobDeadline: payload.jobDeadline,
        jobSlots: BigInt(payload.jobSlots),
        jobStatus: "Open",
      };

      console.log("Job payload being sent:", {
        ...createJobPayload,
        jobSlots: createJobPayload.jobSlots.toString(),
        userId: createJobPayload.userId,
      });

      const result = await projcet_backend_single.createJob(createJobPayload);
      if ("ok" in result) {
   

        return ["Success", "Successfully created job"]

      } else {
        return ["Failed", "Error creating job"];
      }
    } else {
      return [
        "Failed",
        "Authentication required. Please login before posting a job.",
      ];
    }
  } catch (error) {
    return ["Failed", `Failed to create job: ${error}`];
  }
};

export const updateJob = async (
  jobId: string,
  jobName: string,
  jobDescription: string,
  jobStartDate: bigint,
  jobDeadline: bigint
): Promise<string[]> => {
  const agent = await agentService.getAgent();

      const payload: UpdateJobPayload = {
        jobName: jobName,
        jobDescription: [jobDescription],
        jobStartDate: jobStartDate,
        jobDeadline: jobDeadline,
      };

      const result = await projcet_backend_single.updateJob(jobId, payload);

      if ("ok" in result) {
        return ["Success", "Successfully updated the job"];
      } else {
        return ["Failed", "Error updating job"];
      }
};

export const viewAllJobs = async (): Promise<JobShared[] | null> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getAllJobs();
    return backendJobsToFrontendJobs(result);
  } catch (error) {
    return null;
  }
};

export const getJobDetail = async (jobId: string): Promise<JobShared | null> => {
  const agent = await agentService.getAgent();

  const result = await projcet_backend_single.getJob(jobId);
  if ("ok" in result) {
    return backendJobToFrontendJob(result.ok);
  }
  return null;
};

export const viewAllJobCategories = async (): Promise<JobCategory[] | null> => {
  const agent = await agentService.getAgent();

  try {
    const result = await projcet_backend_single.getAllJobCategories();
    // console.log("Jobs:", result);
    return result;
  } catch (error) {
    return null;
  }
};

export const getJobById = async (jobId: string): Promise<JobShared | null> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getJob(jobId);
    if ("ok" in result) {
      return backendJobToFrontendJob(result.ok);
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export const getUserJobs = async (userId: string): Promise<JobShared[] | null> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getUserJob(userId);
    return backendJobsToFrontendJobs(result);
  } catch (error) {
    return null;
  }
};

export const deleteJob = async (jobId: string): Promise<string[]> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.deleteJob(jobId);
    if ("ok" in result) {
      return ["Success", "Success delete job"];
    } else {
      return ["Failed", "Error deleting job"];
    }
  } catch (error) {
    return ["Failed", "Failed to delete job"];
  }
};

export const getJobApplier = async (
  jobId: string
): Promise<ApplierPayload[]> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getJobAppliers(jobId);
    if ("ok" in result) {
        const appliers = result.ok;
        const processedUsers: ApplierPayload[] = appliers.map((applierData: { user: BackendUser; appliedAt: bigint; }) => {
            return {
                user: backendUserToFrontendUser(applierData.user),
                appliedAt: applierData.appliedAt,
            };
        });
        return processedUsers;
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const getAcceptedFreelancer = async (jobId: string): Promise<User[]> => {
  const agent = await agentService.getAgent();

  console.log("Getting accepted freelancers for job:", jobId);
  try {
    const result = await projcet_backend_single.getAcceptedFreelancer(jobId);
    if (result) {
        return result.map((backendUser: BackendUser) => {
            return backendUserToFrontendUser(backendUser);
        });
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const startJob = async (
  job_id: string,
  curr_user: User,
): Promise<{ jobStarted: boolean; message: string }> => {
  try {
    // Authenticate the user
    const agent = await agentService.getAgent();
    const curr_job = await getJobById(job_id);

    if(curr_job){
      console.log('Current job found:', curr_job.id, curr_job.jobStatus);
      
      // Check if job is in correct status
      if (curr_job.jobStatus !== 'Open') {
        return {
          jobStarted: false,
          message: `Job status is '${curr_job.jobStatus}', must be 'Open' to start.`,
        };
      }

      const creator_token = await getBalanceController(curr_user);
      console.log("Creator token balance:", creator_token.token_value);
      console.log("Job salary required:", curr_job.jobSalary);
      
      if(creator_token.token_value < curr_job.jobSalary) {
        return {
            jobStarted: false,
            message: `Insufficient Balance. Required: ${curr_job.jobSalary}, Available: ${creator_token.token_value}`,
          };
      }
      const result = await projcet_backend_single.startJob(job_id);
      console.log('Start job backend result:', result);
      
      if ('ok' in result && result.ok) {

          // Handle subAccount safely
          const subAccountData = curr_job.subAccount && curr_job.subAccount.length > 0 ? curr_job.subAccount[0] : null;
          if (!subAccountData) {
            console.warn('No subAccount data found for job:', job_id);
          }

          
          try {
            const transferResult = await transferToJobController(
              curr_user,
              curr_job as unknown as JobShared,
              curr_job.jobSalary
            );
            console.log("Transfer result:", transferResult);
            
            if ("ok" in transferResult) {
              return {
                  jobStarted: true,
                  message: "Job started successfully.",
                };
            } else {
              const errorMsg = 'err' in transferResult ? transferResult.err : 'Transfer failed';
              return {
                jobStarted: false,
                message: `Payment transfer failed: ${errorMsg}`,
              };
            }
          } catch (transferError) {
            console.error('Transfer error:', transferError);

            return {
              jobStarted: false,
              message: `Payment transfer error: ${String(transferError)}`,
            };
          }
      
      } else {
        const errorMessage = 'err' in result ? result.err : 'Unknown error';
        return {
          jobStarted: false,
          message: "Failed to start job: " + errorMessage,
        };
      }
    } else {
      return {
        jobStarted: false,
        message: "Job not found.",
      };
    }
   } catch (error) {
     return {
      jobStarted: false,
      message: "Error: " + String(error),
    };
  }
};

export const getUserJobByStatusFinished = async (
  userId: string
): Promise<JobShared[] | null> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getUserJobByStatusFinished(userId);
    return backendJobsToFrontendJobs(result);
  } catch (error) {
    return null;
  }
};

export const finishJob = async (
  job_id: string
): Promise<{ jobFinished: boolean; message: string }> => {
  try {
    const agent = await agentService.getAgent();
    const result = await projcet_backend_single.finishJob(
      job_id
    );

    if ("ok" in result) {
      const next_result = await transfertoWorkerController(job_id)
        if ("ok" in next_result) {
          return {jobFinished: true, message: "Job posted and transfer completed"};
        } else {
          return {jobFinished: false, message: `Job created but transfer failed: ${next_result.err}`};
        }

    } else {
      return {
        jobFinished: false,
        message: result.err?.toString() || "Failed to finish job.",
      };
    }
  } catch (error) {
    return {
      jobFinished: false,
      message: "An error occurred while finishing the job.",
    };
  }
};
