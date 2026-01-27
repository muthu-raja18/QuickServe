// src/app/provider/dashboard/sections/HomeSection.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import {
  Bell,
  Briefcase,
  CheckCircle,
  Star,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  AlertCircle,
  Loader2,
  Zap,
} from "lucide-react";

interface DashboardStats {
  newRequests: number;
  activeJobs: number;
  completedJobs: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  avgResponseTime: string;
}

// Consistent rating calculation function (same as seeker section)
const calculateProviderRatingFromJobs = async (
  providerId: string
): Promise<{ rating: number; completedJobs: number; totalReviews: number }> => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "==", "completed"),
      where("seekerRating", ">", 0)
    );

    const snapshot = await getDocs(q);
    const jobs = snapshot.docs.map((doc) => ({
      rating: doc.data().seekerRating || 0,
    }));

    const completedJobs = snapshot.size;
    const ratedJobs = jobs.filter((job) => job.rating > 0);
    const totalReviews = ratedJobs.length;

    let averageRating = 0;
    if (ratedJobs.length > 0) {
      const totalRating = ratedJobs.reduce((sum, job) => sum + job.rating, 0);
      averageRating = totalRating / ratedJobs.length;
    }

    return {
      rating: parseFloat(averageRating.toFixed(1)),
      completedJobs,
      totalReviews,
    };
  } catch (error) {
    console.error("Error calculating provider rating:", error);
    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  }
};

// Calculate average response time
const calculateAvgResponseTime = async (
  providerId: string
): Promise<string> => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "in", ["accepted", "completed", "rejected"])
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          createdAt: data.createdAt?.toDate(),
          respondedAt: data.respondedAt?.toDate() || data.updatedAt?.toDate(),
        };
      })
      .filter((req) => req.createdAt && req.respondedAt);

    if (requests.length === 0) return "N/A";

    let totalMinutes = 0;
    let count = 0;

    requests.forEach((req) => {
      const createdAt = req.createdAt!;
      const respondedAt = req.respondedAt!;
      const diffMinutes = Math.round(
        (respondedAt.getTime() - createdAt.getTime()) / (1000 * 60)
      );

      if (diffMinutes > 0 && diffMinutes < 1440) {
        // Within 24 hours
        totalMinutes += diffMinutes;
        count++;
      }
    });

    if (count === 0) return "N/A";

    const avgMinutes = Math.round(totalMinutes / count);

    if (avgMinutes < 60) return `${avgMinutes}m`;
    if (avgMinutes < 120) return "1h";
    return `${Math.round(avgMinutes / 60)}h`;
  } catch (error) {
    console.error("Error calculating response time:", error);
    return "N/A";
  }
};

// Bilingual texts
const TEXTS = {
  en: {
    welcome: "Welcome back,",
    subtitle: "Here's your dashboard overview",
    newRequests: "New Requests",
    activeJobs: "Active Jobs",
    completedJobs: "Completed",
    rating: "Rating",
    responseRate: "Response Rate",
    avgResponseTime: "Avg. Response Time",
    location: "Location",
    serviceArea: "Service Area",
    district: "District",
    serviceType: "Service Type",
    availability: "Availability",
    quickTips: "Quick Tips",
    tip1: "Respond quickly to requests",
    tip1Desc: "Accept within 30 min for better visibility",
    tip2: "Update availability",
    tip2Desc: "Mark yourself available to get more requests",
    tip3: "Complete jobs promptly",
    tip3Desc: "Update status after finishing service",
    loading: "Loading dashboard...",
    error: "Failed to load dashboard",
    noResponseTime: "No data yet",
    excellentResponse: "Excellent response! 👍",
    goodResponse: "Good response",
    improveResponse: "Try to respond faster",
  },
  ta: {
    welcome: "மீண்டும் வரவேற்கிறோம்,",
    subtitle: "உங்கள் டாஷ்போர்டு கண்ணோட்டம் இங்கே",
    newRequests: "புதிய கோரிக்கைகள்",
    activeJobs: "செயலில் உள்ள வேலைகள்",
    completedJobs: "முடிக்கப்பட்டது",
    rating: "மதிப்பீடு",
    responseRate: "பதில் விகிதம்",
    avgResponseTime: "சராசரி பதில் நேரம்",
    location: "இடம்",
    serviceArea: "சேவை பகுதி",
    district: "மாவட்டம்",
    serviceType: "சேவை வகை",
    availability: "கிடைக்கும் தன்மை",
    quickTips: "விரைவு உதவிக்குறிப்புகள்",
    tip1: "கோரிக்கைகளுக்கு விரைவாக பதிலளிக்கவும்",
    tip1Desc: "சிறந்த பார்வைத்திறனுக்கு 30 நிமிடங்களுக்குள் ஏற்கவும்",
    tip2: "கிடைக்கும் தன்மையைப் புதுப்பிக்கவும்",
    tip2Desc: "மேலும் கோரிக்கைகளைப் பெற கிடைக்கும் எனக் குறிக்கவும்",
    tip3: "வேலைகளை சரியான நேரத்தில் முடிக்கவும்",
    tip3Desc: "சேவை முடிந்த பிறகு நிலையைப் புதுப்பிக்கவும்",
    loading: "டாஷ்போர்டு ஏற்றுகிறது...",
    error: "டாஷ்போர்டு ஏற்ற முடியவில்லை",
    noResponseTime: "இதுவரை தரவு இல்லை",
    excellentResponse: "சிறந்த பதில்! 👍",
    goodResponse: "நல்ல பதில்",
    improveResponse: "விரைவாக பதிலளிக்க முயற்சிக்கவும்",
  },
};

