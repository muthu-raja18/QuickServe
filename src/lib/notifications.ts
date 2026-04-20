import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../app/firebase/config";

interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: string;
  requestId?: string;
  relatedId?: string;
}

export const createNotification = async (data: NotificationData) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: false,
      createdAt: serverTimestamp(),
      requestId: data.requestId || null,
      relatedId: data.relatedId || null,
    });
    console.log(`✅ Notification sent to ${data.userId}: ${data.title}`);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const NOTIFICATION_TYPES = {
  REQUEST_RECEIVED: "request_received",
  REQUEST_ACCEPTED: "request_accepted",
  ADDRESS_SHARED: "address_shared",
  JOB_COMPLETED: "job_completed",
  RATING_RECEIVED: "rating_received",
  PROVIDER_APPROVED: "provider_approved",
  PROVIDER_REJECTED: "provider_rejected",
};
