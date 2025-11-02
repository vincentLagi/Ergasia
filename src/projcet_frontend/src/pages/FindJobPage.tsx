import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Space, 
  Tag, 
  Pagination, 
  Empty,
  Spin,
  Drawer,
  Checkbox,
  Slider,
  Select,
  Typography
} from 'antd';
import { 
  FilterOutlined, 
  AppstoreOutlined, 
  UnorderedListOutlined,
  SortAscendingOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Navbar, SearchBar, JobCard } from '../ui/components';
import { useJobs } from '../shared/hooks/useJobs';
import { useDebouncedSearch } from '../shared/hooks/useDebounce';
import { useLocalStorage } from '../shared/hooks/useLocalStorage';

const { Title, Text } = Typography;
const { Option } = Select;

// Price range options
const PRICE_RANGES = [
  { label: "Under $100", value: "0-100", min: 0, max: 100 },
  { label: "$100 - $500", value: "100-500", min: 100, max: 500 },
  { label: "$500 - $1000", value: "500-1000", min: 500, max: 1000 },
  { label: "$1000 - $2000", value: "1000-2000", min: 1000, max: 2000 },
  { label: "$2000+", value: "2000+", min: 2000, max: Infinity },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Oldest First', value: 'oldest' },
  { label: 'Highest Pay', value: 'salary_high' },
  { label: 'Lowest Pay', value: 'salary_low' },
  { label: 'Deadline Soon', value: 'deadline' },
];

