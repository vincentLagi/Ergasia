import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { Job, JobCategory, JobApplication, JobSubmission } from '../../shared/types/Job';

// import { Job, JobCategory} from '../../shared/types/Job';



// Jobs data atoms
export const jobsAtom = atom<Job[]>([]);
export const jobCategoriesAtom = atom<JobCategory[]>([]);
export const selectedJobAtom = atom<Job | null>(null);
export const jobsLoadingAtom = atom<boolean>(false);
export const jobCategoriesLoadingAtom = atom<boolean>(false);

// Job filters atoms
export const jobFiltersAtom = atom({
  categories: [] as string[],
  priceRanges: [] as string[],
  experienceLevel: [] as string[],
  jobType: [] as string[],
  sortBy: 'newest' as 'newest' | 'oldest' | 'salary_high' | 'salary_low' | 'deadline',
});

// Search and pagination atoms
export const jobSearchQueryAtom = atom('');
export const jobsCurrentPageAtom = atom(1);
export const jobsPerPageAtom = atom(12);

// Derived atoms for filtered jobs
export const filteredJobsAtom = atom((get) => {
  const jobs = get(jobsAtom);
  const searchQuery = get(jobSearchQueryAtom);
  const filters = get(jobFiltersAtom);

  let filtered = jobs.filter(job => job.jobStatus !== 'Finished');


  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(job =>
      job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobDescription.some((desc: string) =>
        desc.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }

  // Apply category filter
  if (filters.categories.length > 0) {
    filtered = filtered.filter(job =>
      job.jobTags.some((tag: JobCategory) => filters.categories.includes(tag.jobCategoryName))
    );
  }

  // Apply price range filter
  if (filters.priceRanges.length > 0) {
    filtered = filtered.filter(job => {
      return filters.priceRanges.some(range => {
        const [min, max] = range === '2000+'
          ? [2000, Infinity]
          : range.split('-').map(Number);
        return job.jobSalary >= min && job.jobSalary < max;
      });
    });
  }

  // Apply experience level filter
  if (filters.experienceLevel.length > 0) {
    filtered = filtered.filter(job =>
      job.experienceLevel && filters.experienceLevel.includes(job.experienceLevel)
    );
  }

  // Apply job type filter
  if (filters.jobType.length > 0) {
    filtered = filtered.filter(job =>
      job.jobType && filters.jobType.includes(job.jobType)
    );
  }


  switch (filters.sortBy) {
    case 'newest':
      filtered.sort((a, b) => Number(b.createdAt - a.createdAt));
      break;
    case 'oldest':
      filtered.sort((a, b) => Number(a.createdAt - b.createdAt));
      break;
    case 'salary_high':
      filtered.sort((a, b) => b.jobSalary - a.jobSalary);
      break;
    case 'salary_low':
      filtered.sort((a, b) => a.jobSalary - b.jobSalary);
      break;
    case 'deadline':
      filtered.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
      break;
  }

  return filtered;
});


export const paginatedJobsAtom = atom((get) => {
  const filtered = get(filteredJobsAtom);
  const currentPage = get(jobsCurrentPageAtom);
  const perPage = get(jobsPerPageAtom);
  
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  
  return filtered.slice(startIndex, endIndex);
});
// Job statistics atoms
export const jobStatsAtom = atom((get) => {
  const jobs = get(jobsAtom);
  console.log(jobs);
  return {
    total: jobs.length,
    open: jobs.filter(job => job.jobStatus.toLowerCase() === 'open').length,
    inProgress: jobs.filter(job => job.jobStatus.toLowerCase() === 'ongoing').length,
    completed: jobs.filter(job => job.jobStatus.toLowerCase() === 'finished').length,
    totalValue: jobs.reduce((sum, job) => sum + job.jobSalary, 0),
  };
});

// Recommendation atoms
export const recommendedJobsAtom = atom<Job[]>([]);
export const recommendationStartIndexAtom = atom(0);

// Job actions atom
export const jobActionsAtom = atom(
  null,
  (get, set, action: 
    | { type: 'SET_JOBS'; jobs: Job[] }
    | { type: 'ADD_JOB'; job: Job }
    | { type: 'UPDATE_JOB'; jobId: string; updates: Partial<Job> }
    | { type: 'DELETE_JOB'; jobId: string }
    | { type: 'SET_CATEGORIES'; categories: JobCategory[] }
    | { type: 'SET_SELECTED_JOB'; job: Job | null }
    | { type: 'SET_RECOMMENDATIONS'; jobs: Job[] }
    | { type: 'UPDATE_FILTERS'; filters: Partial<{ categories: string[]; priceRanges: string[]; experienceLevel: string[]; jobType: string[]; sortBy: 'newest' | 'oldest' | 'salary_high' | 'salary_low' | 'deadline'; }> }
    | { type: 'SET_JOBS_LOADING'; loading: boolean }
    | { type: 'SET_CATEGORIES_LOADING'; loading: boolean }
  ) => {
    switch (action.type) {
      case 'SET_JOBS':
        set(jobsAtom, action.jobs);
        break;
      case 'ADD_JOB':
        set(jobsAtom, (prev) => [...prev, action.job]);
        break;
      case 'UPDATE_JOB':
        set(jobsAtom, (prev) =>
          prev.map(job =>
            job.id === action.jobId ? { ...job, ...action.updates } : job
          )
        );
        break;
      case 'DELETE_JOB':
        set(jobsAtom, (prev) => prev.filter(job => job.id !== action.jobId));
        break;
      case 'SET_CATEGORIES':
        set(jobCategoriesAtom, action.categories);
        break;
      case 'SET_SELECTED_JOB':
        set(selectedJobAtom, action.job);
        break;
      case 'SET_RECOMMENDATIONS':
        set(recommendedJobsAtom, action.jobs);
        break;
      case 'UPDATE_FILTERS':
        set(jobFiltersAtom, (prev) => ({ ...prev, ...action.filters }));
        break;
      case 'SET_JOBS_LOADING':
        set(jobsLoadingAtom, action.loading);
        break;
      case 'SET_CATEGORIES_LOADING':
        set(jobCategoriesLoadingAtom, action.loading);
        break;
    }
  }
);

// // Saved jobs atom (for bookmarking)
export const savedJobsAtom = atomWithStorage<string[]>('savedJobs', []);
export const isSavedJobAtom = atom(
  (get) => (jobId: string) => get(savedJobsAtom).includes(jobId),
  (get, set, { jobId, save }: { jobId: string; save: boolean }) => {
    const saved = get(savedJobsAtom);
    if (save && !saved.includes(jobId)) {
      set(savedJobsAtom, [...saved, jobId]);
    } else if (!save && saved.includes(jobId)) {
      set(savedJobsAtom, saved.filter(id => id !== jobId));
    }
  }
);
