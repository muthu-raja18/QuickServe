"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

interface RoleCardProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  color: string;
  path: string;
}

export default function RoleCard({
  icon: Icon,
  title,
  description,
  color,
  path,
}: RoleCardProps) {
  const router = useRouter();
  const { lang } = useLanguage();

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      onClick={() => router.push(path)}
      className={`p-5 rounded-xl bg-gradient-to-br ${color} text-white cursor-pointer shadow-md hover:shadow-lg min-h-[170px] flex flex-col`}
    >
      <div className="flex flex-col items-center text-center h-full justify-between">
        <div className="p-2 bg-white/20 rounded-lg mb-3">
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-base mb-1">{title}</h3>
          <p className="text-white/85 text-xs leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-1 text-sm font-medium mt-3 pt-2 border-t border-white/20">
          {lang === "en" ? "Get Started" : "தொடங்கவும்"}
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
