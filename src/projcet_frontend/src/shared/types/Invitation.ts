import { Job } from "./Job";
import { User } from "./User";

export interface Invitation {
    id: number;
    user_id: string;
    job_id: string;
    invitedAt: number;
    isAccepted : boolean;
};

export interface UserInvitationPayload {
    id : bigint;
    job : Job;
    invitedAt: bigint;
    isAccepted : boolean;
};

export interface JobInvitationPayload {
    id : number;
    user : User;
    isAccepted : boolean;
}