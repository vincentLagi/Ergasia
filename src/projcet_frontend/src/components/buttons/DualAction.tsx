import { motion } from "framer-motion";
import { Briefcase, UserPlus, Zap } from "lucide-react";

export default function CallToAction() {
  return (
    <motion.div
      className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Find Work Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group w-full md:w-64 h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/50 to-purple-500/50 border border-cyan-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 p-6 h-full flex flex-col items-center justify-center text-center">
          <div className="mb-4 p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-cyan-50 mb-2">Find Work</h3>
          <p className="text-cyan-50 text-sm">
            Start earning crypto for your skills
          </p>

          {/* Animated sparkle */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full overflow-hidden"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-20 -left-10 w-40 h-40 bg-gradient-to-r from-cyan-400/30 to-transparent opacity-30" />
          </motion.div>
        </div>
      </motion.button>

      {/* OR Divider */}
      <div className="text-purple-700 font-semibold">OR</div>

      {/* Hire Talent Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative group w-full md:w-64 h-48 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-500/50 to-purple-500/50 border border-cyan-500/30"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

        <div className="relative z-10 p-6 h-full flex flex-col items-center justify-center text-center">
          <div className="mb-4 p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-cyan-50 mb-2">
            Hire Talent
          </h3>
          <p className="text-cyan-50 text-sm">Find experts paid in crypto</p>

          {/* Animated sparkle */}
          <motion.div
            className="absolute top-0 left-0 w-full h-full overflow-hidden"
            initial={{ rotate: 0 }}
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-20 -left-10 w-40 h-40 bg-gradient-to-r from-purple-400/30 to-transparent opacity-30" />
          </motion.div>
        </div>
      </motion.button>

      {/* Connecting line */}
      <div className="hidden md:block absolute h-px w-64 bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent -z-10" />
    </motion.div>
  );
}
