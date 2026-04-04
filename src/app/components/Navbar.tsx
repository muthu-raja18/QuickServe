"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { lang } = useLanguage();
  const pathname = usePathname();

  // Determine role from URL path
  const getRoleFromPath = () => {
    if (pathname?.startsWith("/provider")) return "provider";
    if (pathname?.startsWith("/admin")) return "admin";
    return "seeker"; // default for landing page, /seeker/*, or any other
  };

  const role = getRoleFromPath();

  // Color mapping based on role
  const getGradientClasses = () => {
    switch (role) {
      case "provider":
        return "bg-gradient-to-r from-green-600 to-emerald-700 border-green-500";
      case "admin":
        return "bg-gradient-to-r from-gray-700 to-gray-900 border-gray-600";
      default: // seeker or landing
        return "bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500";
    }
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full ${getGradientClasses()} shadow-md`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-6 py-3 flex items-center justify-between">
        {/* Project Title */}
        <motion.h1
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`
            font-bold tracking-wide select-none
            ${
              lang === "ta"
                ? "font-noto-sans-tamil text-lg sm:text-xl"
                : "font-inter text-lg sm:text-xl"
            }
            text-white
          `}
        >
          QuickServe
        </motion.h1>

        {/* Language Toggle */}
        <LanguageToggle />
      </div>
    </nav>
  );
}