// Star Rating Component (same as seeker)
const StarRating = ({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) => {
  const starSize =
    size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= Math.floor(rating)
              ? "text-yellow-500 fill-yellow-500"
              : star <= rating
              ? "text-yellow-300 fill-yellow-300"
              : "text-gray-300"
          }`}
        />
      ))}
      <span className="ml-1 font-medium text-gray-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default function HomeSection() {
  const { lang } = useLanguage();
  const { user, userData } = useAuth();
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.en;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    newRequests: 0,
    activeJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalReviews: 0,
    responseRate: 0,
    avgResponseTime: "N/A",
  });

  // Calculate response rate
  const calculateResponseRate = async (providerId: string) => {
    try {
      const requestsRef = collection(db, "serviceRequests");
      const q = query(
        requestsRef,
        where("providerId", "==", providerId),
        where("status", "in", ["pending", "accepted", "rejected", "completed"])
      );

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map((doc) => doc.data());

      const totalRequests = requests.length;
      const respondedRequests = requests.filter(
        (req) => req.status !== "pending"
      ).length;

      if (totalRequests === 0) return 100;
      return Math.round((respondedRequests / totalRequests) * 100);
    } catch (error) {
      console.error("Error calculating response rate:", error);
      return 85;
    }
  };

  // Load dashboard stats
  useEffect(() => {
    if (!user?.uid) return;

    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        const providerId = user.uid;

        // Get counts
        const requestsRef = collection(db, "serviceRequests");

        const [newRequestsSnap, activeJobsSnap, completedJobsSnap] =
          await Promise.all([
            getCountFromServer(
              query(
                requestsRef,
                where("providerId", "==", providerId),
                where("status", "==", "pending")
              )
            ),
            getCountFromServer(
              query(
                requestsRef,
                where("providerId", "==", providerId),
                where("status", "==", "accepted")
              )
            ),
            getCountFromServer(
              query(
                requestsRef,
                where("providerId", "==", providerId),
                where("status", "==", "completed")
              )
            ),
          ]);

        // Get calculated rating (same as seeker section)
        const ratingData = await calculateProviderRatingFromJobs(providerId);

        // Get additional stats
        const responseRate = await calculateResponseRate(providerId);
        const avgResponseTime = await calculateAvgResponseTime(providerId);

        setStats({
          newRequests: newRequestsSnap.data().count,
          activeJobs: activeJobsSnap.data().count,
          completedJobs: completedJobsSnap.data().count,
          averageRating: ratingData.rating,
          totalReviews: ratingData.totalReviews,
          responseRate,
          avgResponseTime,
        });

        setError(null);
      } catch (err) {
        console.error("Error loading dashboard:", err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();

    // Real-time listener for new requests
    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("providerId", "==", user.uid));

    const unsubscribe = onSnapshot(q, () => {
      loadDashboardStats();
    });

    return () => unsubscribe();
  }, [user?.uid, lang]);

  // Stat cards data
  const statCards = [
    {
      id: 1,
      title: t.newRequests,
      value: stats.newRequests,
      icon: Bell,
      color: "bg-blue-100 text-blue-600",
      borderColor: "border-blue-200",
      description: t.tip1Desc,
    },
    {
      id: 2,
      title: t.activeJobs,
      value: stats.activeJobs,
      icon: Briefcase,
      color: "bg-teal-100 text-teal-600",
      borderColor: "border-teal-200",
      description:
        lang === "en" ? "Currently working" : "தற்போது வேலை செய்கிறது",
    },
    {
      id: 3,
      title: t.rating,
      value: stats.averageRating,
      icon: Star,
      color: "bg-amber-100 text-amber-600",
      borderColor: "border-amber-200",
      description: `${stats.totalReviews} ${
        lang === "en" ? "reviews" : "மதிப்பீடுகள்"
      }`,
    },
    {
      id: 4,
      title: t.completedJobs,
      value: stats.completedJobs,
      icon: CheckCircle,
      color: "bg-green-100 text-green-600",
      borderColor: "border-green-200",
      description: t.tip3Desc,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for header */}
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />

        {/* Loading skeleton for stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>

        {/* Loading skeleton for bottom sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl bg-red-50 border border-red-200 p-6"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-800">{t.error}</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t.welcome}{" "}
              <span className="text-blue-700">
                {userData?.name || user?.displayName || "Provider"}
              </span>
              👋
            </h1>
            <p className="text-gray-600 mt-1">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">
              {(userData as unknown as any)?.district || t.location}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className={`bg-white rounded-xl border ${card.borderColor} p-5 shadow-sm hover:shadow-md transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="w-6 h-6" />
              </div>
              {card.value > 0 && card.id !== 3 && (
                <span
                  className={`text-xs ${card.color} px-2 py-1 rounded-full`}
                >
                  +
                </span>
              )}
            </div>

            <div className="space-y-2">
              {card.id === 3 ? (
                <div className="flex items-center gap-2">
                  <StarRating rating={stats.averageRating} size="lg" />
                </div>
              ) : (
                <h3 className="text-3xl font-bold text-gray-900">
                  {card.value}
                </h3>
              )}

              <p className="font-medium text-gray-800">{card.title}</p>
              <p className="text-sm text-gray-500">{card.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Rate Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {t.responseRate}
              </h3>
              <p className="text-sm text-gray-600">
                {lang === "en"
                  ? "How quickly you respond to requests"
                  : "கோரிக்கைகளுக்கு நீங்கள் எவ்வளவு விரைவாக பதிலளிக்கிறீர்கள்"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold text-gray-900">
                {stats.responseRate}%
              </div>
              <div className="text-sm text-gray-500">
                {lang === "en" ? "This month" : "இந்த மாதம்"}
              </div>
            </div>

            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.responseRate}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full"
              />
            </div>

            <p className="text-sm text-gray-500 text-center">
              {stats.responseRate >= 90
                ? t.excellentResponse
                : stats.responseRate >= 70
                ? t.goodResponse
                : t.improveResponse}
            </p>
          </div>
        </motion.div>

        {/* Service Info Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-teal-100">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {t.serviceArea}
              </h3>
              <p className="text-sm text-gray-600">
                {lang === "en"
                  ? "Your service details"
                  : "உங்கள் சேவை விவரங்கள்"}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t.district}</span>
              </div>
              <span className="font-medium text-gray-900">
                {(userData as unknown as any)?.district || t.location}
              </span>
            </div>

            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t.serviceType}</span>
              </div>
              <span className="font-medium text-gray-900">
                {(userData as unknown as any)?.serviceType || "Not set"}
              </span>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">{t.avgResponseTime}</span>
              </div>
              <span
                className={`font-medium ${
                  stats.avgResponseTime === "N/A"
                    ? "text-gray-500"
                    : stats.avgResponseTime === "30m" ||
                      stats.avgResponseTime === "1h"
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {stats.avgResponseTime === "N/A"
                  ? t.noResponseTime
                  : stats.avgResponseTime}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 p-6"
      >
        <h3 className="font-semibold text-gray-900 text-lg mb-4">
          {t.quickTips}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">{t.tip1}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.tip1Desc}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900">{t.tip2}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.tip2Desc}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <h4 className="font-medium text-gray-900">{t.tip3}</h4>
            </div>
            <p className="text-sm text-gray-600">{t.tip3Desc}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
