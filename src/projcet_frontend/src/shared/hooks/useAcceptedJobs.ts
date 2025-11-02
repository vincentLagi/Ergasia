import { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import { JobTransaction } from '../../../../declarations/projcet_backend_single/projcet_backend_single.did';
import { getActiveTransactionByFreelancer, getFreelancerHistory } from '../../controller/freelancerController';

type CacheEntry = {
  active: JobTransaction[];
  history: JobTransaction[];
  ts: number;
};

interface UseAcceptedJobsReturn {
  activeJobs: JobTransaction[];
  historyJobs: JobTransaction[];
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * useAcceptedJobs(userId)
 * - Fetches and caches accepted jobs (active + history) for a freelancer.
 * - Simple in-memory cache keyed by userId with a short TTL to minimize network traffic.
 */
export const useAcceptedJobs = (userId: string | undefined): UseAcceptedJobsReturn => {
  const [activeJobs, setActiveJobs] = useState<JobTransaction[]>([]);
  const [historyJobs, setHistoryJobs] = useState<JobTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  // 1-minute TTL cache
  const CACHE_TTL_MS = 60_000;
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());

  const fetchData = useCallback(async () => {
    if (!userId) {
      setActiveJobs([]);
      setHistoryJobs([]);
      return;
    }

    const now = Date.now();
    const cached = cacheRef.current.get(userId);
    if (cached && now - cached.ts < CACHE_TTL_MS) {
      setActiveJobs(cached.active);
      setHistoryJobs(cached.history);
      return;
    }

    setLoading(true);
    try {
      const [active, history] = await Promise.all([
        getActiveTransactionByFreelancer(userId),
        getFreelancerHistory(userId),
      ]);

      const safeActive = active ?? [];
      const safeHistory = history ?? [];

      setActiveJobs(safeActive);
      setHistoryJobs(safeHistory);

      cacheRef.current.set(userId, {
        active: safeActive,
        history: safeHistory,
        ts: now,
      });
    } catch (err) {
      console.error('Failed to fetch accepted jobs:', err);
      message.error('Failed to load accepted jobs');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const refetch = useCallback(async () => {
    if (!userId) return;
    cacheRef.current.delete(userId);
    await fetchData();
  }, [userId, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    activeJobs,
    historyJobs,
    loading,
    refetch,
  };
};