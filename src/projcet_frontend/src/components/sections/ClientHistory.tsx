import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { getClientHistory } from "../../controller/freelancerController";
import { JobTransaction } from "../../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { getJobById, getUserJobByStatusFinished } from "../../controller/jobController";
import { getUserById } from "../../controller/userController";
import ClientHistoryCard from "../cards/ClientHistoryCard";
import { Job } from "../../shared/types/Job";


export default function ProfileClientHistory() {
    const [jobsData, setJobsData] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const user = localStorage.getItem("current_user");
    const userData = user ? JSON.parse(user).ok : null;
    const clientId = userData ? userData.id : "";

    const fetchAllData = useCallback(async () => {
        try {
            setLoading(true);
            const jobs = await getUserJobByStatusFinished(clientId);
            if(jobs == null){
                setJobsData([])
            }else{
                setJobsData(jobs)
            }

        } catch (error) {
            console.error("Error fetching data:", error);
            setError("Failed to load client history");
        } finally {
            setLoading(false);
        }
    }, [clientId]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    return (
      <div className="w-full bg-gradient-to-r">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-purple-100"
          >
            <div className="relative overflow-hidden h-32 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSgxMzUpIj48cGF0aCBkPSJNMjAgMCBMMjAgNDAgTDAgMjAgTDQwIDIwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB4PSIwIiB5PSIwIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIiBvcGFjaXR5PSIwLjQiLz48L3N2Zz4=')] opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t"></div>
              <div className="relative p-6 flex items-end h-full">
                <h1 className="text-3xl font-bold text-purple-700 drop-shadow-md">
                  Client History
                </h1>
              </div>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <div className="text-red-500 mb-2">{error}</div>
                  <button
                    onClick={() => fetchAllData()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300"
                  >
                    Try Again
                  </button>
                </div>
              ) : jobsData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-600">
                      You have {jobsData.length} job
                      {jobsData.length !== 1 ? "s" : ""} in your history
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => fetchAllData()}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all duration-300"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {jobsData.map((data) => (
                    <ClientHistoryCard job={data} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-full inline-block mb-4">
                    <svg
                      className="h-16 w-16 text-purple-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      ></path>
                    </svg>
                  </div>
                  <p className="mt-4 text-lg text-gray-600">
                    No client history found
                  </p>
                  <p className="text-gray-500">
                    Your job history as a client will appear here.
                  </p>
                  <button
                    onClick={() => fetchAllData()}
                    className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
}