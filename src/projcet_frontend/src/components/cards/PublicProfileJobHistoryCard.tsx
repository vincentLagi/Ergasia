import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getJobById } from "../../controller/jobController";
import { getUserById } from "../../controller/userController";
import { formatDate } from "../../utils/dateUtils";
import { User } from "../../shared/types/User";
import { Job } from "../../shared/types/Job";

export default function PublicProfileJobHistoryCard({ jobId, index, auroraColors }: { jobId: string; index: number, auroraColors: string }) {
    const [job, setJob] = useState<Job | null>(null);
    const [date, setDate] = useState<string>("");
    const [client, setClient] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        const fetchJob = async () => {
            try {
                const res = await getJobById(jobId);
                if (res) {
                    setJob(res);
                    setDate(formatDate(res.createdAt));
                    const user = await getUserById(res.userId)
                    if(user && "ok" in user){
                        setClient(user.ok)
                    }
                } else {
                    setError("Job not found");
                }
                
            } catch (err) {
                console.error("Failed to fetch job:", err);
                setError("Failed to load job details");
            } finally {
            }
        };

        fetchJob();
    }, [jobId]);
    return (
        <motion.div
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm transition-all hover:shadow-md"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
        >
            <div className="flex justify-between items-start">
                <h3
                    className={`font-semibold text-lg ${auroraColors}`}
                >
                    {job?.jobName}
                </h3>
                <div className="px-3 py-1 bg-gradient-to-r from-indigo-100 to-purple-100 text-sm rounded-full text-indigo-600">
                    {date}
                </div>
            </div>

            <p className="text-indigo-700 font-medium mt-1">
                {client?.username}
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
                {job?.jobTags.map((tag, i) => (
                    <span
                        key={i}
                        className="px-2 py-1 text-xs rounded-full text-white bg-gradient-to-r from-sky-400 to-indigo-400"
                    >
                        {tag.jobCategoryName}
                    </span>
                ))}
            </div>

            <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-lg">
                <p className="text-gray-700 italic flex items-start gap-1">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 flex-shrink-0 text-indigo-400 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
                            clipRule="evenodd"
                        />
                    </svg>
                    "{job?.jobDescription}"
                </p>
            </div>
        </motion.div>
    );

}