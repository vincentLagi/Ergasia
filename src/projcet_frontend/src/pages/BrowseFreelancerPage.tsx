import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Avatar,
  Rate,
  Tag,
  Space,
  Typography,
  Slider,
  Checkbox,
  Divider,
  Empty,
  Spin,
  Pagination
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  DollarOutlined,
  StarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  HeartOutlined,
  HeartFilled
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../ui/components/Navbar';
import { useDebounce } from '../shared/hooks/useDebounce';
import { useUserManagement } from '../shared/hooks';
import { User } from '../shared/types/User';
import { JobCategory } from '../shared/types/Job';
import { useJobCategories } from '../utils/useJobCategories';
import { useAuth } from '../hooks/useAuth';
const { Title, Text } = Typography;
const { Option } = Select;


const BrowseFreelancerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [minRating, setMinRating] = useState(0);
  const { allUsers, loading } = useUserManagement();
  const { data } = useJobCategories()
  const { user } = useAuth()
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filterFreelancers = useCallback((users: User[]) => {
    return users.filter(u => {
      const searchMatch = !debouncedSearchTerm ||
        u.username.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        u.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

      const categoryMatch = !selectedCategory ||
        u.preference.some(pref => pref.jobCategoryName === selectedCategory);

      const ratingMatch = u.rating >= minRating;

      const notCurrentUser = u.id != user?.id;

      return searchMatch && categoryMatch && ratingMatch && notCurrentUser;
    });
  }, [debouncedSearchTerm, selectedCategory, minRating]);

  const sortFreelancers = useCallback((users: User[]) => {
    return [...users].sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
          return Number(b.createdAt - a.createdAt);
        case 'username':
          return a.username.localeCompare(b.username);
        default:
          return 0;
      }
    });
  }, [sortBy]);

  const filteredAndSortedFreelancers = useMemo(() => {
    console.log(allUsers)
    const filtered = filterFreelancers(allUsers);
    return sortFreelancers(filtered);
  }, [allUsers, filterFreelancers, sortFreelancers]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory('');
    setMinRating(0);
    setSearchTerm('');
  }, []);


  const FreelancerCard = ({ freelancer }: { freelancer: User }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        hoverable
        className="h-full"
        actions={[

          <Button
            key="view"
            type="text"
            onClick={() => navigate(`/profile/${freelancer.id}`)}
            className="hover:!bg-[#6366f1] hover:!text-white transition-all duration-200"
          >
            View Profile
          </Button>
        ]}
      >
        <div className="text-center mb-4">
          <Avatar
            size={64}
            src={freelancer.profilePicture ? URL.createObjectURL(freelancer.profilePicture) : <UserOutlined />}
            icon={<UserOutlined />}
          />

          <div className="mt-2">
            <Title level={4} className="mb-1">{freelancer.username}</Title>
          </div>
        </div>

        <div className="mb-4">
          <Space className="w-full justify-center">
            <Rate disabled defaultValue={freelancer.rating} allowHalf />
          </Space>
        </div>



        <div className="mb-4">
          <Text type="secondary" className="block mb-2">Skills:</Text>
          <Space wrap>
            {freelancer.preference.slice(0, 4).map((p: JobCategory) => (
              <Tag key={p.jobCategoryName} color="blue">{p.jobCategoryName}</Tag>
            ))}
            {freelancer.preference.length > 4 && (
              <Tag>+{freelancer.preference.length - 4} more</Tag>
            )}
          </Space>
        </div>

        <div className="mb-4">
          <Text type="secondary" className="text-sm">{freelancer.description}</Text>
        </div>

      </Card>
    </motion.div>
  );

  const FilterSidebar = () => (
    <Card title="Filters" className="mb-6">
      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <Text strong className="block mb-2">Category</Text>
          <Select
            placeholder="Select category"
            style={{ width: '100%' }}
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
          >
            {data?.map(category => (
              <Option key={category.jobCategoryName} value={category.jobCategoryName}>
                {category.jobCategoryName}
              </Option>
            ))}
          </Select>
        </div>

        {/* Rating Filter */}
        <div>
          <Text strong className="block mb-2">Minimum Rating</Text>
          <Slider
            min={0}
            max={5}
            step={0.5}
            value={minRating}
            onChange={setMinRating}
            marks={{
              0: '0',
              2.5: '2.5',
              5: '5★'
            }}
          />
          <div className="text-center mt-2">
            <Text type="secondary">{minRating}+ stars</Text>
          </div>
        </div>

        {/* Clear Filters */}
        <Button
          block
          onClick={clearAllFilters}
          disabled={!selectedCategory && minRating === 0 && !searchTerm}
        >
          Clear All Filters
        </Button>

        {/* Filter Results Info */}
        <div className="text-center p-3 rounded">
          <Text type="secondary" className="text-sm underline bg-foreground">
            {filteredAndSortedFreelancers.length} of {allUsers.length} freelancers
          </Text>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <Title level={2}>Browse Freelancers</Title>
              <Text type="secondary">
                Find the perfect freelancer for your project
              </Text>
            </div>

            {/* Search Bar */}
            <Card style={{marginBottom: '2rem'}}>
              <Row gutter={[16, 16]} align="middle">
                <Col xs={24} sm={12} md={8}>
                  <Input
                    size="large"
                    placeholder="Search freelancers..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Select
                    size="large"
                    placeholder="Sort by"
                    style={{ width: '100%' }}
                    value={sortBy}
                    onChange={setSortBy}
                  >
                    <Option value="rating">Highest Rated</Option>
                    <Option value="price-low">Price: Low to High</Option>
                    <Option value="price-high">Price: High to Low</Option>
                    <Option value="recent">Most Recent</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={24} md={10}>
                  <div className="flex justify-end">
                    <Text type="secondary">
                      Showing {filteredAndSortedFreelancers.length} of {allUsers.length} freelancers
                    </Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Row gutter={[24, 24]}>
              {/* Filters Sidebar */}
              <Col xs={24} lg={6}>
                <FilterSidebar />
              </Col>

              {/* Freelancers Grid */}
              <Col xs={24} lg={18}>
                {filteredAndSortedFreelancers.length > 0 ? (
                  <>
                    <Row gutter={[16, 16]}>
                      {filteredAndSortedFreelancers.map(freelancer => (
                        <Col xs={24} sm={12} lg={8} key={freelancer.id}>
                          <FreelancerCard freelancer={freelancer} />
                        </Col>
                      ))}
                    </Row>

                    <div className="text-center mt-8">
                      <Pagination
                        current={currentPage}
                        total={filteredAndSortedFreelancers.length}
                        pageSize={9}
                        onChange={setCurrentPage}
                        showSizeChanger={false}
                        showTotal={(total, range) =>
                          `${range[0]}-${range[1]} of ${total} freelancers`
                        }
                      />
                    </div>
                  </>
                ) : (
                  <Card>
                    <Empty
                      description={
                        allUsers.length === 0
                          ? "No freelancers available at the moment."
                          : "No freelancers match your current filters."
                      }
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      {allUsers.length > 0 && (
                        <Button type="primary" onClick={clearAllFilters}>
                          Clear All Filters
                        </Button>
                      )}
                    </Empty>
                  </Card>
                )}
              </Col>
            </Row>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default BrowseFreelancerPage;