import { AuthClient } from "@dfinity/auth-client";
import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { Job, User } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import type { JobTransaction } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { HttpAgent } from "@dfinity/agent";
import { getJobById } from "./jobController";
import { agentService } from "../singleton/agentService";
  

export const createJobTransaction = async (ownerId: string, jobId: string): Promise<boolean> => {
    const agent = await agentService.getAgent();
    try {
        await projcet_backend_single.createTransaction(ownerId, jobId);
        console.log("Job transaction created successfully");
        return true;
    } catch (error) {
        console.error("Failed to create job transaction:", error);
        return false;
    }
}

// export const updateFreelancer = async (transactionId: string, freelancerId: string): Promise<boolean> => {
//     const authClient = await AuthClient.create();
//     const identity = authClient.getIdentity();
//     const agent = new HttpAgent({ identity });

//     if (process.env.DFX_NETWORK === "local") {
//         await agent.fetchRootKey();
//     }
//     try {
//         const res = await job_transaction.appendFreelancers(transactionId, freelancerId);
//         if ("ok" in res) {
//             console.log("Freelancer updated successfully:", res.ok);
//             return true;
//         }
//         console.error("Failed to update freelancer:", res.err);
//         return false;
//     }
//     catch (error) {
//         console.error("Failed to update freelancer:", error);
//         return false;
//     }
// }

// This function is likely deprecated or needs to be re-implemented in the single canister.
// export const getAcceptedFreelancers = async (transactionId: string): Promise<User[] | null> => {
//     const agent = await agentService.getAgent();
//     try {
//         const res = await projcet_backend_single.getAcceptedFreelancers(transactionId);
//         if ("ok" in res) {
//             return res.ok;
//         }
//         return null;
//     } catch (error) {
//         console.error("Failed to get accepted freelancers:", error);
//         return null;
//     }
// }

// export const getAllTransactions = async (): Promise<JobTransaction[] | null> => {
//     const authClient = await AuthClient.create();
//     const identity = authClient.getIdentity();
//     const agent = new HttpAgent({ identity });

//     if (process.env.DFX_NETWORK === "local") {
//         await agent.fetchRootKey();
//     }
//     try {
//       const result = await job_transaction.getAllTransactions();
//       return result;
//     } catch (error) {
//       console.error("Failed to get all transactions:", error);
//       return null;
//     }
//   };

// export const getTransactionByJob = async (jobId: string): Promise<JobTransaction | null> => {
//     const authClient = await AuthClient.create();
//     const identity = authClient.getIdentity();
//     const agent = new HttpAgent({ identity });

//     if (process.env.DFX_NETWORK === "local") {
//         await agent.fetchRootKey();
//     }
//     try {
//         const res = await job_transaction.getTransactionByJobId(jobId);
//         if ("ok" in res) {
//             console.log("Transaction:", res.ok);
//             return res.ok;
//         }
//         console.error("Failed to get transaction:", res.err);
//         return null;
//     } catch (error) {
//         console.error("Failed to get transaction:", error);
//         return null;
//     }
// }

// export const getTransactionByClient = async (clientId: string): Promise<JobTransaction [] | null> => {
//     const authClient = await AuthClient.create();
//     const identity = authClient.getIdentity();
//     const agent = new HttpAgent({ identity });

//     if (process.env.DFX_NETWORK === "local") {
//         await agent.fetchRootKey();
//     }
//     try {
//         const res = await job_transaction.getTransactionByClientId(clientId);
//         return res;
//     } catch (error) {
//         console.error("Failed to get transaction:", error);
//         return null;
//     }
// }

export const getActiveTransactionByFreelancer = async (freelancerId: string): Promise<JobTransaction[] | null> => {
    const agent = await agentService.getAgent();
    try {
        const res = await projcet_backend_single.getTransactionByFreelancerId(freelancerId);
        const jobTransactions = await Promise.all(
            res.map(async (jt: JobTransaction) => {
                try {
                    const jobDetail = await getJobById(jt.jobId);
                    if (jobDetail && jobDetail.jobStatus !== "Finished") {
                        return jt; 
                    }
                } catch (error) {
                    console.error("Failed to fetch job details for job ID:", jt.jobId, error);
                }
                return null; 
            })
        );

        const filteredTransactions = jobTransactions.filter((jt): jt is JobTransaction => jt !== null);

        return filteredTransactions;
    } catch (error) {
        console.error("Failed to get transaction:", error);
        return null;
    }
};

export const getClientHistory = async (clientId: string): Promise<JobTransaction [] | null> => {
    const agent = await agentService.getAgent();
    try {
        const res = await projcet_backend_single.getClientHistory(clientId);
        return res;
    } catch (error) {
        console.error("Failed to get client history:", error);
        return null;
    }
}

export const getFreelancerHistory = async (freelancerId: string): Promise<JobTransaction[] | null> => {
    const agent = await agentService.getAgent();
    try {
        const res = await projcet_backend_single.getFreelancerHistory(freelancerId);

        // Use Promise.all to handle asynchronous operations
        const jobTransactions = await Promise.all(
            res.map(async (jt: JobTransaction) => {
                try {
                    // Fetch job details for each transaction
                    const jobDetail = await getJobById(jt.jobId);
                    if (jobDetail && jobDetail.jobStatus === "Finished") {
                        return jt; // Include the transaction if the job is finished
                    }
                } catch (error) {
                    console.error("Failed to fetch job details for job ID:", jt.jobId, error);
                }
                return null; // Exclude the transaction if the job is not finished or an error occurs
            })
        );

        // Filter out null values (transactions that were excluded)
        const filteredTransactions = jobTransactions.filter((jt): jt is JobTransaction => jt !== null);

        return filteredTransactions;
    } catch (error) {
        console.error("Failed to get freelancer history:", error);
        return null;
    }
};