"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Zap, Clock, AlertCircle, MapPin, Briefcase } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  orderBy,
  getDoc,
} from "firebase/firestore";
import Navbar from "../../components/Navbar";
import Sidebar from "./components/Sidebar";

// Lazy load sections with proper loading skeletons
const SectionSkeleton = () => (
  <div className="space-y-6">
    <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
);

const HomeSection = dynamic(() => import("./sections/HomeSection"), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

const RequestsSection = dynamic(() => import("./sections/Requests"), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

const JobsSection = dynamic(() => import("./sections/Jobs"), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

const CompletedJobSection = dynamic(() => import("./sections/CompletedJobs"), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

const AvailabilitySection = dynamic(() => import("./sections/Availability"), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

const ProfileSection = dynamic(() => import("./sections/Profile"), {
  loading: () => <SectionSkeleton />,
  ssr: false,
});

import dynamic from "next/dynamic";

// Types
interface DashboardStats {
  pendingRequests: number;
  urgentRequests: number;
  activeJobs: number;
  awaitingConfirmation: number;
  completedJobs: number;
  averageRating: number;
  providerDistrict: string;
  providerServiceType: string;
}

interface ProviderData {
  district: string;
  serviceType: string;
  availability: boolean;
  rating: number;
  completedJobs: number;
}

// Loading component
const DashboardLoading = ({ lang }: { lang: string }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-12 h-12 bg-teal-500 rounded-full opacity-20" />
      </div>
    </div>
    <p
      className="mt-6 text-gray-600 font-medium"
      style={{
        fontFamily:
          lang === "ta"
            ? "'Noto Sans Tamil', sans-serif"
            : "'Inter', sans-serif",
        fontSize: lang === "ta" ? "1.05rem" : "1rem",
      }}
    >
      {lang === "en" ? "Loading dashboard..." : "டாஷ்போர்டு ஏற்றப்படுகிறது..."}
    </p>
  </div>
);

export default function ProviderDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang } = useLanguage();
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const [isAvailable, setIsAvailable] = useState(true);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    pendingRequests: 0,
    urgentRequests: 0,
    activeJobs: 0,
    awaitingConfirmation: 0,
    completedJobs: 0,
    averageRating: 0,
    providerDistrict: "",
    providerServiceType: "",
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false); // ADDED

  // Set mounted state
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Bilingual styles
  const bilingualStyle = useMemo(
    () => ({
      fontFamily:
        lang === "ta" ? "'Noto Sans Tamil', sans-serif" : "'Inter', sans-serif",
      fontSize: lang === "ta" ? "0.95rem" : "0.875rem",
      lineHeight: lang === "ta" ? "1.5" : "1.4",
    }),
    [lang]
  );

  // 🔥 FIXED: Redirect if not authenticated or not approved provider
  useEffect(() => {
    if (authLoading) return;

    // Mark that initial check is done
    setInitialCheckDone(true);

    console.log("Provider Auth Check:", {
      loading: authLoading,
      hasUser: !!user,
      userRole: user?.role,
      isApproved: user?.isApproved,
      hasProviderData: !!user?.providerData,
    });

    if (!user) {
      console.log("No user found, redirecting to provider login");
      router.push("/provider/login");
      return;
    }

    if (user.role !== "provider") {
      console.log("User is not a provider, redirecting to home");
      router.push("/");
      return;
    }

    if (!user.isApproved) {
      console.log("Provider not approved, redirecting to waiting page");
      router.push("/provider/waiting");
      return;
    }

    console.log("Provider authenticated and approved, staying on dashboard");
  }, [user, authLoading, router]);

  // Calculate if request is urgent (expiring in <30 minutes) - Memoized
  const isRequestUrgent = useCallback((expiresAt: Timestamp): boolean => {
    try {
      const expiryDate = expiresAt.toDate();
      const now = new Date();
      const timeRemaining = expiryDate.getTime() - now.getTime();
      return timeRemaining > 0 && timeRemaining < 30 * 60 * 1000; // Less than 30 minutes
    } catch (error) {
      return false;
    }
  }, []);

  // Load provider data - Separated from stats loading
  useEffect(() => {
    if (!user?.uid || !user.providerData) return;

    let isMounted = true;

    const loadProviderData = async () => {
      try {
        const providerRef = doc(db, "providers", user.uid);
        const providerDoc = await getDoc(providerRef);

        if (!isMounted) return;

        if (providerDoc.exists()) {
          const data = providerDoc.data();
          const providerInfo: ProviderData = {
            district: data.district || "",
            serviceType: data.serviceType || "",
            availability: data.availability !== false,
            rating: data.rating?.average || 0,
            completedJobs: data.completedJobs || 0,
          };

          setProviderData(providerInfo);
          setIsAvailable(providerInfo.availability);

          // Update stats with provider info
          setDashboardStats((prev) => ({
            ...prev,
            providerDistrict: providerInfo.district,
            providerServiceType: providerInfo.serviceType,
            averageRating: providerInfo.rating,
            completedJobs: providerInfo.completedJobs,
          }));
        }
      } catch (error) {
        console.error("Error loading provider data:", error);
      }
    };

    loadProviderData();

    return () => {
      isMounted = false;
    };
  }, [user?.uid]);

  // REAL-TIME: Load all stats - OPTIMIZED
  useEffect(() => {
    if (!user?.uid || !providerData) {
      setLoadingStats(false);
      return;
    }

    let isMounted = true;
    setLoadingStats(true);

    const unsubscribeFunctions: (() => void)[] = [];

    try {
      // 1. Listen for pending requests in provider's district and service type
      const requestsQuery = query(
        collection(db, "serviceRequests"),
        where("status", "==", "pending"),
        where("district", "==", providerData.district),
        orderBy("createdAt", "desc")
      );

      const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        if (!isMounted) return;

        let pendingCount = 0;
        let urgentCount = 0;

        snapshot.docs.forEach((doc) => {
          const request = doc.data();

          if (
            isAvailable &&
            request.serviceType === providerData.serviceType &&
            request.expiresAt &&
            request.expiresAt.toDate() > new Date()
          ) {
            pendingCount++;

            if (request.expiresAt && isRequestUrgent(request.expiresAt)) {
              urgentCount++;
            }
          }
        });

        setDashboardStats((prev) => ({
          ...prev,
          pendingRequests: pendingCount,
          urgentRequests: urgentCount,
        }));
      });

      unsubscribeFunctions.push(unsubscribeRequests);

      // 2. Load active jobs (accepted by this provider)
      const activeJobsQuery = query(
        collection(db, "serviceRequests"),
        where("providerId", "==", user.uid),
        where("status", "in", ["accepted", "in_progress"])
      );

      const unsubscribeActiveJobs = onSnapshot(activeJobsQuery, (snapshot) => {
        if (!isMounted) return;
        setDashboardStats((prev) => ({
          ...prev,
          activeJobs: snapshot.size,
        }));
      });

      unsubscribeFunctions.push(unsubscribeActiveJobs);

      // 3. Load jobs awaiting confirmation
      const awaitingConfirmationQuery = query(
        collection(db, "serviceRequests"),
        where("providerId", "==", user.uid),
        where("status", "==", "awaiting_confirmation")
      );

      const unsubscribeAwaitingConfirmation = onSnapshot(
        awaitingConfirmationQuery,
        (snapshot) => {
          if (!isMounted) return;
          setDashboardStats((prev) => ({
            ...prev,
            awaitingConfirmation: snapshot.size,
          }));
        }
      );

      unsubscribeFunctions.push(unsubscribeAwaitingConfirmation);

      // Set loading to false after initial load
      const timer = setTimeout(() => {
        if (isMounted) {
          setLoadingStats(false);
        }
      }, 500);

      // Cleanup all listeners and timer
      return () => {
        isMounted = false;
        clearTimeout(timer);
        unsubscribeFunctions.forEach((unsub) => unsub());
      };
    } catch (error) {
      console.error("Error setting up listeners:", error);
      if (isMounted) {
        setLoadingStats(false);
      }
    }
  }, [user?.uid, providerData, isAvailable, isRequestUrgent]);

  // Update availability in Firestore - Memoized
  const updateAvailability = useCallback(
    async (available: boolean) => {
      if (!user?.uid) return;

      try {
        const providerRef = doc(db, "providers", user.uid);
        await updateDoc(providerRef, {
          availability: available,
          lastStatusUpdate: Timestamp.now(),
        });
        setIsAvailable(available);

        if (available) {
          setActiveSection("requests");
        }
      } catch (error) {
        console.error("Error updating availability:", error);
        setIsAvailable(!available);
      }
    },
    [user?.uid]
  );

  // Handle availability toggle
  const handleAvailabilityToggle = useCallback(async () => {
    const newAvailability = !isAvailable;
    setIsAvailable(newAvailability);
    await updateAvailability(newAvailability);
  }, [isAvailable, updateAvailability]);

  // Section titles with bilingual support
  const sectionTitles = useMemo(() => {
    const titles = {
      en: {
        home: "Dashboard Overview",
        requests: "Service Requests",
        jobs: "Active Jobs",
        completed: "Completed Jobs",
        availability: "Availability Settings",
        profile: "Profile Settings",
      },
      ta: {
        home: "டாஷ்போர்டு கண்ணோட்டம்",
        requests: "சேவை கோரிக்கைகள்",
        jobs: "செயலில் உள்ள வேலைகள்",
        completed: "முடிக்கப்பட்ட வேலைகள்",
        availability: "கிடைக்கும் நிலை அமைப்புகள்",
        profile: "சுயவிவர அமைப்புகள்",
      },
    };
    return titles[lang];
  }, [lang]);

  // Section descriptions
  const sectionDescriptions = useMemo(() => {
    const desc = {
      en: {
        home: "Welcome back! Here's your business overview",
        requests: "Respond to new service requests in your area",
        jobs: "Manage your ongoing service jobs",
        completed: "View your completed jobs and ratings",
        availability: "Set your availability status",
        profile: "Manage your profile information",
      },
      ta: {
        home: "மீண்டும் வரவேற்கிறோம்! உங்கள் வணிக கண்ணோட்டம் இங்கே",
        requests: "உங்கள் பகுதியில் புதிய சேவை கோரிக்கைகளுக்கு பதிலளிக்கவும்",
        jobs: "உங்கள் நடந்து கொண்டிருக்கும் சேவை வேலைகளை நிர்வகிக்கவும்",
        completed: "உங்கள் முடிக்கப்பட்ட வேலைகள் மற்றும் மதிப்பீடுகளைக் காண்க",
        availability: "உங்கள் கிடைக்கும் நிலையை அமைக்கவும்",
        profile: "உங்கள் சுயவிவர தகவலை நிர்வகிக்கவும்",
      },
    };
    return desc[lang];
  }, [lang]);

  // Render active section - Memoized
  const renderContent = useMemo(() => {
    const sections = {
      home: <HomeSection />,
      requests: providerData ? (
        <RequestsSection
          providerDistrict={providerData.district}
          providerServiceType={providerData.serviceType}
          isAvailable={isAvailable}
        />
      ) : (
        <SectionSkeleton />
      ),
      jobs: <JobsSection />,
      completed: <CompletedJobSection />,
      availability: (
        <AvailabilitySection
          isAvailable={isAvailable}
          setIsAvailable={updateAvailability}
        />
      ),
      profile: <ProfileSection />,
    };
    return sections[activeSection as keyof typeof sections] || sections.home;
  }, [activeSection, providerData, isAvailable, updateAvailability]);

  // Calculate total notifications - Memoized
  const totalNotifications = useMemo(() => {
    return (
      dashboardStats.pendingRequests +
      dashboardStats.urgentRequests +
      dashboardStats.awaitingConfirmation
    );
  }, [
    dashboardStats.pendingRequests,
    dashboardStats.urgentRequests,
    dashboardStats.awaitingConfirmation,
  ]);

  // Show loading while checking auth
  if (authLoading || !mounted || !initialCheckDone) {
    // UPDATED
    return <DashboardLoading lang={lang} />;
  }

  // Don't render if no user or not provider
  if (!user || user.role !== "provider" || !user.isApproved) {
    return <DashboardLoading lang={lang} />; // Return loading instead of null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* DASHBOARD CONTENT AREA */}
      <div className="pt-16">
        <div className="flex">
          <Sidebar
            active={activeSection}
            onChange={setActiveSection}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />

          {/* MAIN CONTENT */}
          <main
            className={`
              flex-1 p-4 lg:p-6 min-h-[calc(100vh-64px)]
              transition-all duration-300
              ${sidebarOpen ? "ml-64" : "ml-0 lg:ml-64"}
              pt-16
            `}
          >
            {/* Dashboard Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Section Title & Info */}
                <div className="flex-1 min-w-0">
                  <h1
                    className="text-2xl font-bold text-gray-800 truncate"
                    style={bilingualStyle}
                  >
                    {sectionTitles[activeSection as keyof typeof sectionTitles]}
                  </h1>
                  <p className="text-gray-600 mt-2" style={bilingualStyle}>
                    {
                      sectionDescriptions[
                        activeSection as keyof typeof sectionDescriptions
                      ]
                    }
                  </p>

                  {/* Provider Location & Service Badge */}
                  {providerData?.district && (
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-full border border-blue-200"
                        style={bilingualStyle}
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {providerData.district}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-800 rounded-full border border-teal-200"
                        style={bilingualStyle}
                      >
                        <Briefcase className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium truncate max-w-[150px]">
                          {providerData.serviceType}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Quick Stats & Actions */}
                <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
                  {/* Availability Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAvailabilityToggle}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      isAvailable
                        ? "bg-green-100 text-green-800 border border-green-200 hover:bg-green-200"
                        : "bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200"
                    }`}
                    style={bilingualStyle}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isAvailable
                          ? "bg-green-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {isAvailable
                        ? lang === "en"
                          ? "Available"
                          : "கிடைக்கும்"
                        : lang === "en"
                        ? "Busy"
                        : "பிஸியாக"}
                    </span>
                    <Zap className="w-4 h-4 flex-shrink-0" />
                  </motion.button>

                  {/* Notifications Badge */}
                  {totalNotifications > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (dashboardStats.urgentRequests > 0) {
                          setActiveSection("requests");
                        } else if (dashboardStats.awaitingConfirmation > 0) {
                          setActiveSection("jobs");
                        } else {
                          setActiveSection("requests");
                        }
                      }}
                      className="relative p-2"
                    >
                      <Bell className="w-5 h-5 text-gray-600" />
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute -top-1 -right-1 w-6 h-6 text-white text-xs rounded-full flex items-center justify-center font-medium border-2 border-white ${
                          dashboardStats.urgentRequests > 0
                            ? "bg-red-500"
                            : dashboardStats.awaitingConfirmation > 0
                            ? "bg-purple-500"
                            : "bg-amber-500"
                        }`}
                      >
                        {totalNotifications > 9 ? "9+" : totalNotifications}
                      </motion.span>
                      {dashboardStats.urgentRequests > 0 && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full opacity-20"
                        />
                      )}
                    </motion.button>
                  )}

                  {/* Urgent Requests Alert */}
                  {dashboardStats.urgentRequests > 0 &&
                    activeSection !== "requests" && (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setActiveSection("requests")}
                        className="px-4 py-2 bg-red-100 text-red-800 border border-red-200 rounded-lg flex items-center gap-2 hover:bg-red-200 whitespace-nowrap"
                        style={bilingualStyle}
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {dashboardStats.urgentRequests}{" "}
                          {lang === "en" ? "urgent" : "அவசர"}
                        </span>
                      </motion.button>
                    )}

                  {/* Awaiting Confirmation Alert */}
                  {dashboardStats.awaitingConfirmation > 0 &&
                    activeSection !== "jobs" && (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => setActiveSection("jobs")}
                        className="px-4 py-2 bg-purple-100 text-purple-800 border border-purple-200 rounded-lg flex items-center gap-2 hover:bg-purple-200 whitespace-nowrap"
                        style={bilingualStyle}
                      >
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {dashboardStats.awaitingConfirmation}{" "}
                          {lang === "en" ? "to confirm" : "உறுதிப்படுத்த"}
                        </span>
                      </motion.button>
                    )}
                </div>
              </div>
            </motion.div>

            {/* Content Section */}
            <Suspense fallback={<SectionSkeleton />}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  {loadingStats ? <SectionSkeleton /> : renderContent}
                </motion.div>
              </AnimatePresence>
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
