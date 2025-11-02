import { JobCategory } from "../shared/types/Job";


type CacheState = {
  data: JobCategory[] | null;
  loading: boolean;
  error: any;
};

let cache: CacheState = {
  data: null,
  loading: true,
  error: null,
};

export const getJobCategoriesCache = () => cache;

export const setJobCategoriesCache = (newState: Partial<CacheState>) => {
  cache = { ...cache, ...newState };
};

export const resetJobCategoriesCache = () => {
  cache = {
    data: null,
    loading: true,
    error: null,
  };
};
