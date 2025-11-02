import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { getFreelancerForRating, ratingUser, JobRatingPayload } from '../../controller/ratingController';
import { storage } from '../../utils/storage';

export const useRating = (jobId: string | undefined, isJobOwner: boolean) => {
    const [ratingRecords, setRatingRecords] = useState<JobRatingPayload[]>([]);
    const [localRatings, setLocalRatings] = useState<Record<string, number>>({});
    const [isSubmittingRating, setIsSubmittingRating] = useState(false);
    const [isRatingFinalized, setIsRatingFinalized] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchRatings = useCallback(async () => {
        if (isJobOwner && jobId) {
            setLoading(true);
            try {
                const user = storage.getUser();
                if (!user) return;
                const ratings = await getFreelancerForRating(jobId, user.id);
                console.log(ratings)
                setRatingRecords(ratings);
                const initialRatings: Record<string, number> = {};
                ratings.forEach(r => {
                    // Backend stores rating as Nat (e.g., 45 for 4.5), so we convert it back for display
                    initialRatings[r.user.id] = r.rating / 10;
                });
                setLocalRatings(initialRatings);
                const allRated = ratings.every(r => r.isEdit);
                if (allRated) {
                    setIsRatingFinalized(true);
                }
            } catch (error) {
                console.error("Failed to fetch freelancer ratings:", error);
                message.error("Could not load ratings.");
            } finally {
                setLoading(false);
            }
        }
    }, [isJobOwner, jobId]);

    useEffect(() => {
        fetchRatings();
    }, [fetchRatings]);

    const handleRateChange = (freelancerId: string, value: number) => {
        setLocalRatings(prev => ({ ...prev, [freelancerId]: value }));
    };

    const handleFinalizeRatings = useCallback(async () => {
        setIsSubmittingRating(true);
        const payloads = Object.entries(localRatings)
            .map(([userId, rating]) => {
                const record = ratingRecords.find(r => r.user.id === userId);
                if (record && !record.isEdit) {
                    return {
                        rating_id: BigInt(record.rating_id),
                        // Multiply by 10 to store one decimal place as an integer (e.g., 4.5 -> 45)
                        rating: BigInt(Math.round(rating * 10)),
                        userId: userId
                    };
                }
                return null;
            })
            .filter((p): p is { rating_id: bigint; rating: bigint; userId: string } => p !== null);

        if (payloads.length === 0) {
            message.info("No new ratings to submit or all ratings are final.");
            return;
        }

        try {
            const result = await ratingUser(payloads);
            console.log(result)
            if (result === "Ratings submitted") {
                message.success("Ratings submitted successfully!");
                setIsRatingFinalized(true);
                await fetchRatings(); 
            } else {
                message.error(`Failed to submit ratings: ${result}`);
            }
        } catch (error) {
            console.error("Error finalizing ratings:", error);
            message.error("An unexpected error occurred while finalizing ratings.");
        } finally {
            setIsSubmittingRating(false);
        }
    }, [localRatings, ratingRecords, fetchRatings]);

    return {
        ratingRecords,
        localRatings,
        isSubmittingRating,
        isRatingFinalized,
        loading,
        handleRateChange,
        handleFinalizeRatings,
        fetchRatings
    };
};