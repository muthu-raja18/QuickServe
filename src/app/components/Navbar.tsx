"use client";

import React from "react";
import { motion } from "framer-motion";
import LanguageToggle from "./LanguageToggle";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { lang } = useLanguage();

  return (
    <nav className="fixed top-0 z-50 w-full bg-indigo-600 border-b border-indigo-500 shadow-md">
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
