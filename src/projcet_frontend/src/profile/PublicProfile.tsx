// import React, { useEffect, useState } from "react";
// import { User } from "../../interface/User";
// import Navbar from "../../components/Navbar";
// import Footer from "../../components/Footer";
// import { authUtils } from "../../utils/authUtils";
// import { motion } from "framer-motion";
// import { Navigate, useNavigate, useParams } from "react-router-dom";
// import { getUserById } from "../../controller/userController";
// import LoadingOverlay from "../../components/ui/loading-animation";
// import InviteModal from "../../components/modals/InviteModel";
// import { JobTransaction } from "../../../../../../../declarations/job_transaction/job_transaction.did";
// import { getFreelancerHistory } from "../../controller/freelancerController";
// import PublicProfileJobHistoryCard from "../../components/cards/PublicProfileJobHistoryCard";
// import { formatDate } from "../../utils/dateUtils";

// const PublicProfile: React.FC = () => {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(false);
//   const { current_user } = authUtils();
//   const [userJoin, setUserJoin] = useState<string>("");
//   const [isInviteModal, setIsInviteModal] = useState(false); const params = useParams();
//   const nav = useNavigate();
//   const [historyJob, setHistoryJob] = useState<JobTransaction[]>([]);


//   useEffect(() => {
//     const fetchData = async () => {
//       try {

//         if (current_user) {
//           const curr_user = JSON.parse(current_user).ok;
//           if (curr_user.id === params.id) {
//             nav("/profile");
//             return;
//           }

//           const fetchedUser = await getUserById(params.id as string);

//           if (params.id) {
//             const result = await getFreelancerHistory(params.id);
//             console.log("Fetched freelancer history:", result);
//             if (result) {
//               setHistoryJob(result);
//             } else {
//               setHistoryJob([]);
//             }
//           }
//           if (fetchedUser) {
//             setUserJoin(formatDate(fetchedUser.createdAt));
//             setUser(fetchedUser);
//           }
//         }
//         setLoading(false);
//       } catch {
//       }
//     };
//     setLoading(true);
//     fetchData();
//   }, [current_user]);

//   const joinedAt = user?.createdAt ? formatDate(user.createdAt) : "Unknown";

//   const stats = {
//     jobsCompleted: 24,
//     avgRating: user?.rating?.toFixed(1) || "0.0",
//   };

//   // Placeholder job history - replace with actual data
//   const jobHistory = [
//     {
//       title: "E-commerce Backend Development",
//       client: "Tech Corp Inc",
//       date: "2023-08-15",
//       review: "Excellent work on optimizing our database queries!",
//       tags: ["Node.js", "MongoDB", "Redis"],
//     },
//     {
//       title: "Cloud Migration Consultant",
//       client: "Startup XYZ",
//       date: "2023-05-20",
//       review: "Seamless migration to AWS with zero downtime",
//       tags: ["AWS", "Docker", "Terraform"],
//     },
//   ];

