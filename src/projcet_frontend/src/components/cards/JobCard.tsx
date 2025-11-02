import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, DollarSign, Users } from "lucide-react";
import { addIncrementUserClicked } from "../../controller/userClickedController";
import { Job } from "../../shared/types/Job";

export default function JobCard({ job }: { job: Job }) {
  const nav = useNavigate();

  const viewDetails = useCallback(() => {
    addIncrementUserClicked(job.id);
    nav("/jobs/" + job.id);
  }, [nav, job.id]);

  return (
    <motion.div
      whileHover={{
        scale: 1.03,
        boxShadow: "0 10px 20px rgba(128, 90, 213, 0.1)",
      }}
      className="bg-white/80 backdrop-blur-sm 
                border border-purple-100/50 
                rounded-xl 
                overflow-hidden 
                shadow-sm 
                transition-all 
                duration-300 
                hover:border-purple-200
                w-full
                h-[250px]"
    >
      <div className="p-5 flex flex-col h-full">
        {/* Job Title */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-800 flex items-center truncate">
            <Briefcase
              className="mr-2 text-purple-500 flex-shrink-0"
              size={20}
            />
            <span className="truncate">{job.jobName}</span>
          </h3>
          {/* Job Tag/Category Chip */}
          {job.jobTags && job.jobTags.length > 0 && (
            <span
              className="text-xs font-medium 
                            bg-purple-100 text-purple-700 
                            px-2 py-1 rounded-full ml-2"
            >
              {job.jobTags[0].jobCategoryName}
            </span>
          )}
        </div>

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-gray-600">
          <div className="flex items-center">
            <DollarSign className="mr-1 text-green-500" size={16} />
            <span className="font-medium text-sm">${job.jobSalary}</span>
          </div>
          <div className="flex items-center">
            <Users className="mr-1 text-blue-500" size={16} />
            <span className="font-medium text-sm">{Number(job.jobSlots)} Slots</span>
          </div>
        </div>

        <div className="mb-4 flex-grow overflow-hidden">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">
            Job Description
          </h4>
          <ul className="text-gray-600 space-y-2 text-xs">
            {job.jobDescription.slice(0, 2).map((desc: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="w-1.5 h-1.5 mt-1 mr-2 bg-purple-300 rounded-full flex-shrink-0"></span>
                <span className="line-clamp-1">{desc}</span>
              </li>
            ))}
            {job.jobDescription.length > 2 && (
              <li className="text-xs text-gray-500 ml-3">
                + {job.jobDescription.length - 2} more details
              </li>
            )}
          </ul>
        </div>

        {/* View Details Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={viewDetails}
          className="w-full flex items-center justify-center 
                        bg-gradient-to-r from-purple-500 to-blue-500 
                        text-white 
                        py-2 
                        rounded-lg 
                        hover:from-purple-600 hover:to-blue-600 
                        transition-all 
                        text-sm
                        duration-300
                        font-medium"
        >
          View Details
          <ArrowRight className="ml-1" size={16} />
        </motion.button>
      </div>
    </motion.div>
  );
}