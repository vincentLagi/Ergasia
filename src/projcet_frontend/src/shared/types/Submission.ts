import { User } from "./User";

export interface Submission {
  id : string,
  submissionMessage : string,
  user : User,
  jobId : string,
  submissionStatus : string,
  submissionFile : string,
}