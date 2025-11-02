import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRatingByUserIdJobId } from "../../controller/ratingController";
import { Star } from "lucide-react";
import { formatDate } from "../../utils/dateUtils";
import { Job } from "../../shared/types/Job";

export default function FreelancerJobHistoryCard({ jobId, isLoading }: { jobId: string; isLoading: () => void }) {
    const [job, setJob] = useState<Job | null>(null);
    const [date, setDate] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [rating, setRating] = useState<number>();
    const [isEdit, setIsEdit] = useState(false)
    const nav = useNavigate();

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const userData = localStorage.getItem("current_user");
                if (!userData) {
                    console.error("No user data found in localStorage");
                    setLoading(false);
                    return;
                }

                const parsedData = JSON.parse(userData);
                const freelancerId = parsedData.ok?.id;
                const res = await getRatingByUserIdJobId(jobId!, freelancerId!);
                if (typeof res !== "string") {
                    // The backend now returns a Rating object, not a Job.
                    // We need to fetch the job separately.
                    // This is a placeholder until the job fetching logic is added.
                    // setJob(res.job);
                    // setDate(formatDate(res.job.createdAt));
                    setRating(Number(res.rating));
                    setIsEdit(res.rating !== 0n)
                } else {
                    setError("Job not found");
                }
            } catch (err) {
                console.error("Failed to fetch job:", err);
                setError("Failed to load job details");
            } finally {
                isLoading();
            }
        };

        fetchJob();
    }, [jobId]);

    const viewDetail = () => {
        nav("/jobs/" + jobId);
    };

    // Function to render star rating
    const renderStars = (rating?: number) => {
        const totalStars = 5; // Total number of stars to display
        const stars = [];

        if (rating) {
            // Round down the rating
            const roundedRating = Math.floor(rating);

            // Add filled stars based on the rounded down rating
            for (let i = 0; i < roundedRating; i++) {
                stars.push(<Star key={`filled-${i}`} className="fill-yellow-400 text-yellow-400 w-4 h-4" />);
            }

            // Add empty stars for the remaining slots
            for (let i = roundedRating; i < totalStars; i++) {
                stars.push(<Star key={`empty-${i}`} className="text-gray-300 w-4 h-4" />);
            }

            return (
                <div className="flex items-center">
                    <div className="flex mr-2">{stars}</div>
                    <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
                </div>
            );
        } else {
            // Show all empty stars if no rating
            for (let i = 0; i < totalStars; i++) {
                stars.push(<Star key={`empty-${i}`} className="text-gray-300 w-4 h-4" />);
            }

            return (
                <>
                    {!isEdit ? (
                        <div className="flex items-center">
                            <span className="text-sm text-gray-600">Has not been updated</span>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <div className="flex mr-2">{stars}</div>
                            <span className="text-sm text-gray-600">(No rating)</span>
                        </div>
                    )}
                </>
            );
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 border border-purple-50 hover:border-purple-200 transition-all">
            <h3 className="font-semibold text-lg text-gray-800">{job?.jobName}</h3>
            <div className="mt-2 text-sm text-gray-600">
                <p>
                    <span className="font-medium">Created At:</span> {date}
                </p>
                <div className="mt-3 flex items-center">
                    <span className="font-medium mr-2">Status:</span>
                    <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${job?.jobStatus === "Finished"
                                ? "bg-green-100 text-green-800"
                                : job?.jobStatus === "Ongoing"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-yellow-100 text-yellow-800"
                            }`}
                    >
                        {job?.jobStatus}
                    </span>
                </div>
                <div className="mt-3">
                    <span className="font-medium mr-2">Rating:</span>
                    {renderStars(rating)}
                </div>
            </div>
            <div className="mt-4">
                <button className="text-sm text-purple-600 hover:text-purple-800 font-medium" onClick={viewDetail}>
                    View Details
                </button>
            </div>
        </div>
    );
}