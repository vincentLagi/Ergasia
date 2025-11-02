import { User } from "../shared/types/User";

export interface Submission {
    id: string;
    jobId: string;
    user: User;
    submissionStatus: string;
    submissionMessage?: string;
    submissionFile?: string;
  }
  