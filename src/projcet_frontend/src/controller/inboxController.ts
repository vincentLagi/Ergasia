import { projcet_backend_single } from "../../../declarations/projcet_backend_single";
import { Inbox } from "../../../declarations/projcet_backend_single/projcet_backend_single.did";
import { InboxResponse } from "../shared/types/Inbox";
import { agentService } from "../singleton/agentService";
import { formatDate } from "../utils/dateUtils";

export const createInbox = async (
  receiverId: string,
  jobId: string,
  senderId: string,
  inbox_type: string,
  message: string
): Promise<Inbox | null> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.createInbox(
      receiverId,
      jobId,
      senderId,
      inbox_type,
      message,
    );
    if ("ok" in result) {
      return result.ok;
    }
    console.error("Failed to create inbox:", result.err);
    return null;
  } catch (error) {
    console.error("Failed to create inbox:", error);
    return null;
  }
};

export const getInbox = async (inboxId: string): Promise<Inbox | null> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getInbox(inboxId);
    if ("ok" in result) {
      return result.ok;
    }
    console.error("Failed to get inbox:", result.err);
    return null;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return null;
  }
};

export const getAllInbox = async (): Promise<Inbox[] | null> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getAllInbox();
    return result;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return null;
  }
};

export const getReceiverInbox = async (
  receiverId: string
): Promise<Inbox[] | null> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getReceiverInbox(receiverId);
    return result;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return null;
  }
};

export const getSenderInbox = async (
  senderId: string
): Promise<Inbox[] | null> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getSenderInbox(senderId);
    return result;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return null;
  }
};

export const getAllInboxByUserId = async (
  userId: string
): Promise<InboxResponse[] | null> => {
  const agent = await agentService.getAgent();
  try {
    console.log("Fetching inbox for user:", userId);
    const result = await projcet_backend_single.getAllInboxByUserId(userId);
    console.log("Inbox Result:", result);
    const responses: InboxResponse[] = await Promise.all(
      result.map(async (i) => {
        const senderResult = await projcet_backend_single.getUserById(i.senderId);
        const receiverResult = await projcet_backend_single.getUserById(i.receiverId);
        
        const senderName = "ok" in senderResult ? senderResult.ok.username : "";
        const receiverName = "ok" in receiverResult ? receiverResult.ok.username : "";

        return {
          id: i.id,
          jobId: i.jobId,
          senderId: i.senderId,
          receiverId: i.receiverId,
          senderName: senderName,
          receiverName: receiverName,
          createdAt: formatDate(i.createdAt),
          read: i.read,
          message: i.message,
        };
      })
    );
    return responses;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return null;
  }
};

export const getAllInboxBySubmissionType = async (
  submissionType: string
): Promise<Inbox[] | null> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getAllInboxBySubmissionType(submissionType);
    return result;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return null;
  }
};

export const getInboxMessagesFromAppliers = async (
  jobId: string,
  userId: string
): Promise<any[]> => {
  const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.getInboxMessagesFromAppliers(jobId, userId);
      const responses: InboxResponse[] = await Promise.all(
      result.map(async (i) => {
        const senderResult = await projcet_backend_single.getUserById(i.senderId);
        const receiverResult = await projcet_backend_single.getUserById(i.receiverId);
        
        const senderName = "ok" in senderResult ? senderResult.ok.username : "";
        const receiverName = "ok" in receiverResult ? receiverResult.ok.username : "";
        
        return {
          id: i.id,
          jobId: i.jobId,
          senderId: i.senderId,
          receiverId: i.receiverId,
          senderName: senderName,
          receiverName: receiverName,
          createdAt: formatDate(i.createdAt),
          read: i.read,
          message: i.message,
        };
      })
    );
    return responses;
  } catch (error) {
    console.error("Failed to get inbox:", error);
    return [] ;
  }
};

export const markInboxAsRead = async (inboxId: string): Promise<boolean> => {
 const agent = await agentService.getAgent();
  try {
    const result = await projcet_backend_single.markAsRead(inboxId);
    if ("ok" in result) {
      return true;
    }
    console.error("Failed to mark inbox as read:", result.err);
    return false;
  } catch (error) {
    console.error("Failed to mark inbox as read:", error);
    return false;
  }
};
