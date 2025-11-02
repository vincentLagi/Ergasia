import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import {
  jobsAtom,
  jobCategoriesAtom,
  selectedJobAtom,
  filteredJobsAtom,
  jobFiltersAtom,
  jobSearchQueryAtom,
  jobsCurrentPageAtom,
  jobActionsAtom,
  recommendedJobsAtom,
  savedJobsAtom,
  isSavedJobAtom,
  jobStatsAtom,
  paginatedJobsAtom,
  jobsLoadingAtom,
  jobCategoriesLoadingAtom
} from '../../app/store/jobs';
import { notificationActionsAtom } from '../../app/store/ui';
import { Job, JobCategory } from '../types/Job';
import { 
  viewAllJobs, 
  viewAllJobCategories,
  getJobById 
} from '../../controller/jobController';

export interface UseJobsReturn {
  // Data
  jobs: Job[];
  jobCategories: JobCategory[];
  selectedJob: Job | null;
  filteredJobs: Job[];
  paginatedJobs: Job[];
  recommendedJobs: Job[];
  jobStats: any;
  
  // State
  filters: any;
  searchQuery: string;
  currentPage: number;
  isLoading: boolean;
  
  // Actions
  fetchJobs: () => Promise<void>;
  fetchJobCategories: () => Promise<void>;
  fetchJobById: (jobId: string) => Promise<void>;
  updateFilters: (filters: any) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  saveJob: (jobId: string) => void;
  unsaveJob: (jobId: string) => void;
  isSaved: (jobId: string) => boolean;
  clearFilters: () => void;
}

export const useJobs = (): UseJobsReturn => {
  const [jobs] = useAtom(jobsAtom);
  const [jobCategories] = useAtom(jobCategoriesAtom);
  const [selectedJob] = useAtom(selectedJobAtom);
  const [filteredJobs] = useAtom(filteredJobsAtom);
  const [paginatedJobs] = useAtom(paginatedJobsAtom);
  const [recommendedJobs] = useAtom(recommendedJobsAtom);
  const [jobStats] = useAtom(jobStatsAtom);
  const [jobsLoading] = useAtom(jobsLoadingAtom);
  const [jobCategoriesLoading] = useAtom(jobCategoriesLoadingAtom);
  
  const [filters] = useAtom(jobFiltersAtom);
  const [searchQuery, setSearchQueryAtom] = useAtom(jobSearchQueryAtom);
  const [currentPage, setCurrentPageAtom] = useAtom(jobsCurrentPageAtom);
  const [savedJobs] = useAtom(savedJobsAtom);
  const [, saveJobAction] = useAtom(isSavedJobAtom);
  
  const [, jobActions] = useAtom(jobActionsAtom);
  const [, notificationActions] = useAtom(notificationActionsAtom);

  // Fetch all jobs
  const fetchJobs = useCallback(async () => {
    try {
      jobActions({ type: 'SET_JOBS_LOADING', loading: true });
      const jobsData = await viewAllJobs();
      if (jobsData) {
        // Jobs are already converted to frontend format in the controller
        jobActions({ type: 'SET_JOBS', jobs: jobsData });
        console.log(jobsData);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      notificationActions({
        type: 'ADD',
        notification: {
          type: 'error',
          title: 'Error',
          message: 'Failed to load jobs. Please try again.',
        }
      });
    } finally {
      jobActions({ type: 'SET_JOBS_LOADING', loading: false });
    }
  }, [jobActions, notificationActions]);
  // Fetch job categories
  const fetchJobCategories = useCallback(async () => {
    try {
      jobActions({ type: 'SET_CATEGORIES_LOADING', loading: true });
      const categories = await viewAllJobCategories();
      if (categories) {
        jobActions({ type: 'SET_CATEGORIES', categories });
      }
    } catch (error) {
      console.error('Failed to fetch job categories:', error);
      notificationActions({
        type: 'ADD',
        notification: {
          type: 'error',
          title: 'Error',
          message: 'Failed to load job categories.',
        }
      });
    } finally {
      jobActions({ type: 'SET_CATEGORIES_LOADING', loading: false });
    }
  }, [jobActions, notificationActions]);

  // Fetch job by ID
  const fetchJobById = useCallback(async (jobId: string) => {
    try {
      const job = jobs.find(j => j.id === jobId);
      if (job) {
        jobActions({ type: 'SET_SELECTED_JOB', job });
      } else {
        // If not in current jobs list, fetch from API
        const jobData = await getJobById(jobId);
        if (jobData) {
          // Job is already in frontend format from controller
          jobActions({ type: 'SET_SELECTED_JOB', job: jobData });
        }
      }
    } catch (error) {
      console.error('Failed to fetch job:', error);
      notificationActions({
        type: 'ADD',
        notification: {
          type: 'error',
          title: 'Error',
          message: 'Failed to load job details.',
        }
      });
    }
  }, [jobs, jobActions, notificationActions]);

  // Update filters
  const updateFilters = useCallback((newFilters: any) => {
    jobActions({ type: 'UPDATE_FILTERS', filters: newFilters });
    setCurrentPageAtom(1); // Reset to first page when filters change
  }, [jobActions, setCurrentPageAtom]);

  // Set search query
  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryAtom(query);
    setCurrentPageAtom(1); // Reset to first page when search changes
  }, [setSearchQueryAtom, setCurrentPageAtom]);

  // Set current page
  const setCurrentPage = useCallback((page: number) => {
    setCurrentPageAtom(page);
  }, [setCurrentPageAtom]);

  // Save job
  const saveJob = useCallback((jobId: string) => {
    saveJobAction({ jobId, save: true });
    notificationActions({
      type: 'ADD',
      notification: {
        type: 'success',
        title: 'Job Saved',
        message: 'Job has been added to your saved jobs.',
        duration: 3000,
      }
    });
  }, [saveJobAction, notificationActions]);

  // Unsave job
  const unsaveJob = useCallback((jobId: string) => {
    saveJobAction({ jobId, save: false });
    notificationActions({
      type: 'ADD',
      notification: {
        type: 'info',
        title: 'Job Removed',
        message: 'Job has been removed from your saved jobs.',
        duration: 3000,
      }
    });
  }, [saveJobAction, notificationActions]);

  // Check if job is saved
  const isSaved = useCallback((jobId: string) => {
    return savedJobs.includes(jobId);
  }, [savedJobs]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    jobActions({ 
      type: 'UPDATE_FILTERS', 
      filters: {
        categories: [],
        priceRanges: [],
        experienceLevel: [],
        jobType: [],
        sortBy: 'newest' as const
      }
    });
    setSearchQueryAtom('');
    setCurrentPageAtom(1);
  }, [jobActions, setSearchQueryAtom, setCurrentPageAtom]);

  // Initialize data on mount
  useEffect(() => {
    if (jobs.length === 0) {
      fetchJobs();
    }
    if (jobCategories.length === 0) {
      fetchJobCategories();
    }
  }, [jobs.length, jobCategories.length, fetchJobs, fetchJobCategories]);

  return {
    // Data
    jobs,
    jobCategories,
    selectedJob,
    filteredJobs,
    paginatedJobs,
    recommendedJobs,
    jobStats,
    
    // State
    filters,
    searchQuery,
    currentPage,
    isLoading: jobsLoading || jobCategoriesLoading,
    
    // Actions
    fetchJobs,
    fetchJobCategories,
    fetchJobById,
    updateFilters,
    setSearchQuery,
    setCurrentPage,
    saveJob,
    unsaveJob,
    isSaved,
    clearFilters,
  };
};