//   // Aurora-like colors
//   const auroraColors = {
//     primary: "from-cyan-300 via-purple-300 to-pink-300",
//     secondary: "from-cyan-200 via-blue-200 to-purple-200",
//     accent: "from-emerald-300 via-teal-300 to-cyan-300",
//     text: "text-indigo-900",
//     textLight: "text-indigo-700",
//     card: "bg-white/90",
//     tag: "bg-gradient-to-r from-sky-400 to-indigo-400",
//   };

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//       },
//     },
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: {
//         duration: 0.5,
//         ease: "easeOut",
//       },
//     },
//   };



//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
//       {loading && <LoadingOverlay />}
//       <Navbar />

//       <motion.div
//         className="max-w-6xl mx-auto px-4 py-8"
//         variants={containerVariants}
//         initial="hidden"
//         animate="visible"
//       >
//         {/* Profile Header */}
//         <motion.div
//           className="relative mb-12 pt-8 pb-6 px-8 rounded-2xl shadow-lg bg-white backdrop-blur-sm overflow-hidden"
//           variants={itemVariants}
//         >
//           {/* Aurora background accent */}
//           <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-cyan-400 via-purple-400 to-pink-400 blur-xl -z-10"></div>

//           <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
//             <motion.div
//               className="relative w-36 h-36"
//               whileHover={{ scale: 1.05 }}
//               transition={{ duration: 0.2 }}
//             >
//               {/* <div
//                 className={`absolute inset-0 rounded-full bg-gradient-to-r ${auroraColors.primary} animate-pulse-slow blur opacity-70 scale-110`}
//               ></div> */}

//               <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg">
//                 {loading && (
//                   <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400 animate-pulse"></div>
//                 )}
//                 {!loading &&
//                   (user?.profilePicture ? (
//                     <img
//                       src={URL.createObjectURL(user.profilePicture)}
//                       alt="Profile"
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
//                       <span className="text-gray-400 text-2xl font-light">
//                         {user?.username?.charAt(0).toUpperCase() || "?"}
//                       </span>
//                     </div>
//                   ))}
//               </div>
//             </motion.div>

//             <div className="flex-1">
//               <h1 className={`text-4xl font-bold ${auroraColors.text} mb-2`}>
//                 {user?.username || "User"}
//               </h1>
//               <div className="flex flex-wrap items-center gap-6 text-indigo-800/70">
//                 <div className="flex items-center gap-1">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5 text-indigo-400"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                   <p>Joined: {userJoin}</p>
//                 </div>

//                 {user?.dob && (
//                   <div className="flex items-center gap-1">
//                     <svg
//                       xmlns="http://www.w3.org/2000/svg"
//                       className="h-5 w-5 text-indigo-400"
//                       viewBox="0 0 20 20"
//                       fill="currentColor"
//                     >
//                       <path
//                         fillRule="evenodd"
//                         d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
//                         clipRule="evenodd"
//                       />
//                     </svg>
//                     <p>DOB: {user.dob}</p>
//                   </div>
//                 )}

//                 <div className="flex items-center gap-1">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-5 w-5 text-yellow-400"
//                     viewBox="0 0 20 20"
//                     fill="currentColor"
//                   >
//                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
//                   </svg>
//                   <span className="font-medium">{stats.avgRating}</span>
//                 </div>
//               </div>
//             </div>
//             <button className="relative px-6 py-2 rounded-lg bg-gradient-to-br from-blue-400/80 to-purple-400/80 backdrop-blur-sm border border-indigo-100 shadow-sm shadow-indigo-100 transition-all hover:shadow-md hover:shadow-indigo-200 hover:scale-[1.02] active:scale-95 text-white font-medium overflow-hidden group">
//               <span className="relative z-10" onClick={() => { setIsInviteModal(true) }}>Invite Freelancer</span>
//             </button>
//           </div>
//         </motion.div>

//         {/* Main Content Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Left Column */}
//           <div className="lg:col-span-2 space-y-8">
//             {/* About Me Section */}
//             <motion.div
//               className={`rounded-2xl p-6 shadow-md ${auroraColors.card}`}
//               variants={itemVariants}
//             >
//               <h2
//                 className={`text-xl font-semibold mb-4 ${auroraColors.text} flex items-center gap-2`}
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
//                     clipRule="evenodd"
//                   />
//                 </svg>
//                 About Me
//               </h2>
//               <p className="text-gray-700 leading-relaxed">
//                 {user?.description ||
//                   "No description provided. This is where you can tell potential clients about your skills, experience, and what makes you unique as a professional."}
//               </p>
//             </motion.div>

//             {/* Job History */}
//             <motion.div
//               className={`rounded-2xl p-6 shadow-md ${auroraColors.card}`}
//               variants={itemVariants}
//             >
//               <h2
//                 className={`text-xl font-semibold mb-6 ${auroraColors.text} flex items-center gap-2`}
//               >
//                 <svg
//                   xmlns="http://www.w3.org/2000/svg"
//                   className="h-5 w-5"
//                   viewBox="0 0 20 20"
//                   fill="currentColor"
//                 >
//                   <path
//                     fillRule="evenodd"
//                     d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
//                     clipRule="evenodd"
//                   />
//                   <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
//                 </svg>
//                 Job History
//               </h2>

//               {historyJob.length > 0 ? (
//                 <div className="space-y-6">
//                   {historyJob.map((job, index) => (
//                     <PublicProfileJobHistoryCard jobId={job.jobId} index={index} auroraColors={auroraColors.text} />
//                   ))}
//                 </div>
//               ) : (
//                 <div className="flex flex-col items-center justify-center py-8 text-center bg-indigo-50/50 rounded-xl">
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-12 w-12 text-indigo-300 mb-3"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={1}
//                       d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
//                     />
//                   </svg>
//                   <p className="text-indigo-700 mb-1">
//                     No job history available
//                   </p>
//                   <p className="text-gray-500 text-sm">
//                     Completed jobs will appear here
//                   </p>
//                 </div>
//               )}
//             </motion.div>
//           </div>

//           {/* Right Column */}
//           <div className="space-y-8">
//             {/* Stats Cards */}
//             <motion.div variants={itemVariants} className="space-y-4">
//               {/* Jobs Completed */}
//               <motion.div
//                 className="relative overflow-hidden rounded-2xl p-6 shadow-md bg-gradient-to-br from-cyan-50 to-blue-50"
//                 whileHover={{ y: -4 }}
//                 transition={{ duration: 0.2 }}
//               >
//                 <div className="absolute -right-6 -bottom-10 w-32 h-32 bg-gradient-to-br from-cyan-200 to-blue-200 rounded-full opacity-30 blur-xl"></div>
//                 <h3 className="text-lg font-medium text-cyan-900 mb-2">
//                   Jobs Completed
//                 </h3>
//                 <div className="flex items-center justify-between">
//                   <p className="text-3xl font-bold text-indigo-600">
//                     {stats.jobsCompleted}
//                   </p>
//                   <svg
//                     xmlns="http://www.w3.org/2000/svg"
//                     className="h-10 w-10 text-cyan-400"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                   >
//                     <path
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                       strokeWidth={1.5}
//                       d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
//                     />
//                   </svg>
//                 </div>
//               </motion.div>
//             </motion.div>

//             {/* Specializations */}
//             <motion.div
//               className={`rounded-2xl p-6 shadow-md ${auroraColors.card}`}
//               variants={itemVariants}
//             >
//               <h3 className={`text-lg font-medium ${auroraColors.text} mb-4`}>
//                 Specializations
//               </h3>
//               <div className="flex flex-wrap gap-2">
//                 {user?.preference.map((cat, index) => (
//                   <motion.span
//                     key={cat.id}
//                     className="text-white px-3 py-1.5 rounded-full text-sm bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400"
//                     initial={{ opacity: 0, x: -10 }}
//                     animate={{ opacity: 1, x: 0 }}
//                     transition={{ delay: index * 0.1 }}
//                     whileHover={{ scale: 1.05 }}
//                   >
//                     {cat.jobCategoryName}
//                   </motion.span>
//                 ))}
//               </div>
//             </motion.div>

//             {/* Verification Status */}
//             <motion.div
//               className={`rounded-2xl p-6 shadow-md ${auroraColors.card}`}
//               variants={itemVariants}
//             >
//               <h3 className={`text-lg font-medium ${auroraColors.text} mb-4`}>
//                 Verification Status
//               </h3>

//               <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50">
//                 {user?.isFaceRecognitionOn ? (
//                   <>
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 flex items-center justify-center text-white">
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-6 w-6"
//                         viewBox="0 0 20 20"
//                         fill="currentColor"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     </div>
//                     <div>
//                       <p className="font-medium text-emerald-800">
//                         Face Recognition Verified
//                       </p>
//                       <p className="text-sm text-gray-500">
//                         Enhanced security verification
//                       </p>
//                     </div>
//                   </>
//                 ) : (
//                   <>
//                     <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white">
//                       <svg
//                         xmlns="http://www.w3.org/2000/svg"
//                         className="h-6 w-6"
//                         viewBox="0 0 20 20"
//                         fill="currentColor"
//                       >
//                         <path
//                           fillRule="evenodd"
//                           d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
//                           clipRule="evenodd"
//                         />
//                       </svg>
//                     </div>
//                     <div>
//                       <p className="font-medium text-indigo-800">
//                         Basic Verification
//                       </p>
//                       <p className="text-sm text-gray-500">
//                         Standard account verification
//                       </p>
//                     </div>
//                   </>
//                 )}
//               </div>
//             </motion.div>
//           </div>
//         </div>
//       </motion.div>
//       {isInviteModal && (
//         <InviteModal
//           isOpen={isInviteModal}
//           onClose={() => setIsInviteModal(false)}
//           freelancerId={params.id as string}
//           freelancerName={user?.username || "Freelancer"}
//         />
//       )}
//       <Footer />
//     </div>

//   );
// };

// export default PublicProfile;
