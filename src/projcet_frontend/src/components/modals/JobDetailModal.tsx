import { X, Calendar, DollarSign, Users, Tag, Clock, MapPin, User } from "lucide-react";
import { Job } from "../../shared/types/Job";
import { motion } from "framer-motion";
import { formatDate } from "../../utils/dateUtils";

export default function JobDetailModal({ job, onClose }: { job: Job; onClose: () => void; }) {

    const modalVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } },
        exit: { opacity: 0, transition: { duration: 0.2 } }
    };

    const contentVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { delay: 0.1, duration: 0.3 } }
    };

    // Get category color based on name
    const getCategoryColor = (name: any) => {
        const colors = {
            default: { bg: "bg-blue-100", text: "text-blue-700" },
            design: { bg: "bg-purple-100", text: "text-purple-700" },
            development: { bg: "bg-indigo-100", text: "text-indigo-700" },
            marketing: { bg: "bg-pink-100", text: "text-pink-700" },
            writing: { bg: "bg-orange-100", text: "text-orange-700" },
            finance: { bg: "bg-green-100", text: "text-green-700" },
            management: { bg: "bg-yellow-100", text: "text-yellow-700" },
            support: { bg: "bg-teal-100", text: "text-teal-700" },
        };

        const lowerName = name?.toLowerCase() || "";

        for (const [key, value] of Object.entries(colors)) {
            if (lowerName.includes(key)) {
                return value;
            }
        }

        return colors.default;
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modalVariants}
            className="fixed inset-0 z-50 bg-transparent backdrop-blur-sm flex items-center justify-center overflow-y-auto p-4"
        >
            <motion.div
                variants={contentVariants}
                className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-indigo-100"
            >
                {/* Header with colorful gradient background */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 z-10">
                    <div className="px-6 py-4 flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-white">Job Details</h1>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content with scrolling */}
                <div className="overflow-y-auto flex-grow">
                    <div className="p-6">
                        {/* Job Title and Status Badge */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-3xl font-bold text-gray-800">{job.jobName}</h2>
                                <div className={`px-4 py-2 rounded-full text-sm font-medium ${job.jobStatus === "Open"
                                        ? "bg-green-100 text-green-700"
                                        : job.jobStatus === "Ongoing"
                                            ? "bg-yellow-100 text-yellow-700"
                                            : "bg-gray-100 text-gray-700"
                                    }`}>
                                    {job.jobStatus}
                                </div>
                            </div>
                            <div className="flex items-center text-gray-500">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>Posted {formatDate(job.createdAt)}</span>
                            </div>
                        </div>

                        {/* Job details cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Salary Card */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl shadow-sm border border-green-200 p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start">
                                    <div className="bg-green-200 p-2 rounded-lg mr-3">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-green-600">Salary</h3>
                                        <p className="text-xl font-semibold text-gray-900">${job.jobSalary.toString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Available Slots Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl shadow-sm border border-purple-200 p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start">
                                    <div className="bg-purple-200 p-2 rounded-lg mr-3">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-purple-600">Available Slots</h3>
                                        <p className="text-xl font-semibold text-gray-900">{Number(job.jobSlots)}</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Tags Section */}
                        <div className="mb-8 bg-gradient-to-r from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-100">
                            <div className="flex items-center mb-4">
                                <Tag className="w-5 h-5 text-pink-500 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-800">Job Category</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {job.jobTags?.map((tag: any, index: number) => {
                                    const colorStyle = getCategoryColor(tag.jobCategoryName);
                                    return (
                                        <span
                                            key={index}
                                            className={`px-4 py-2 ${colorStyle.bg} ${colorStyle.text} text-sm rounded-full font-medium hover:shadow-sm transition-all`}
                                        >
                                            {tag.jobCategoryName}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl shadow-sm border border-amber-100 p-6 mb-8">
                            <div className="flex items-center mb-4">
                                <Calendar className="w-5 h-5 text-amber-500 mr-2" />
                                <h3 className="text-lg font-semibold text-gray-800">Job Description</h3>
                            </div>
                            <div className="prose max-w-none text-gray-700">
                                {job.jobDescription.length != 0 ? (
                                    <p className="whitespace-pre-wrap">{job.jobDescription}</p>
                                ) : (
                                    <p className="italic text-gray-500">No description provided</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer with action buttons - fixed at bottom */}
                <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-blue-100 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-white hover:bg-gray-100 text-gray-800 rounded-lg transition-colors font-medium border border-gray-200"
                    >
                        Close
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}