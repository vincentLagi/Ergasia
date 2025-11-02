import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Input, 
  Button, 
  Dropdown, 
  Tag, 
  Space, 
  Divider,
  Typography,
  Empty
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  CloseOutlined,
  HistoryOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useDebouncedSearch } from '../../shared/hooks/useDebounce';
import { useLocalStorage } from '../../shared/hooks/useLocalStorage';

const { Text } = Typography;

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  onClear?: () => void;
  showFilters?: boolean;
  className?: string;
  size?: 'small' | 'middle' | 'large';
  suggestions?: string[];
  recentSearches?: string[];
}

const SearchBar: React.FC<SearchBarProps> = memo(({
  placeholder = "Search jobs, skills, or companies...",
  onSearch,
  onFilterClick,
  showFilters = true,
  onClear,
  className = '',
  size = 'large',
  suggestions = [],
  recentSearches: propRecentSearches
}) => {
  const [focused, setFocused] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('recent-searches', []);
  const inputRef = useRef<any>(null);
  
  const {
    searchValue,
    debouncedSearchValue,
    setSearchValue,
    isSearching
  } = useDebouncedSearch('', 300);

  // Use prop recent searches if provided, otherwise use local storage
  const displayRecentSearches = propRecentSearches || recentSearches;

  // Mock trending searches
  const trendingSearches = [
    'React Developer',
    'UI/UX Designer',
    'Full Stack',
    'Mobile App',
    'Data Science'
  ];

  useEffect(() => {
    if (debouncedSearchValue && onSearch) {
      onSearch(debouncedSearchValue);
    }
  }, [debouncedSearchValue, onSearch]);

  useEffect(() => {
    if (!searchValue && onClear) {
      onClear();
    }
  }, [searchValue, onClear]);

  const handleSearch = useCallback((value: string) => {
    if (value.trim()) {
      // Add to recent searches
      const newRecentSearches = [
        value,
        ...recentSearches.filter(search => search !== value)
      ].slice(0, 5);
      setRecentSearches(newRecentSearches);
      
      onSearch?.(value);
      setDropdownVisible(false);
      inputRef.current?.blur();
    }
  }, [recentSearches, setRecentSearches, onSearch]);

  const handleRecentSearchClick = useCallback((search: string) => {
    setSearchValue(search);
    handleSearch(search);
  }, [setSearchValue, handleSearch]);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, [setRecentSearches]);

  const removeRecentSearch = useCallback((searchToRemove: string) => {
    setRecentSearches(prev => prev.filter(search => search !== searchToRemove));
  }, [setRecentSearches]);

  const handleFocus = useCallback(() => {
    setFocused(true);
    setDropdownVisible(true);
  }, []);

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Delay hiding dropdown to allow clicks
    setTimeout(() => setDropdownVisible(false), 200);
  }, []);

  const dropdownContent = (
    <div className="w-full max-w-md p-4 bg-foreground rounded-lg shadow-lg border">
      {/* Recent Searches */}
      {displayRecentSearches.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <HistoryOutlined className="text-gray-400" />
              <Text type="secondary" className="text-sm font-medium">
                Recent Searches
              </Text>
            </div>
            <Button 
              type="text" 
              size="small" 
              onClick={clearRecentSearches}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
          <div className="space-y-1">
            {displayRecentSearches.map((search, index) => (
              <motion.div
                key={search}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group"
                onClick={() => handleRecentSearchClick(search)}
              >
                <Text className="text-sm">{search}</Text>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentSearch(search);
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Searches */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <RiseOutlined className="text-orange-500" />
          <Text type="secondary" className="text-sm font-medium">
            Trending
          </Text>
        </div>
        <div className="flex flex-wrap gap-2">
          {trendingSearches.map((trend, index) => (
            <motion.div
              key={trend}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Tag
                className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                onClick={() => handleRecentSearchClick(trend)}
              >
                {trend}
              </Tag>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <>
          <Divider className="my-3" />
          <div>
            <Text type="secondary" className="text-sm font-medium mb-2 block">
              Suggestions
            </Text>
            <div className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-2 hover:bg-gray-50 rounded cursor-pointer"
                  onClick={() => handleRecentSearchClick(suggestion)}
                >
                  <Text className="text-sm">{suggestion}</Text>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {displayRecentSearches.length === 0 && suggestions.length === 0 && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Start typing to search"
          className="my-4"
        />
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative ${className}`}
    >
      <Dropdown
        open={dropdownVisible && focused}
        dropdownRender={() => dropdownContent}
        trigger={[]}
        placement="bottomLeft"
        overlayClassName="search-dropdown"
      >
        <div className="relative">
          <Input.Search
            ref={inputRef}
            size={size}
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
            loading={isSearching}
            enterButton={
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                className="h-full"
              >
                Search
              </Button>
            }
            className={`
              transition-all duration-300
              ${focused ? 'shadow-lg ring-2 ring-primary/20' : 'shadow-sm'}
            `}
            style={{
              borderRadius: '12px',
            }}
          />
          
          {/* Filter Button */}
          {showFilters && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
              style={{ right: size === 'large' ? '100px' : '80px' }}
            >
              <Button
                type="text"
                icon={<FilterOutlined />}
                onClick={onFilterClick}
                className="hover:bg-gray-100 rounded-lg"
              />
            </motion.div>
          )}
        </div>
      </Dropdown>

      {/* Search Indicator */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -bottom-8 left-0 flex items-center space-x-2 text-sm text-gray-500"
          >
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Searching...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;