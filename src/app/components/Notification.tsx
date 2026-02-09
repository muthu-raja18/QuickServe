"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error" | "info"; // Added "info" type
  onClose?: () => void;
}

export default function Notification({
  message,
  type,
  onClose,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "info":
        return "bg-blue-500"; // Blue for info messages
      default:
        return "bg-gray-500";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg font-medium text-white ${getBgColor()}`}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}
