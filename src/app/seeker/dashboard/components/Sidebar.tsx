"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { Search, Bell, History, User, LogOut, Menu, X } from "lucide-react";

interface SidebarProps {
  active: "home" | "requests" | "history" | "profile";
  onChange: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  active,
  onChange,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const { lang } = useLanguage();
  const { user, signOut } = useAuth();

  // Handle logout
  const handleLogout = async () => {
    const confirmMessage =
      lang === "en"
        ? "Are you sure you want to logout?"
        : "வெளியேற விரும்புகிறீர்களா?";

    if (window.confirm(confirmMessage)) {
      await signOut();
    }
  };

  // Get user initial
  const getUserInitial = () => {
    if (!user) return "U";
    const name = user.displayName || user.email || "User";
    return name.charAt(0).toUpperCase();
  };

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:fixed top-16 left-0 z-40
          h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <div className="text-white font-bold text-sm">QS</div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                {lang === "en" ? "QuickServe" : "க்விக் சர்வ்"}
              </h2>
              <p className="text-xs text-gray-500">
                {lang === "en" ? "Service Marketplace" : "சேவை சந்தை"}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {getUserInitial()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 text-sm truncate">
                {user?.displayName ||
                  user?.email?.split("@")[0] ||
                  (lang === "en" ? "Seeker" : "தேடுபவர்")}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {lang === "en" ? "Service Seeker" : "சேவை தேடுபவர்"}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation - All items with equal space, no scrolling */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex-1 space-y-1">
            {/* Home */}
            <button
              onClick={() => {
                onChange("home");
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  active === "home"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <div
                className={`
                p-2 rounded-lg flex-shrink-0
                ${
                  active === "home"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }
              `}
              >
                <Search className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm flex-1 text-left">
                {lang === "en" ? "Find Services" : "சேவைகளைத் தேடுங்கள்"}
              </span>
              {active === "home" && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              )}
            </button>

            {/* Requests */}
            <button
              onClick={() => {
                onChange("requests");
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  active === "requests"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <div
                className={`
                p-2 rounded-lg flex-shrink-0
                ${
                  active === "requests"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }
              `}
              >
                <Bell className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm flex-1 text-left">
                {lang === "en" ? "Requests" : "கோரிக்கைகள்"}
              </span>
              {active === "requests" && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              )}
            </button>

            {/* History */}
            <button
              onClick={() => {
                onChange("history");
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  active === "history"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <div
                className={`
                p-2 rounded-lg flex-shrink-0
                ${
                  active === "history"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }
              `}
              >
                <History className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm flex-1 text-left">
                {lang === "en" ? "History" : "வரலாறு"}
              </span>
              {active === "history" && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              )}
            </button>

            {/* Profile */}
            <button
              onClick={() => {
                onChange("profile");
                setSidebarOpen(false);
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  active === "profile"
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }
              `}
            >
              <div
                className={`
                p-2 rounded-lg flex-shrink-0
                ${
                  active === "profile"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }
              `}
              >
                <User className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm flex-1 text-left">
                {lang === "en" ? "Profile" : "சுயவிவரம்"}
              </span>
              {active === "profile" && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
              )}
            </button>
          </div>

          {/* Spacer to push logout to bottom */}
          <div className="flex-1"></div>

          {/* Logout Button - Red color as requested */}
          <button
            onClick={handleLogout}
            className="
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              transition-all duration-200
              border border-red-300
              bg-red-50 text-red-700
              hover:bg-red-100 hover:border-red-400 hover:text-red-800
              mt-4
            "
          >
            <div className="p-2 rounded-lg flex-shrink-0 bg-red-100 text-red-600">
              <LogOut className="w-5 h-5" />
            </div>

            <span className="font-medium text-sm flex-1 text-left">
              {lang === "en" ? "Logout" : "வெளியேறு"}
            </span>

            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
          </button>

          {/* Footer Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              QuickServe • {lang === "en" ? "Service Platform" : "சேவை தளம்"}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
