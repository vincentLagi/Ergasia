import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { Submission, User } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { agentService } from "../singleton/agentService";

export const createSubmission = async (
    jobId: string,
    user: any,
    submissionFilePath: string,
    submissionMessage: string
): Promise<string[]> => {
    try {

        if (typeof user.createdAt === 'string' && typeof user.updatedAt === 'string') {
            user.createdAt = BigInt(user.createdAt);
            user.updatedAt = BigInt(user.updatedAt);
        }

        if (user.profilePicture instanceof Blob) {
            const ab = await user.profilePicture.arrayBuffer();
            user.profilePicture = new Uint8Array(ab);
        } else if (!user.profilePicture) {
            user.profilePicture = new Uint8Array([]);
        } else if (!(user.profilePicture instanceof Uint8Array)) {
            if (Array.isArray(user.profilePicture)) {
                user.profilePicture = new Uint8Array(user.profilePicture as number[]);
            } else if (typeof user.profilePicture === 'object') {
                const values = Object.values(user.profilePicture) as number[];
                user.profilePicture = new Uint8Array(values);
            } else if (typeof user.profilePicture === 'string') {
                user.profilePicture = new Uint8Array([]);
            } else {
                user.profilePicture = new Uint8Array([]);
            }
        }

        const result = await projcet_backend_single.createSubmission(jobId, user.id, submissionFilePath, submissionMessage);

        if ("ok" in result) {
            return ["Ok"];
        } else {
            throw new Error(result.err);
        }
    } catch (error) {
        throw new Error("Failed to create submission: " + error);
    }
};


export const getAllSubmissionbyUserJobId = async (user: User, jobId: string): Promise<Submission[]> => {
    const result = await projcet_backend_single.getAllSubmissions();

    const filteredSubmissions = result.filter(sub => 
        sub.userId === user.id && sub.jobId === jobId
    );

    return filteredSubmissions;
};

export const getFileSubmissionbyId = async (id: string): Promise<string | null> => {
    try {
        const res = await projcet_backend_single.getFileSubmissionbyId(id);
        if (res && res.length > 0 && typeof res[0] === 'string') {
            return res[0] as string;
        } else {
            return null;
        }
    } catch (err) {
        console.error('Error fetching file path:', err);
        return null;
    }
};

export const getSubmissionByJobId =  async (jobId: string): Promise<Submission[]> => {
    const agent = await agentService.getAgent();

    try {
        console.log("Submissions:");
        const result = await projcet_backend_single.getSubmissionByJobId(jobId);
        if ("ok" in result) {
            return result.ok;
        } else {
            throw new Error(result.err);
        }
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
}

export const updateSubmissionStatus = async (
    submissionId: string,
    newStatus: string,
    message: string
): Promise<string[]> => {
    const agent = await agentService.getAgent();
    try {
        const result = await projcet_backend_single.updateSubmissionStatus(submissionId, newStatus, message);

        if ("ok" in result) {
            return ["Ok"];
        } else {
            throw new Error(result.err);
        }
    } catch (error) {
        throw new Error("Failed to update submission status: " + error);
    }
};

export const getSubmissionAcceptbyUserId = async (userId: string): Promise<any[]> => {
    try {
        const result = await projcet_backend_single.getSubmissionAcceptbyUserId(userId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
};

// Get submissions by userId where status is "Waiting"
export const getSubmissionWaitingbyUserId = async (userId: string): Promise<any[]> => {
    try {
        const result = await projcet_backend_single.getSubmissionWaitingbyUserId(userId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
};

// Get submissions by userId where status is "Reject"
export const getSubmissionRejectbyUserId = async (userId: string): Promise<any[]> => {
    try {
        const result = await projcet_backend_single.getSubmissionRejectbyUserId(userId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
};

// Get submissions by jobId where status is "Accept"
export const getSubmissionAcceptbyJobId = async (jobId: string): Promise<any[]> => {
    try {
        const result = await projcet_backend_single.getSubmissionAcceptbyJobId(jobId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
};

// Get submissions by jobId where status is "Waiting"
export const getSubmissionWaitingbyJobId = async (jobId: string): Promise<any[]> => {
    try {
        const result = await projcet_backend_single.getSubmissionWaitingbyJobId(jobId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
};

// Get submissions by jobId where status is "Reject"
export const getSubmissionRejectbyJobId = async (jobId: string): Promise<any[]> => {
    try {
        const result = await projcet_backend_single.getSubmissionRejectbyJobId(jobId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch submissions: " + error);
    }
};

export const getUserSubmissionsByJobId = async (jobId: string, userId: string): Promise<Submission[]> => {
    try {
        const result = await projcet_backend_single.getUserSubmissionsByJobId(jobId, userId);
        return result;
    } catch (error) {
        throw new Error("Failed to fetch user submissions by job: " + error);
    }
};