import { motion } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { getUserTransaction } from "../../controller/userController";
import {
  CashFlowHistory,
  TransactionType,
} from "../../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { getUserById } from "../../controller/userController";
import { getJobById } from "../../controller/jobController";
import { formatDate } from "../../utils/dateUtils";
import { formatCurrency } from "../../utils/salaryUtils";

export default function ProfileTransactionsSection({
  userId,
}: {
  userId: string;
}) {
  const [transactions, setTransactions] = useState<CashFlowHistory[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUserTransaction(userId);
      setTransactions(result);
    } catch (err) {
      setError("Failed to load transactions");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div className="w-full bg-gradient-to-r">
      <div className="max-w-5xl mx-auto">
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
                Your Transactions
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
                  onClick={() => fetchTransactions()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            ) : transactions && transactions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-gray-600">
                    You have {transactions.length} transaction
                    {transactions.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchTransactions()}
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
                {transactions.map((transaction, index) => (
                  <TransactionCard
                    key={`${
                      transaction.fromId
                    }-${transaction.transactionAt.toString()}-${index}`}
                    transaction={transaction}
                    userId={userId}
                  />
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    ></path>
                  </svg>
                </div>
                <p className="mt-4 text-lg text-gray-600">
                  No transactions found
                </p>
                <p className="text-gray-500">
                  Your payment history will appear here once you have
                  transactions.
                </p>
                <button
                  onClick={() => fetchTransactions()}
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

function TransactionCard({
  transaction,
  userId,
}: {
  transaction: CashFlowHistory;
  userId: string;
}) {
  const [fromName, setFromName] = useState<string>("Loading...");
  const [toNames, setToNames] = useState<string[]>([]);
  const [isCardLoading, setIsCardLoading] = useState(true);

  // Get transaction type as a string
  const getTransactionTypeString = (type: TransactionType): string => {
    if ("topUp" in type) return "Top Up";
    if ("transfer" in type) return "Transfer";
    if ("transferToJob" in type) return "Transfer to Job";
    return "Unknown";
  };

  const isIncomingToUser =
    Array.isArray(transaction.toId) &&
    transaction.toId.some((id) => id === userId);

  const isTopUp = "topUp" in transaction.transactionType;
  const isTopUpByUser = isTopUp && transaction.fromId === userId;

  const isIncoming = isIncomingToUser || isTopUpByUser;

  useEffect(() => {
    const fetchNames = async () => {
      try {
        // Get from user name
        const fromResult = await getUserById(transaction.fromId);
        if (fromResult && "ok" in fromResult) {
          setFromName(fromResult.ok.username);
        } else {
          const fromJob = await getJobById(transaction.fromId);
          if (fromJob) {
            setFromName(fromJob.jobName);
          }
        }

        const toNamesResult = await Promise.all(
          transaction.toId.map(async (id) => {
            const userResult = await getUserById(id);
            if (userResult && "ok" in userResult) {
              return userResult.ok.username;
            }

            try {
              const jobResult = await getJobById(id);
              const clientResult = await getUserById(jobResult?.userId || "");
              if (jobResult) {
                const clientName = (clientResult && "ok" in clientResult) ? clientResult.ok.username : "Unknown";
                return (
                  `${jobResult.jobName}` +
                  ` (created by ${clientName})`
                );
              }
            } catch (jobError) {
              console.error("Error fetching job:", jobError);
            }

            if (!isNaN(Number(id))) {
              return `Job #${id}`;
            }

            return "Unknown Recipient";
          })
        );

        setToNames(toNamesResult);
        setIsCardLoading(false);
      } catch (error) {
        console.error("Failed to get user/job names:", error);
      }
    };

    fetchNames();
  }, [transaction.fromId, transaction.toId]);

  const getFromToText = () => {
    if ("topUp" in transaction.transactionType) {
      return "Bank Account";
    }
    return fromName || "Unknown User";
  };

  if (isCardLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 border border-purple-50 hover:border-purple-200 transition-all">
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse flex space-x-4 w-full">
            <div className="rounded-full bg-slate-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-purple-50 hover:border-purple-200 transition-all">
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <div
            className={`p-3 rounded-full ${
              isIncoming ? "bg-green-100" : "bg-red-100"
            } mr-4`}
          >
            <svg
              className={`h-6 w-6 ${
                isIncoming ? "text-green-600" : "text-red-600"
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isIncoming ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                ></path>
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              )}
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-800">
              {getTransactionTypeString(transaction.transactionType)}
            </h3>
            <p className="text-sm text-gray-500">
              {formatDate(transaction.transactionAt)}
            </p>
          </div>
        </div>
        <span
          className={`text-lg font-bold ${
            isIncoming ? "text-green-600" : "text-red-600"
          }`}
        >
          {isIncoming ? "+" : "-"}
          {formatCurrency(transaction.amount)}
        </span>
      </div>

      <div className="mt-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
        <p className="mb-2 flex">
          <span className="font-medium w-10">From:</span>
          <span className="flex-1">{getFromToText()}</span>
        </p>
        {transaction.toId.length > 0 && (
          <p className="mb-2 flex">
            <span className="font-medium w-10">To:</span>
            <span className="flex-1">
              {toNames.length > 0
                ? toNames.join(", ")
                : "transferToJob" in transaction.transactionType &&
                  transaction.toId.some((id) => !isNaN(Number(id)))
                ? transaction.toId.map((id) => `Job #${id}`).join(", ")
                : "Loading..."}
            </span>
          </p>
        )}
      </div>

      <div className="mt-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            isIncoming
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isIncoming ? "Received" : "Sent"}
        </span>
      </div>
    </div>
  );
}
