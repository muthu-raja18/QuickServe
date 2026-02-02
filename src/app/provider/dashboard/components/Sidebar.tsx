"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { db } from "../../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

interface SidebarProps {
  active: string;
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
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [loadingPhoto, setLoadingPhoto] = useState(true);

  // Fetch provider profile photo
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      if (!user?.uid) {
        setLoadingPhoto(false);
        return;
      }

      try {
        setLoadingPhoto(true);
        const providerDoc = await getDoc(doc(db, "providers", user.uid));
        if (providerDoc.exists()) {
          const data = providerDoc.data();
          if (data.photoLink) {
            setProfilePhoto(data.photoLink);
          }
        }
      } catch (error) {
        console.error("Error fetching profile photo:", error);
      } finally {
        setLoadingPhoto(false);
      }
    };

    fetchProfilePhoto();
  }, [user?.uid]);

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
    if (!user) return "P";
    const name = user.displayName || user.email || "Provider";
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

      {/* Sidebar - NOW SCROLLABLE */}
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
        {/* Scrollable Container */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="p-5 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-lg flex items-center justify-center">
                <div className="text-white font-bold text-sm">QS</div>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-base">
                  {lang === "en" ? "QuickServe" : "க்விக் சர்வ்"}
                </h2>
                <p className="text-xs text-gray-500">
                  {lang === "en" ? "Provider Platform" : "வழங்குநர் தளம்"}
                </p>
              </div>
            </div>

            {/* User Info with Profile Photo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {/* Profile Photo Container */}
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
                        // Fallback to initial if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          const fallbackDiv = document.createElement("div");
                          fallbackDiv.className =
                            "w-full h-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg";
                          fallbackDiv.textContent = getUserInitial();
                          parent.appendChild(fallbackDiv);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {getUserInitial()}
                  </div>
                )}

                {/* Verification Badge */}
                {user?.isApproved && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}

                {/* Camera Icon if photo exists */}
                {profilePhoto && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                    <Camera className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {user?.displayName ||
                    user?.email?.split("@")[0] ||
                    (lang === "en" ? "Provider" : "வழங்குநர்")}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {lang === "en" ? "Service Provider" : "சேவை வழங்குநர்"}
                </p>
                {profilePhoto && (
                  <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    {lang === "en"
                      ? "Photo Verified"
                      : "புகைப்படம் சரிபார்க்கப்பட்டது"}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation - All items including logout in scrollable area */}
          <div className="flex-1 p-4">
            <div className="space-y-1">
              {/* Dashboard */}
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
                      ? "bg-teal-50 text-teal-700 border border-teal-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg flex-shrink-0
                  ${
                    active === "home"
                      ? "bg-teal-100 text-teal-600"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
                >
                  <Home className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "Dashboard" : "டாஷ்போர்டு"}
                </span>
                {active === "home" && (
                  <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
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
                      ? "bg-teal-50 text-teal-700 border border-teal-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg flex-shrink-0
                  ${
                    active === "requests"
                      ? "bg-teal-100 text-teal-600"
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
                  <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                )}
              </button>

              {/* My Jobs */}
              <button
                onClick={() => {
                  onChange("jobs");
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active === "jobs"
                      ? "bg-teal-50 text-teal-700 border border-teal-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg flex-shrink-0
                  ${
                    active === "jobs"
                      ? "bg-teal-100 text-teal-600"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
                >
                  <Briefcase className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "My Jobs" : "என் வேலைகள்"}
                </span>
                {active === "jobs" && (
                  <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                )}
              </button>

              {/* Completed Jobs */}
              <button
                onClick={() => {
                  onChange("completed");
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active === "completed"
                      ? "bg-teal-50 text-teal-700 border border-teal-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg flex-shrink-0
                  ${
                    active === "completed"
                      ? "bg-teal-100 text-teal-600"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
                >
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "Completed Jobs" : "முடிக்கப்பட்ட வேலைகள்"}
                </span>
                {active === "completed" && (
                  <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
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
                      ? "bg-teal-50 text-teal-700 border border-teal-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg flex-shrink-0
                  ${
                    active === "profile"
                      ? "bg-teal-100 text-teal-600"
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
                  <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                )}
              </button>

              {/* Availability */}
              <button
                onClick={() => {
                  onChange("availability");
                  setSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200
                  ${
                    active === "availability"
                      ? "bg-teal-50 text-teal-700 border border-teal-100"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <div
                  className={`
                  p-2 rounded-lg flex-shrink-0
                  ${
                    active === "availability"
                      ? "bg-teal-100 text-teal-600"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
                >
                  <Clock className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm flex-1 text-left">
                  {lang === "en" ? "Availability" : "கிடைக்கும் நிலை"}
                </span>
                {active === "availability" && (
                  <div className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0"></div>
                )}
              </button>

              {/* Logout Button - Red and highlighted, now part of the scrollable list */}
              <div className="pt-6 mt-4 border-t border-gray-200">
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
          </div>
        </div>

        {/* Footer Info - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 mt-auto">
          <p className="text-xs text-gray-500 text-center">
            QuickServe •{" "}
            {lang === "en" ? "Provider Platform" : "வழங்குநர் தளம்"}
          </p>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 w-12 h-12 bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-teal-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}
    </>
  );
}
