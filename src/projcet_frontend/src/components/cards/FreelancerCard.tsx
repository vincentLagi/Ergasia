import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Star, Users, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { User } from "../../shared/types/User";

export default function FreelancerCard({ user }: { user: User }) {
  const nav = useNavigate();

  const viewDetails = useCallback(() => {
    nav("/profile/" + user.id);
  }, [nav]);

  return (
    <motion.div
      className=" bg-white rounded-2xl overflow-hidden shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.02 }}
      onClick={viewDetails}
    >
      {/* Aurora gradient header */}
      <div className="h-24 bg-gradient-to-r from-blue-400 to-purple-400 min-w-64" />

      {/* Profile content */}
      <div className="px-6 pb-6 -mt-12">
        {/* Profile picture */}
        <motion.div
          className="flex justify-center"
        >
          <img
            src={user.profilePicture ? URL.createObjectURL(user.profilePicture) : "/pic.jpeg"}
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
          />
        </motion.div>

        {/* User info */}
        <div className="text-center mt-3 mb-4">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-400">
            {user.username}
          </h2>

          <div className="flex items-center justify-center mt-1 text-gray-600">
            <Star className="w-4 h-4 text-purple-400 mr-1" />
            <span>{user.rating}/5</span>
          </div>
        </div>

        {/* Category preferences as tags */}
        <div className="flex flex-wrap gap-2 justify-center">
          {user.preference?.map((pref, index) => (
            <motion.span
              key={index}
              className="px-3 py-1 text-sm rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 text-blue-600"
              whileHover={{ scale: 1.05 }}
            >
              {pref.jobCategoryName}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
