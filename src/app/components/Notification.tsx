"use client";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-8 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg font-medium text-white ${
          type === "success" ? "bg-green-500" : "bg-red-500"
        }`}
      >
        {message}
      </motion.div>
    </AnimatePresence>
  );
}
