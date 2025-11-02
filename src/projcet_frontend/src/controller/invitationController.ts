import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { Invitation } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { UserInvitationPayload } from "../shared/types/Invitation";
import { getJobById } from "./jobController";

export const createInvitation = async (
  job_id: string,
  freelancer_id: string,
  currentUserId: string
):  Promise<string[]> => {
    
      const checkInvitation = await projcet_backend_single.getInvitationByUserIdAndJobId(currentUserId, job_id)
      if(checkInvitation.length > 0) return ["Failed", "Invitation already exists."];

      const result = await projcet_backend_single.createInvitation(
        String(currentUserId),
        job_id,
        freelancer_id,
      );

      if ("err" in result) {
        console.error("Error creating invitation:", result.err);
        return ["Failed", result.err];
      }
  
      return ["Success", "Success creating invitaion"];
};

export const getInvitationByUserId = async (
  userId: string
): Promise<UserInvitationPayload[]> => {
  const backendInvitations = await projcet_backend_single.getInvitationByUserID(
    userId,
  );

  // Convert backend invitations to frontend format
  const convertedInvitations: UserInvitationPayload[] = await Promise.all(
    backendInvitations.map(async (invitation) => {
      const job = await getJobById(invitation.jobId);
      return {
        id: invitation.id,
        job: job || {} as any, // TODO: Handle case where job is not found
        invitedAt: invitation.createdAt,
        isAccepted: invitation.status === "accepted",
      };
    })
  );

  return convertedInvitations;
};

export const acceptInvitation = async (
  userId: string,
  invitationId: bigint
): Promise<boolean> => {
  const result = await projcet_backend_single.acceptInvitation(
    userId,
    invitationId,
  );

  return result;
};

export const rejectInvitation = async (
  userId: string,
  invitationId: bigint
): Promise<boolean> => {
  const result = await projcet_backend_single.rejectInvitation(userId, invitationId);

  return result;
};
