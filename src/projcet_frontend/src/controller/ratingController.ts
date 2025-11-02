import { User } from "../shared/types/User";
import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import {
  RequestRatingPayload,
  Rating as HistoryRatingPayload,
} from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { agentService } from "../singleton/agentService";
import { backendUserToFrontendUser } from "../utils/typeConverters";

export interface JobRatingPayload {
  rating_id: number;
  user: User;
  rating: number;
  isEdit: boolean;
}

export const getFreelancerForRating = async (
  job_id: string,
  userId: string
): Promise<JobRatingPayload[]> => {
  const agent = await agentService.getAgent();

  try {
    const result = await projcet_backend_single.getRatingByJobId(
      job_id,
      userId,
    );
    if ("ok" in result) {
      const transformedRatings = result.ok.map((rating) => {
        return {
          ...rating,
          rating_id: Number(rating.rating_id),
          rating: Number(rating.rating),
          user: backendUserToFrontendUser(rating.user),
        };
      });

      return transformedRatings as unknown as JobRatingPayload[];
    } else {
      console.error("Failed to fetch freelancer ratings:", result.err);
      return [];
    }
  } catch (error) {
    console.error("Error fetching freelancer ratings:", error);
    return [];
  }
};
export const ratingUser = async (
  payloads: RequestRatingPayload[]
): Promise<string> => {
  try {
    await agentService.getAgent();

    const result = await projcet_backend_single.ratingUser(payloads);

    if ("ok" in result) {
      return result.ok;
    } else {
      console.error("Failed to rate users:", result.err);
      return result.err;
    }
  } catch (error) {
    console.error("Error rating users:", error);
    if (error instanceof Error) {
      return error.message;
    }
    return "An unexpected error occurred while rating users.";
  }
};

export const getRatingByUserIdJobId = async (
  jobId: string,
  userId: string
): Promise<HistoryRatingPayload | string> => {
  const agent = await agentService.getAgent();
  console.log("Fetching rating for jobId:", jobId, "and userId:", userId);
  const result = await projcet_backend_single.getRatingByUserIdJobId(
    jobId,
    userId,
  );
  if ("ok" in result) {
    return result.ok;
  } else {
    console.error("Failed to rate user:", result.err);
    return result.err;
  }
};

export const createRating = async (
  jobId: string,
  userIds: string[]
): Promise<string> => {
  try {
    await agentService.getAgent();

    if (!jobId || jobId.trim().length === 0) {
      return "Job ID cannot be empty";
    }
    if (!userIds || userIds.length === 0) {
      return "User IDs list cannot be empty";
    }

    const result = await projcet_backend_single.createRating(jobId, userIds);

    if ("ok" in result) {
      return result.ok;
    } else {
      console.error("Failed to create ratings:", result.err);
      return result.err;
    }
  } catch (error) {
    console.error("Error creating ratings:", error);
    return "Error creating ratings. Please try again later.";
  }
};
