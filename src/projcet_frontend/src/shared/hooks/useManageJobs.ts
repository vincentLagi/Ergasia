import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { getUserJobs, deleteJob } from '../../controller/jobController';
import { Job } from '../types/Job';
import { useAuth } from '../../hooks/useAuth';

interface UseManageJobsReturn {
  jobs: Job[];
  loading: boolean;
  filteredJobs: Job[];
  searchQuery: string;
  selectedStatus: string;
  setSearchQuery: (query: string) => void;
  setSelectedStatus: (status: string) => void;
  handleDeleteJob: (jobId: string) => Promise<void>;
  refreshJobs: () => void;
}

export const useManageJobs = (): UseManageJobsReturn => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userJobs = await getUserJobs(user.id);
      if (userJobs) {
        setJobs(userJobs);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      message.error('Failed to fetch jobs.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshKey]);

  const handleDeleteJob = async (jobId: string) => {
      try {
        await deleteJob(jobId);
        message.success('Job deleted successfully.');
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        console.error('Error deleting job:', err);
        message.error('Failed to delete job.');
      }
  };

  const refreshJobs = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = job.jobName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
      console.log(selectedStatus, job.jobStatus)
    const matchesStatus =
      selectedStatus === 'all' || job.jobStatus === selectedStatus;
    return matchesSearch && matchesStatus;
  });
  return {
    jobs,
    loading,
    filteredJobs,
    searchQuery,
    selectedStatus,
    setSearchQuery,
    setSelectedStatus,
    handleDeleteJob,
    refreshJobs,
  };
};