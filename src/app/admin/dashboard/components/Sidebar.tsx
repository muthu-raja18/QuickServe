"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  Home,
  Bell,
  Briefcase,
  CheckCircle,
  User,
  Clock,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  Camera,
  Users,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";
import { db } from "../../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface SidebarProps {
  active: string;
  onChange: (section: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function AdminSidebar({
  active,
  onChange,
  sidebarOpen,
  setSidebarOpen,
}: SidebarProps) {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, signOut } = useAuth();
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  // Handle logout
  const handleLogout = async () => {
    const confirmMessage =
      lang === "en"
        ? "Are you sure you want to logout?"
        : "வெளியேற விரும்புகிறீர்களா?";
    if (window.confirm(confirmMessage)) {
      await signOut();
      router.push("/admin/login");
    }
  };

  // Get user initial
  const getUserInitial = () => {
    if (!user) return "A";
    const name =
      user.displayName || user.email || user.adminData?.name || "Admin";
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

  // Determine if user is super admin
  const isSuperAdmin = user?.adminData?.district === null;
  const adminDistrict = user?.adminData?.district;

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
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Header – fixed at top (not scrollable) */}
        <div className="p-5 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">
                {lang === "en" ? "QuickServe Admin" : "க்விக் சர்வ் நிர்வாகி"}
              </h2>
              <p className="text-xs text-gray-500">
                {isSuperAdmin
                  ? lang === "en"
                    ? "Super Admin"
                    : "முதன்மை நிர்வாகி"
                  : lang === "en"
                    ? `District Admin - ${adminDistrict}`
                    : `மாவட்ட நிர்வாகி - ${adminDistrict}`}
              </p>
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {loadingPhoto ? (
                <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
              ) : profilePhoto ? (
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const parent = target.parentElement;
                      if (parent) {
                        const fallbackDiv = document.createElement("div");
                        fallbackDiv.className =
                          "w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg";
                        fallbackDiv.textContent = getUserInitial();
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {getUserInitial()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 text-sm truncate">
                {user?.adminData?.name ||
                  user?.displayName ||
                  user?.email?.split("@")[0] ||
                  (lang === "en" ? "Admin" : "நிர்வாகி")}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {isSuperAdmin
                  ? lang === "en"
                    ? "Super Administrator"
                    : "முதன்மை நிர்வாகி"
                  : lang === "en"
                    ? "District Administrator"
                    : "மாவட்ட நிர்வாகி"}
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Navigation Area – items scroll, logout stays at bottom */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {/* Dashboard / Overview */}
              <button
                onClick={() => {
                  onChange("overview");
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active === "overview"
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    active === "overview"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Home className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "Overview" : "மேலோட்டம்"}
                </span>
                {active === "overview" && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                )}
              </button>

              {/* Pending Approvals */}
              <button
                onClick={() => {
                  onChange("approvals");
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active === "approvals"
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    active === "approvals"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en"
                    ? "Pending Approvals"
                    : "நிலுவையில் உள்ள அங்கீகாரங்கள்"}
                </span>
                {active === "approvals" && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                )}
              </button>

              {/* Service Requests */}
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
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    active === "requests"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "Service Requests" : "சேவை கோரிக்கைகள்"}
                </span>
                {active === "requests" && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                )}
              </button>

              {/* Analytics (only for super admin) */}
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    onChange("analytics");
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${
                      active === "analytics"
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <div
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      active === "analytics"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-sm flex-1 text-left">
                    {lang === "en" ? "Analytics" : "பகுப்பாய்வு"}
                  </span>
                  {active === "analytics" && (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  )}
                </button>
              )}

              {/* System Health */}
              <button
                onClick={() => {
                  onChange("system");
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active === "system"
                      ? "bg-blue-50 text-blue-700 border border-blue-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    active === "system"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "System Health" : "கணினி ஆரோக்கியம்"}
                </span>
                {active === "system" && (
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
                  className={`p-2 rounded-lg flex-shrink-0 ${
                    active === "profile"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
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
          </div>

          {/* Logout Button – fixed at bottom, not scrollable */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                border border-red-300
                bg-red-50 text-red-700
                hover:bg-red-100 hover:border-red-400 hover:text-red-800
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
          </div>
        </div>

        {/* Footer Info – optional, placed at bottom after logout */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <p className="text-xs text-gray-500 text-center">
            QuickServe •{" "}
            {lang === "en" ? "Admin Panel" : "நிர்வாக கட்டுப்பாட்டு பலகை"}
          </p>
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
