export interface InboxResponse {
    id: string;
    jobId: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    receiverName: string;
    createdAt: string;
    read: boolean;
    message: string;
}