const FindJobPage: React.FC = memo(() => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('job-view-mode', 'grid');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState<[number, number]>([0, 5000]);
  const [sortBy, setSortBy] = useState('newest');
  
  // Add comprehensive loading state management
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  const {
    jobs,
    jobCategories,
    filteredJobs,
    paginatedJobs,
    currentPage,
    setCurrentPage,
    setSearchQuery,
    updateFilters,
    isLoading
  } = useJobs();

  const { searchValue, debouncedSearchValue, setSearchValue } = useDebouncedSearch('', 300);

  // Handle initial loading state more carefully
  useEffect(() => {
    console.log('FindJobPage loading state:', { isLoading, jobCategories: jobCategories.length, jobs: jobs.length, hasInitiallyLoaded, isInitializing });
    
    // Consider it loaded when we're not loading anymore, regardless of data availability
    if (!isLoading) {
      setHasInitiallyLoaded(true);
      setIsInitializing(false);
    }
  }, [isLoading, jobCategories.length, jobs.length, hasInitiallyLoaded, isInitializing]);

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isInitializing) {
        console.warn('Loading timeout reached, forcing initialization complete');
        setLoadingTimeout(true);
        setHasInitiallyLoaded(true);
        setIsInitializing(false);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [isInitializing]);

  // Additional check for when jobs data is available
  useEffect(() => {
    if (jobs && Array.isArray(jobs) && hasInitiallyLoaded) {
      setIsInitializing(false);
    }
  }, [jobs, hasInitiallyLoaded]);

  // Update search query when debounced value changes
  useEffect(() => {
    setSearchQuery(debouncedSearchValue);
  }, [debouncedSearchValue, setSearchQuery]);

  // Update filters when local state changes
  useEffect(() => {
    updateFilters({
      categories: selectedCategories,
      priceRanges: selectedPriceRanges,
      sortBy
    });
  }, [selectedCategories, selectedPriceRanges, sortBy, updateFilters]);

  // Memoized filter handlers
  const handleCategoryChange = useCallback((checkedValues: string[]) => {
    setSelectedCategories(checkedValues);
  }, []);

  const handlePriceRangeChange = useCallback((checkedValues: string[]) => {
    setSelectedPriceRanges(checkedValues);
  }, []);

  const handleSalaryRangeChange = useCallback((value: number | number[]) => {
    if (Array.isArray(value) && value.length === 2) {
      setSalaryRange([value[0], value[1]]);
    }
  }, []);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
  }, []);

  const toggleFilters = useCallback(() => {
    setFiltersVisible(prev => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedPriceRanges([]);
    setSalaryRange([0, 5000]);
    setSortBy('newest');
  }, []);

  // Memoized filter content
  const filterContent = useMemo(() => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Title level={4} className="mb-0 text-gray-800">Filters</Title>
        <Button 
          type="text" 
          size="small" 
          onClick={clearFilters}
          className="text-blue-600 hover:text-blue-800"
        >
          Clear All
        </Button>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <Title level={5} className="mb-3 text-gray-700 font-semibold">
          Job Categories
        </Title>
        <div className="max-h-48 overflow-y-auto">
          <Checkbox.Group
            value={selectedCategories}
            onChange={handleCategoryChange}
            className="flex flex-col space-y-3"
          >
            {jobCategories.map(category => (
              <Checkbox 
                key={category.id} 
                value={category.jobCategoryName}
                className="hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <span className="text-sm font-medium">{category.jobCategoryName}</span>
              </Checkbox>
            ))}
          </Checkbox.Group>
        </div>
      </div>

      {/* Price Ranges */}
      <div className="space-y-4">
        <Title level={5} className="mb-3 text-gray-700 font-semibold">
          Budget Range
        </Title>
        <div className="space-y-3">
          {PRICE_RANGES.map(range => (
            <Checkbox 
              key={range.value} 
              value={range.value}
              className="hover:bg-gray-50 p-2 rounded-lg transition-colors w-full"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-sm font-medium">{range.label}</span>
                <span className="text-xs text-gray-500">
                  {range.min === 0 ? 'Any' : `$${range.min}+`}
                </span>
              </div>
            </Checkbox>
          ))}
        </div>
      </div>

      {/* Salary Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Title level={5} className="mb-0 text-gray-700 font-semibold">
            Salary Range
          </Title>
          <div className="text-sm font-medium text-blue-600">
            ${salaryRange[0]} - ${salaryRange[1]}
          </div>
        </div>
        <div className="px-2">
          <Slider
            range
            min={0}
            max={5000}
            step={100}
            value={salaryRange}
            onChange={handleSalaryRangeChange}
            tooltip={{ 
              formatter: (value) => `$${value}`,
              placement: 'top'
            }}
            trackStyle={[{ backgroundColor: '#6366f1' }]}
            handleStyle={[
              { borderColor: '#6366f1' },
              { borderColor: '#6366f1' }
            ]}
            railStyle={{ backgroundColor: '#e5e7eb' }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>$0</span>
          <span>$5,000+</span>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(selectedCategories.length > 0 || selectedPriceRanges.length > 0) && (
        <div className="space-y-3">
          <Title level={5} className="mb-2 text-gray-700 font-semibold">
            Active Filters
          </Title>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <Tag
                key={category}
                closable
                onClose={() => handleCategoryChange(
                  selectedCategories.filter(c => c !== category)
                )}
                className="bg-blue-100 text-blue-800 border-blue-200"
              >
                {category}
              </Tag>
            ))}
            {selectedPriceRanges.map(range => (
              <Tag
                key={range}
                closable
                onClose={() => handlePriceRangeChange(
                  selectedPriceRanges.filter(r => r !== range)
                )}
                className="bg-green-100 text-green-800 border-green-200"
              >
                {PRICE_RANGES.find(p => p.value === range)?.label}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  ), [
    jobCategories,
    selectedCategories,
    selectedPriceRanges,
    salaryRange,
    handleCategoryChange,
    handlePriceRangeChange,
    handleSalaryRangeChange,
    clearFilters
  ]);

  // Improved job grid rendering with proper loading sequence
  const renderJobGrid = () => {
    // Show loading only when actually loading
    if (isLoading || isInitializing) {
      return (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" tip="Loading jobs..." />
        </div>
      );
    }

    // Show empty state when loaded but no jobs found
    if (hasInitiallyLoaded && !isLoading && paginatedJobs.length === 0) {
      return (
        <Empty
          description="No jobs found matching your criteria"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className="py-20"
        >
          <Button type="primary" onClick={clearFilters}>
            Clear Filters
          </Button>
        </Empty>
      );
    }

    // Show jobs when available
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${currentPage}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Row gutter={[16, 16]}>
            {paginatedJobs.map((job, index) => (
              <Col
                key={job.id}
                xs={24}
                sm={viewMode === 'grid' ? 12 : 24}
                lg={viewMode === 'grid' ? 8 : 24}
                xl={viewMode === 'grid' ? 6 : 24}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <JobCard
                    job={job}
                    variant={viewMode === 'list' ? 'compact' : 'default'}
                  />
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Title level={2} className="mb-4">Find Your Perfect Job</Title>
          <SearchBar
            placeholder="Search jobs, skills, companies..."
            onSearch={setSearchValue}
            onClear={() => setSearchValue('')}
            onFilterClick={toggleFilters}
            className="mb-6"
          />
        </motion.div>

        {/* Controls - Hide during initial loading */}
        {!isInitializing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center justify-between mb-6 gap-4"
          >
            <div className="flex items-center space-x-4">
              <Text type="secondary">
                {filteredJobs.length} jobs found
              </Text>
              {(selectedCategories.length > 0 || selectedPriceRanges.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map(category => (
                    <Tag
                      key={category}
                      closable
                      onClose={() => handleCategoryChange(
                        selectedCategories.filter(c => c !== category)
                      )}
                    >
                      {category}
                    </Tag>
                  ))}
                  {selectedPriceRanges.map(range => (
                    <Tag
                      key={range}
                      closable
                      onClose={() => handlePriceRangeChange(
                        selectedPriceRanges.filter(r => r !== range)
                      )}
                    >
                      {PRICE_RANGES.find(p => p.value === range)?.label}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            <Space>
              <Select
                value={sortBy}
                onChange={handleSortChange}
                style={{ width: 150 }}
                suffixIcon={<SortAscendingOutlined />}
              >
                {SORT_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>

              <Button.Group>
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                />
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                />
              </Button.Group>

              <Button
                icon={<FilterOutlined />}
                onClick={toggleFilters}
                className="md:hidden"
              >
                Filters
              </Button>
            </Space>
          </motion.div>
        )}

        {/* Main Content */}
        <Row gutter={24}>
          {/* Desktop Filters - Hide during initial loading */}
          {!isInitializing && (
            <Col xs={0} md={6}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card 
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-gray-800">Filters</span>
                      <Button 
                        type="text" 
                        size="small" 
                        onClick={clearFilters}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Clear All
                      </Button>
                    </div>
                  }
                  className="sticky top-4 shadow-lg border-0 bg-white"
                  styles={{
                    header: {
                      borderBottom: '1px solid #f0f0f0',
                      paddingBottom: '16px',
                      marginBottom: '0'
                    },
                    body: {
                      padding: '24px'
                    }
                  }}
                >
                  {filterContent}
                </Card>
              </motion.div>
            </Col>
          )}

          {/* Job Listings */}
          <Col xs={24} md={isInitializing ? 24 : 18}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {renderJobGrid()}

              {/* Pagination - Only show when not loading and have jobs */}
              {!isLoading && !isInitializing && paginatedJobs.length > 0 && (
                <div className="flex justify-center mt-8">
                  <Pagination
                    current={currentPage}
                    total={filteredJobs.length}
                    pageSize={12}
                    onChange={setCurrentPage}
                    showSizeChanger={false}
                    showQuickJumper
                    showTotal={(total, range) =>
                      `${range[0]}-${range[1]} of ${total} jobs`
                    }
                  />
                </div>
              )}
            </motion.div>
          </Col>
        </Row>

        {/* Mobile Filters Drawer */}
        <Drawer
          title="Filters"
          placement="right"
          onClose={() => setFiltersVisible(false)}
          open={filtersVisible}
          width={300}
          className="md:hidden"
        >
          {filterContent}
        </Drawer>
      </div>
    </div>
  );
});

FindJobPage.displayName = 'FindJobPage';

export default FindJobPage;
