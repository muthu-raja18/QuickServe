"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, MapPin, X } from "lucide-react";

import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";

import Navbar from "../../components/Navbar";
import Sidebar from "./components/Sidebar";
import HomeSection from "./sections/HomeSection";
import MyRequestsSection from "./sections/MyRequests";
import HistorySection from "./sections/History";
import ProfileSection from "./sections/Profile";

/* Type Definitions */
type SectionType = "home" | "requests" | "history" | "profile";

interface AddressData {
  district: string;
  block: string;
}

/* Section titles for bilingual support */
const SECTION_TITLES = {
  en: {
    home: "Find Services",
    requests: "My Requests",
    history: "History",
    profile: "My Profile",
  },
  ta: {
    home: "சேவைகளைத் தேடுங்கள்",
    requests: "என் கோரிக்கைகள்",
    history: "வரலாறு",
    profile: "என் சுயவிவரம்",
  },
};

/* FAST Loading - No full page spinner */
const FastLoading = ({ lang }: { lang: "en" | "ta" }) => (
  <div className="flex-1 p-4 lg:p-6">
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
      {/* Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    </div>
  </div>
);

export default function SeekerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionType>("home");
  const [seekerAddress, setSeekerAddress] = useState<AddressData | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);

  /* 🔐 FAST AUTH CHECK */
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/seeker/login");
      return;
    }
    if (user.role !== "seeker") {
      router.push("/");
    }
  }, [user, authLoading, router]);

  /* 📍 Load seeker address */
  useEffect(() => {
    if (!user?.uid) return;

    const loadAddress = async () => {
      try {
        setAddressLoading(true);
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();
          if (data?.address?.district && data?.address?.block) {
            setSeekerAddress({
              district: data.address.district,
              block: data.address.block,
            });
          }
        }
      } catch (error) {
        console.error("Address load error:", error);
      } finally {
        setAddressLoading(false);
      }
    };

    loadAddress();
  }, [user?.uid]);

  /* 🧠 SINGLE-PAGE SECTION SWITCH */
  const CurrentSection = useMemo(() => {
    switch (activeSection) {
      case "home":
        return HomeSection;
      case "requests":
        return MyRequestsSection;
      case "history":
        return HistorySection;
      case "profile":
        return ProfileSection;
      default:
        return HomeSection;
    }
  }, [activeSection]);

  // Show loading ONLY if auth is still checking
  if (authLoading) {
    return <FastLoading lang={lang} />;
  }

  // Don't return null during redirects - show loading
  if (!user || user.role !== "seeker") {
    return <FastLoading lang={lang} />;
  }

  // Section title with bilingual support
  const sectionTitle = SECTION_TITLES[lang][activeSection];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main container */}
      <div className="flex">
        {/* Sidebar - Now at same level as content */}
        <Sidebar
          active={activeSection}
          onChange={(section) => setActiveSection(section as SectionType)}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Main Content */}
        <main
          className={`
            flex-1 min-h-screen
            transition-all duration-300
            ${sidebarOpen ? "ml-64" : "ml-0 lg:ml-64"}
            pt-16 /* ADDED: Push content below navbar */
          `}
        >
          {/* Content wrapper - REMOVED pt-16 from here */}
          <div className="p-4 lg:p-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-2xl font-bold text-gray-800 capitalize truncate"
                    style={{
                      fontFamily:
                        lang === "ta"
                          ? "'Noto Sans Tamil', sans-serif"
                          : "'Inter', sans-serif",
                      fontSize:
                        lang === "ta" ? "calc(1.5rem * 1.05)" : "1.5rem",
                    }}
                  >
                    {sectionTitle}
                  </h1>

                  {/* Address */}
                  {activeSection !== "profile" && (
                    <div className="mt-2">
                      {addressLoading ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                        </div>
                      ) : seekerAddress ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {seekerAddress.district}, {seekerAddress.block}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {sidebarOpen ? (
                      <X className="w-6 h-6 text-gray-600" />
                    ) : (
                      <Menu className="w-6 h-6 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Section Content */}
            <div className="h-full">
              <CurrentSection />
            </div>

            {/* Render children */}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
