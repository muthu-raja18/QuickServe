"use client";

import React from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageToggle() {
  const { lang, toggleLanguage } = useLanguage();

  return (
    <div
      onClick={toggleLanguage}
      className="
        flex items-center gap-2 cursor-pointer select-none
        rounded-full px-2 py-1
        hover:bg-indigo-500/30 transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-indigo-300
      "
    >
      {/* EN */}
      <span
        className={`text-sm font-semibold transition-colors ${
          lang === "en" ? "text-white" : "text-indigo-200"
        }`}
      >
        EN
      </span>

      {/* Toggle */}
      <div className="relative w-12 h-6 bg-indigo-400 rounded-full p-1 shadow-inner">
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            lang === "ta" ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </div>

      {/* TA */}
      <span
        className={`text-sm font-semibold transition-colors ${
          lang === "ta" ? "text-white" : "text-indigo-200"
        }`}
      >
        TA
      </span>
    </div>
  );
}
