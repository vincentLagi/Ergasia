import { useEffect, useState } from "react";
import { getJobById } from "../../controller/jobController";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/dateUtils";
import { Job } from "../../shared/types/Job";
import { Tag, Space } from "antd";
import { getStatusColor } from "../../utils/JobStatusCololer";
import JobChatButton from "../chat/JobChatButton";

export default function FreelancerJobCard({ jobId, isLoading }: { jobId: string; isLoading : () => void }) {
    const [job, setJob] = useState<Job | null>(null);
    const [date, setDate] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const nav = useNavigate()
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await getJobById(jobId);
                if (res) {
                    const converted: Job = {
                        ...(res as any),
                        jobTags: (res as any).jobTags?.map((t: any) => ({
                            id: t.id?.toString?.() ?? String(t.id),
                            jobCategoryName: t.jobCategoryName,
                        })) || [],
                        subAccount:
                            (res as any).subAccount && (res as any).subAccount[0]
                                ? [new Uint8Array((res as any).subAccount[0])]
                                : [],
                        jobSlots: BigInt((res as any).jobSlots),
                        createdAt: BigInt((res as any).createdAt),
                        updatedAt: BigInt((res as any).updatedAt),
                    };
                    setJob(converted);
                    setDate(formatDate(converted.createdAt));
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
        nav("/jobs/" + jobId)

    }




    return (
        <div className="bg-background rounded-lg shadow p-6 border border-foreground hover:border-purple-200 transition-all">
            <h2 className="font-semibold text-xl">{job?.jobName}</h2>
            <div className="mt-2 text-sm">
                <p>
                    <span className="font-medium">Created At:</span> {date}
                </p>
                <div className="mt-3 flex items-center">
                    <span className="font-medium text-text mr-2">Status:</span>
                    {job?.jobStatus && (
                        <Tag color={getStatusColor(job.jobStatus)} className="text-xs">
                            {job.jobStatus}
                        </Tag>
                    )}
                </div>
            </div>
            <div className="mt-4">
                <Space>
                    <button
                        onClick={viewDetail}
                        className="text-sm bg-[#6366f1] text-white px-3 py-1.5 rounded-md hover:bg-[#4f46e5] transition-all duration-300 font-medium shadow-sm"
                    >
                        View Details
                    </button>
                    
                    {job && (
                        <JobChatButton
                            jobId={job.id}
                            jobStatus={job.jobStatus}
                            clientId={job.userId}
                            freelancerId={undefined} // TODO: Fetch accepted freelancer separately
                        />
                    )}
                </Space>
            </div>
        </div>
    );
}