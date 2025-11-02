import React from 'react';
import { Typography, Button, Row, Col, Card, Avatar, Rate, Divider } from 'antd';
import { CheckOutlined, UserOutlined } from '@ant-design/icons';
import { User } from '../../shared/types/User';

const { Title, Text } = Typography;

interface RatingSectionProps {
  acceptedFreelancers: User[];
  localRatings: { [key: string]: number };
  ratingRecords: any[];
  isSubmittingRating: boolean;
  isRatingFinalized: boolean;
  onRateChange: (userId: string, value: number) => void;
  onFinalizeRatings: () => void;
}

const RatingSection: React.FC<RatingSectionProps> = ({
  acceptedFreelancers,
  localRatings,
  ratingRecords,
  isSubmittingRating,
  isRatingFinalized,
  onRateChange,
  onFinalizeRatings
}) => {
  return (
    <>
      <Divider />
      <div className="mb-6">
        <Title level={4}>Freelancer Ratings</Title>
        <Text type="secondary">
          Rate accepted freelancers, then click Finalize Ratings to submit.
        </Text>
        <Row gutter={[16, 16]} className="mt-3">
          {acceptedFreelancers.length > 0 ? (
            acceptedFreelancers.map((f) => (
              <Col xs={24} sm={12} key={f.id}>
                <Card size="small" className="hover:shadow">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={f.profilePictureUrl || undefined}
                      icon={<UserOutlined />}
                    />
                    <div className="flex-1">
                      <Text strong>{f.username}</Text>
                      <div className="text-xs text-gray-500">
                        Current: {(Number(f.rating) / 10).toFixed(1)}
                      </div>
                    </div>
                    <Rate
                      allowHalf
                      value={localRatings[f.id] ?? Number(f.rating || 0)}
                      onChange={(value) => onRateChange(f.id, value)}
                      disabled={Boolean(ratingRecords.find((r: any) => r.user.id === f.id)?.isEdit)}
                    />
                  </div>
                </Card>
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Text type="secondary">No freelancers to rate yet.</Text>
            </Col>
          )}
        </Row>
        <div className="mt-3 text-right">
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={onFinalizeRatings}
            disabled={acceptedFreelancers.length === 0 || isSubmittingRating || isRatingFinalized}
            loading={isSubmittingRating}
          >
            {isRatingFinalized ? "Ratings Finalized" : "Finalize Ratings"}
          </Button>
        </div>
      </div>
    </>
  );
};

export default RatingSection;
