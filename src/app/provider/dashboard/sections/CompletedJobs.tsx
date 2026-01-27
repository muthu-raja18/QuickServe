"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  Star,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  Filter,
  ChevronDown,
  User,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";

interface CompletedJob {
  id: string;
  seekerName: string;
  serviceType: string;
  district: string;
  block: string;
  completedAt: Timestamp | Date | number;
  rating: number;
  review: string;
  duration: string;
  status: string;
  seekerId: string;
  createdAt: Timestamp | Date | number;
  providerId?: string; // ADDED THIS
  // New fields for better data
  seekerRating?: number;
  seekerReview?: string;
}

export default function CompletedJobsSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<CompletedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [refreshKey, setRefreshKey] = useState(0); // ADDED THIS

  /* -------------------- DATE SAFETY -------------------- */
  const safeToDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value === "number") return new Date(value);
    if (typeof value === "string") {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
    }
    return new Date();
  };

  /* -------------------- CALCULATE DURATION -------------------- */
  const calculateDuration = (data: any): string => {
    if (!data.createdAt || !data.seekerConfirmedAt) return "N/A";

    const start = safeToDate(data.createdAt);
    const end = safeToDate(data.seekerConfirmedAt);
    const diffHours =
      Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (diffHours < 1) return "< 1 hour";
    if (diffHours < 24) return `${Math.round(diffHours)} hours`;
    return `${Math.round(diffHours / 24)} days`;
  };

  /* -------------------- ✅ ADDED: Get provider's current rating -------------------- */
  const getProviderCurrentRating = async (providerId: string) => {
    try {
      const providerRef = doc(db, "providers", providerId);
      const providerDoc = await getDoc(providerRef);

      if (providerDoc.exists()) {
        const providerData = providerDoc.data();

        // Extract rating consistently with other pages
        if (providerData.rating && typeof providerData.rating === "object") {
          return {
            rating: providerData.rating.average || 0,
            totalReviews: providerData.rating.totalReviews || 0,
            completedJobs: providerData.completedJobs || 0,
          };
        } else if (providerData.averageRating !== undefined) {
          return {
            rating: providerData.averageRating || 0,
            totalReviews:
              providerData.totalReviews || providerData.completedJobs || 0,
            completedJobs: providerData.completedJobs || 0,
          };
        } else {
          return {
            rating: providerData.rating || 0,
            totalReviews:
              providerData.totalReviews || providerData.completedJobs || 0,
            completedJobs: providerData.completedJobs || 0,
          };
        }
      }
    } catch (error) {
      console.error("Error getting provider rating:", error);
    }

    return { rating: 0, totalReviews: 0, completedJobs: 0 };
  };

  /* -------------------- ✅ ADDED: Listen for rating updates -------------------- */
  useEffect(() => {
    const handleRatingUpdated = () => {
      console.log("🔄 Rating update received in CompletedJobs - refreshing");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("rating-updated", handleRatingUpdated);

    return () => {
      window.removeEventListener("rating-updated", handleRatingUpdated);
    };
  }, []);

  /* -------------------- FIRESTORE LISTENER - UPDATED -------------------- */
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Query all requests for this provider
    const q = query(
      collection(db, "serviceRequests"),
      where("providerId", "==", user.uid)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        try {
          const completed: CompletedJob[] = [];

          snapshot.docs.forEach((doc) => {
            const d = doc.data();

            // ✅ FIX: Check for completed status and rating
            if (d.status === "completed" && d.seekerRating) {
              const rating = d.seekerRating || 0;
              const review = d.seekerReview || "";

              // Calculate duration
              const duration = calculateDuration(d);

              // Get completion date (prioritize seeker confirmation)
              const completedAt =
                d.seekerConfirmedAt ||
                d.completedAt ||
                d.markedCompleteAt ||
                d.acceptedAt ||
                d.createdAt ||
                Timestamp.now();

              completed.push({
                id: doc.id,
                seekerName: d.seekerName || "Customer",
                serviceType: d.serviceType || "Service",
                district: d.district || "Unknown",
                block: d.block || "",
                completedAt: completedAt,
                rating: Number(rating),
                review: review,
                duration: duration,
                status: d.status || "completed",
                seekerId: d.seekerId || "",
                createdAt: d.createdAt || Timestamp.now(),
                providerId: d.providerId || user.uid, // ADDED THIS
                seekerRating: d.seekerRating,
                seekerReview: d.seekerReview,
              });
            }
          });

          // Sort by completion date (newest first)
          const sortedJobs = completed.sort(
            (a, b) =>
              safeToDate(b.completedAt).getTime() -
              safeToDate(a.completedAt).getTime()
          );

          setJobs(sortedJobs);
          setLoading(false);
          setError(null);

          console.log(
            `✅ Loaded ${sortedJobs.length} completed jobs with ratings`
          );

          // Log provider's current rating for debugging
          if (sortedJobs.length > 0) {
            getProviderCurrentRating(user.uid).then((ratingData) => {
              console.log(
                `📊 Provider's current rating: ${ratingData.rating} stars (${ratingData.totalReviews} reviews)`
              );
            });
          }
        } catch (err) {
          console.error("Error processing jobs:", err);
          setError("Error processing job data");
          setLoading(false);
        }
      },
      (err) => {
        console.error("Firestore error:", err);
        setError(
          lang === "en"
            ? "Failed to load completed jobs"
            : "முடிக்கப்பட்ட வேலைகளை ஏற்ற முடியவில்லை"
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user, lang, refreshKey]); // ✅ Added refreshKey dependency

  /* -------------------- FILTER + SORT -------------------- */
  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    if (selectedFilter !== "all") {
      list = list.filter((j) => j.serviceType === selectedFilter);
    }

    switch (sortBy) {
      case "oldest":
        list.sort(
          (a, b) =>
            safeToDate(a.completedAt).getTime() -
            safeToDate(b.completedAt).getTime()
        );
        break;
      case "rating-high":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-low":
        list.sort((a, b) => a.rating - b.rating);
        break;
      default:
        // Newest first is default
        list.sort(
          (a, b) =>
            safeToDate(b.completedAt).getTime() -
            safeToDate(a.completedAt).getTime()
        );
    }

    return list;
  }, [jobs, selectedFilter, sortBy]);

  /* -------------------- STATS -------------------- */
  const stats = useMemo(() => {
    const total = jobs.length;
    const ratedJobs = jobs.filter((j) => j.rating > 0);
    const ratedCount = ratedJobs.length;
    const avg =
      ratedCount > 0
        ? ratedJobs.reduce((s, j) => s + j.rating, 0) / ratedCount
        : 0;
    const fiveStar = jobs.filter((j) => j.rating === 5).length;
    const fourStar = jobs.filter((j) => j.rating >= 4).length;

    return {
      total,
      ratedCount,
      avg,
      fiveStar,
      fourStar,
      ratingPercentage: total > 0 ? Math.round((ratedCount / total) * 100) : 0,
    };
  }, [jobs]);

  const serviceTypes = useMemo(() => {
    const types = new Set(jobs.map((j) => j.serviceType).filter(Boolean));
    return ["all", ...Array.from(types)];
  }, [jobs]);

  const formatDate = (v: any) => {
    const date = safeToDate(v);
    return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (v: any) => {
    const date = safeToDate(v);
    return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /* -------------------- ✅ ADDED: Refresh function -------------------- */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setLoading(true);
    console.log("🔄 Manually refreshing completed jobs");
  };

  /* -------------------- UI STATES -------------------- */
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-800">
              {lang === "en" ? "Error Loading Jobs" : "பிழை"}
            </h3>
            <p className="text-red-600">{error}</p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {lang === "en" ? "Retry" : "மீண்டும் முயற்சிக்கவும்"}
              </button>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {lang === "en" ? "Refresh" : "புதுப்பிக்கவும்"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {lang === "en"
              ? "Completed Jobs & Ratings"
              : "முடிக்கப்பட்ட வேலைகள் & மதிப்பீடுகள்"}
          </h2>
          <p className="text-gray-600 mt-1">
            {lang === "en"
              ? "Your completed services with customer ratings and reviews"
              : "வாடிக்கையாளர் மதிப்பீடுகள் மற்றும் மதிப்புரைகளுடன் உங்கள் முடிக்கப்பட்ட சேவைகள்"}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          title={
            lang === "en" ? "Refresh ratings" : "மதிப்பீடுகளைப் புதுப்பிக்கவும்"
          }
        >
          <RefreshCw className="w-4 h-4" />
          {lang === "en" ? "Refresh" : "புதுப்பிக்கவும்"}
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-600">
            {lang === "en" ? "Total Completed" : "மொத்த முடிக்கப்பட்டவை"}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{stats.total}</p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <Star className="w-4 h-4" />
            {lang === "en" ? "Average Rating" : "சராசரி மதிப்பீடு"}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {stats.avg.toFixed(1)}
            <span className="text-sm text-gray-500 ml-2">
              ({stats.ratedCount} {lang === "en" ? "rated" : "மதிப்பிடப்பட்டது"}
              )
            </span>
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-600">
            {lang === "en" ? "5★ Ratings" : "5★ மதிப்பீடுகள்"}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {stats.fiveStar}
            <span className="text-sm text-gray-500 ml-2">
              {stats.total > 0
                ? `${Math.round((stats.fiveStar / stats.total) * 100)}%`
                : "0%"}
            </span>
          </p>
        </div>

        <div className="bg-white border rounded-xl p-5">
          <p className="text-sm text-gray-600">
            {lang === "en" ? "Rated Jobs" : "மதிப்பிடப்பட்ட வேலைகள்"}
          </p>
          <p className="text-3xl font-bold text-gray-800 mt-2">
            {stats.ratingPercentage}%
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              {lang === "en" ? "Filter & Sort" : "வடிகட்டு & வரிசைப்படுத்து"}
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                {lang === "en" ? "Service Type" : "சேவை வகை"}
              </label>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === "all"
                      ? lang === "en"
                        ? "All Services"
                        : "அனைத்து சேவைகள்"
                      : type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                {lang === "en" ? "Sort By" : "வரிசைப்படுத்து"}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">
                  {lang === "en" ? "Newest First" : "புதியதாக"}
                </option>
                <option value="oldest">
                  {lang === "en" ? "Oldest First" : "பழையதாக"}
                </option>
                <option value="rating-high">
                  {lang === "en" ? "Highest Rated" : "அதிக மதிப்பீடு"}
                </option>
                <option value="rating-low">
                  {lang === "en" ? "Lowest Rated" : "குறைந்த மதிப்பீடு"}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* JOB LIST */}
      <AnimatePresence>
        {filteredJobs.length === 0 ? (
          <div className="text-center py-12 bg-white border rounded-xl">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {lang === "en"
                ? "No completed jobs with ratings yet"
                : "இதுவரை மதிப்பீடுகளுடன் முடிக்கப்பட்ட வேலைகள் இல்லை"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {lang === "en"
                ? "When seekers rate your completed services, they will appear here."
                : "தேடுபவர்கள் உங்கள் முடிக்கப்பட்ட சேவைகளை மதிப்பிடும்போது, அவை இங்கே தோன்றும்."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
                lang={lang}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------- JOB CARD COMPONENT -------------------- */
function JobCard({ job, formatDate, formatDateTime, lang }: any) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border rounded-xl p-5 hover:border-teal-200 transition-colors"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-gray-800">{job.seekerName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {job.serviceType}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {job.district}
                        {job.block ? `, ${job.block}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating Display */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= Math.floor(job.rating)
                            ? "text-amber-500 fill-amber-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-gray-800">
                    {job.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            <Calendar className="inline w-4 h-4 mr-1" />
            {formatDate(job.completedAt)}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 font-medium border border-blue-200 rounded-lg hover:bg-blue-50"
          >
            {expanded
              ? lang === "en"
                ? "Show Less"
                : "குறைவாகக் காட்டு"
              : lang === "en"
              ? "View Details"
              : "விவரங்களைக் காண்க"}
          </button>
        </div>
      </div>

      {/* Review Preview */}
      {job.review && (
        <div className="mt-3 text-gray-600 text-sm line-clamp-2">
          "
          {job.review.length > 100
            ? job.review.substring(0, 100) + "..."
            : job.review}
          "
        </div>
      )}

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 space-y-4"
          >
            {/* Full Review */}
            {job.review && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {lang === "en"
                    ? "Customer Review"
                    : "வாடிக்கையாளர் மதிப்புரை"}
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 italic">"{job.review}"</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {lang === "en" ? "Job Information" : "வேலை தகவல்"}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {lang === "en" ? "Duration:" : "கால அளவு:"}
                    </span>
                    <span className="font-medium">{job.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {lang === "en" ? "Completed:" : "முடிந்தது:"}
                    </span>
                    <span className="font-medium">
                      {formatDateTime(job.completedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      {lang === "en" ? "Service Type:" : "சேவை வகை:"}
                    </span>
                    <span className="font-medium">{job.serviceType}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  {lang === "en" ? "Location" : "இடம்"}
                </h4>
                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{job.district}</span>
                  </div>
                  {job.block && (
                    <div className="text-gray-600">
                      {lang === "en" ? "Block:" : "பிளாக்:"} {job.block}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
