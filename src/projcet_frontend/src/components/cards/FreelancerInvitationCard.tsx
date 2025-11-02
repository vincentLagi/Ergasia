import { motion } from "framer-motion";
import { UserInvitationPayload } from "../../shared/types/Invitation";
import { Job } from "../../shared/types/Job";
import { useState } from "react";
import {
  acceptInvitation,
  rejectInvitation,
} from "../../controller/invitationController";
import { appendFreelancers } from "../../controller/jobTransactionController";
import { createInbox } from "../../controller/inboxController";
import { formatDate } from "../../utils/dateUtils";

export default function FreelancerInvitationCard({
  invitation,
  onReject,
  onClickDetailJob,
  onError,
}: {
  invitation: UserInvitationPayload;
  onReject: () => void;
  onClickDetailJob: (job: Job) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [isAccepted, setIsAccepted] = useState<Boolean>(invitation.isAccepted);


  const formattedDate = formatDate(invitation.invitedAt);

  const sendInboxMessage = async (messageType: string) => {
    const userData = localStorage.getItem("current_user");
    const parsedData = userData ? JSON.parse(userData) : null;
    if (!parsedData || !parsedData.ok?.id) {
      throw new Error("User data not found");
    }

    await createInbox(
      invitation.job.userId,
      invitation.job.id,
      parsedData.ok.id,
      "invitation",
      messageType
    );
  };

  const accept = async () => {
    const userData = localStorage.getItem("current_user");
    const parsedData = userData ? JSON.parse(userData) : null;
    if (!parsedData || !parsedData.ok?.id) {
      throw new Error("User data not found");
    }
    await acceptInvitation(parsedData.ok.id, invitation.id).then((res) => {
      setIsAccepted(res);
      console.log(res);
      if (res) {
        appendFreelancers(invitation.job.id, parsedData.ok.id).then(
          (res) => {}
        );
        sendInboxMessage("accepted");
      } else {
        onError("Failed: Reach max job slot.");
      }
    });
  };

  const reject = () => {
    const userData = localStorage.getItem("current_user");
    const parsedData = userData ? JSON.parse(userData) : null;
    if (!parsedData || !parsedData.ok?.id) {
      throw new Error("User data not found");
    }
    rejectInvitation(parsedData.ok.id, invitation.id).then(() => {
      onReject();
    });

    sendInboxMessage("rejected");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md overflow-hidden border border-purple-100 mb-4 hover:shadow-lg transition-shadow duration-300"
    >
      <div className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h2
              className="text-xl font-semibold text-gray-800 hover:text-purple-600 transition-colors duration-300 cursor-pointer"
              onClick={() => onClickDetailJob(invitation.job)}
            >
              {invitation.job.jobName}
            </h2>
            <div className="flex items-center text-gray-500 text-sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              {formattedDate}
            </div>
          </div>
          {isAccepted ? (
            <div className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              Accepted
            </div>
          ) : (
            <div className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
              New Invitation
            </div>
          )}
        </div>

        <div className="mt-4 flex space-x-3">
          <button
            className={`px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 transition-all duration-300 flex-1 ${
              isAccepted
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-purple-600 text-white hover:bg-purple-700 hover:shadow focus:ring-purple-300"
            }`}
            onClick={accept}
            disabled={isAccepted === true}
          >
            Accept
          </button>
          <button
            className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 transition-all duration-300 flex-1 ${
              isAccepted
                ? "bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed"
                : "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-300"
            }`}
            onClick={reject}
            disabled={isAccepted === true}
          >
            Decline
          </button>
        </div>
      </div>
    </motion.div>
  );
}
