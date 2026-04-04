"use client";

import { useLanguage } from "../../../context/LanguageContext";
import {
  Shield,
  Download,
  MessageSquare,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

export default function SystemSection() {
  const { lang } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          {lang === "en" ? "Quick Actions" : "விரைவு செயல்கள்"}
        </h3>
        <div className="space-y-3">
          <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4" /> System Logs
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition" />
          </button>
          <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <Download className="w-4 h-4" /> Export Data
            </div>
            <ChevronRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition" />
          </button>
          <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-xl flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-4 h-4" /> Broadcast
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition" />
          </button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          {lang === "en" ? "System Health" : "கணினி ஆரோக்கியம்"}
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm">
              <span>Uptime</span>
              <span className="text-emerald-600">99.8%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className="bg-emerald-500 h-2 rounded-full w-[99.8%]"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>Response Time</span>
              <span className="text-blue-600">320ms</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className="bg-blue-500 h-2 rounded-full w-[85%]"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm">
              <span>Error Rate</span>
              <span className="text-yellow-600">0.2%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div className="bg-yellow-500 h-2 rounded-full w-[2%]"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
