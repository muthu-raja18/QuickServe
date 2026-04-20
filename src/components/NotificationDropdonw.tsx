// components/NotificationDropdonw.tsx - Opens to RIGHT
"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../app/firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  orderBy,
  limit,
} from "firebase/firestore";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "request_accepted" | "job_completed" | "info" | "success";
  read: boolean;
  createdAt: any;
  requestId?: string;
}

interface NotificationDropdownProps {
  userId: string;
}

export default function NotificationDropdown({
  userId,
}: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(20),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: Notification[] = [];
      let unread = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const notif = { id: doc.id, ...data } as Notification;
        notifs.push(notif);
        if (!notif.read) unread++;
      });

      setNotifications(notifs);
      setUnreadCount(unread);
    });

    return () => unsubscribe();
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mark as read
  const markAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read);
    await Promise.all(
      unreadNotifications.map((n) =>
        updateDoc(doc(db, "notifications", n.id), { read: true }),
      ),
    );
  };

  // Get icon based on type
  const getIcon = (type: string) => {
    switch (type) {
      case "request_accepted":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "job_completed":
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none cursor-pointer"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ✅ Dropdown opens to RIGHT (right-0) - stays on screen since bell is on right */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 bg-white rounded-xl shadow-xl border border-gray-200 
              overflow-hidden w-[calc(100vw-2rem)] max-w-sm
              mt-2
              md:w-96
              right-0
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="font-semibold text-gray-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({unreadCount} unread)
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Updates will appear here
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`
                      p-4 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer
                      ${!notif.read ? "bg-blue-50/30" : ""}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${!notif.read ? "font-semibold text-gray-900" : "text-gray-700"}`}
                        >
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notif.createdAt?.toDate
                            ? notif.createdAt.toDate().toLocaleDateString()
                            : new Date().toLocaleDateString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  Close
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
