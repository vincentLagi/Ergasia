import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Submission } from "../../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { useEffect, useState } from 'react';
import { getFileSubmissionbyId } from '../../controller/submissionController';

export default function HistorySubmissionCard({ submission }: { submission: Submission }) {
    const [fileUrl, setFileUrl] = useState<string | null>(null);    
    useEffect(() => {
        getFileSubmissionbyId(submission.id).then((res) => {
            console.log(res)
            setFileUrl(res)
        })
    }, [submission.id])

    const handleDownload = () => {
        console.log(fileUrl)
        if (fileUrl) {
            const a = document.createElement('a');
            a.href = fileUrl;
            a.download = `submission_${submission.id}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            alert('File not available for download.');
        }
    };

    const getStatusStyles = () => {
        switch (submission.status) {
            case "Accepted":
                return "bg-green-100 text-green-800 border-green-200";
            case "Rejected":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
        }
    };

    return (
        <motion.div
            className="w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-indigo-100 p-6 mb-4 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-indigo-800">
                    Submission #{Number(submission.id )+1}
                </h3>
                <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusStyles()}`}
                >
                    {submission.status}
                </span>
            </div>

            <div className="space-y-3 mb-4">
                <div className="flex items-center">
                    <p className="text-gray-700 truncate">{submission.submissionMessage}</p>
                </div>
                <div className="flex items-center">
                    <span className="text-indigo-600 font-medium mr-2">File:</span>
                    <p className="text-gray-700">submission_{submission.id}.bin</p>
                </div>
            </div>

            <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition duration-200 space-x-2"
            >
                <Download className="w-5 h-5" />
                <span>Download File</span>
            </button>
        </motion.div>
    );
}