import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { Job, User } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { ApplierPayload } from "../shared/types/Applier";
import { agentService } from "../singleton/agentService";
import { isFreelancerRegistered } from "./jobTransactionController";


export const applyJob = async (userId: string, jobId : string): Promise<boolean> => {
    const agent = await agentService.getAgent();
    try {
        const isRegitered = await isFreelancerRegistered(jobId, userId);
        if(isRegitered[0] == "succ" && isRegitered[1] == "false"){
            
            const result = await projcet_backend_single.applyJob(userId, jobId);
            
            if ("ok" in result) {
                console.log("Applied for job:", result.ok);
                return true;
            } else {
                console.error("Error applying for job:", result.err);
                return false;
            }
            
        }else{
            return false;
        }

    } catch (error) {
        console.error("Failed to apply for job:", error);
        return false;
    }
};

export const acceptApplier = async (userId: string, jobId: string): Promise<boolean> => {
    const agent = await agentService.getAgent();
    try {
        const result = await projcet_backend_single.acceptApplier(userId, jobId);
        if ("ok" in result) {
            return true; // Success: Applier was accepted
        } else {
            console.error("Failed to accept applier:", result.err);
            return false; // Failure: Handle the error
        }
    } catch (error) {
        console.error("Unexpected error while accepting applier:", error);
        return false; // Failure: Handle unexpected errors
    }
};

export const rejectApplier = async (userId: string, jobId: string): Promise<boolean> => {
    const agent = await agentService.getAgent();
    
    try {
        const result = await projcet_backend_single.rejectApplier(userId, jobId);
        if ("ok" in result) {
            return true; // Success: Applier was rejected
        } else {
            console.error("Failed to reject applier:", result.err);
            return false; // Failure: Handle the error
        }
    } catch (error) {
        console.error("Unexpected error while rejecting applier:", error);
        return false; // Failure: Handle unexpected errors
    }
};

export const getUserApply = async (userId: string): Promise<Job[] | null> => {
    const agent = await agentService.getAgent();
    try {
        const result = await projcet_backend_single.getUserApply(userId);
        console.log("User applied jobs:", result);
        return result;
    } catch (error) {
        console.error("Failed to get user applied jobs:", error);
        return null;
    }
}


export const hasUserApplied = async (userId: string, jobId: string): Promise<boolean> => {
    const result = await projcet_backend_single.hasUserApplied(userId, jobId);
    return result;
}
