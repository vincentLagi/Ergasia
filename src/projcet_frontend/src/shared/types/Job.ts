export interface JobCategory {
  id: string;
  jobCategoryName: string;
}

export interface Job {
    id: string;
    jobName: string;
    jobDescription: string[];
    jobTags: JobCategory[];
    jobSalary: number;
    jobSlots: bigint;
    jobStatus: 'Open' | 'Ongoing' | 'Finished' | 'Cancelled';
    jobRating: number;
    userId: string;
    wallet: number;
    createdAt: bigint;
    updatedAt: bigint;
    subAccount: [] | [Uint8Array];

    // Legacy properties for compatibility
    title?: string;
    description?: string;
    category?: JobCategory;
    budget?: number;
    deadline?: string;
    status?: 'open' | 'ongoing' | 'finished' | 'cancelled';
    clientId?: string;
    freelancerId?: string;
    experienceLevel?: string;
    jobType?: string;
}

export interface JobPayload {
  jobName: string;
  jobDescription: string[];
  jobTags: string[];
  jobSalary: number;
  jobSlots: number;
  jobSkills: string[];
  jobExprienceLevel: string;
  jobProjectType: string;
  jobStartDate: bigint;
  jobDeadline: bigint;
}

export interface UpdateJobPayload {
  jobName: string;
  jobDescription: string[];
  jobStartDate: bigint;
  jobDeadline: bigint;
}

export interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
  coverLetter?: string;
  proposedBudget?: number;
}

export interface JobSubmission {
  id: string;
  jobId: string;
  userId: string;
  title: string;
  description: string;
  link?: string;
  files?: File[];
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}