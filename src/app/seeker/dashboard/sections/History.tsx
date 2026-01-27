"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/config";
import {
  collection,
  onSnapshot,
  Timestamp,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import {
  Star,
  Calendar,
  CheckCircle,
  MapPin,
  MessageSquare,
  User,
  History,
  Award,
  Clock,
  RefreshCw,
} from "lucide-react";

interface CompletedRequest {
  id: string;
  providerName: string;
  serviceType: string;
  description: string;
  district: string;
  completedAt: Timestamp;
  seekerConfirmedAt: Timestamp;
  seekerRating?: number;
  seekerReview?: string;
  providerPhone?: string;
  providerId?: string; // ADDED THIS
}

export default function HistorySection() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [completedRequests, setCompletedRequests] = useState<
    CompletedRequest[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // ADDED THIS

  /* -------------------- ✅ ADDED: Listen for rating updates -------------------- */
  useEffect(() => {
    const handleRatingUpdated = () => {
      console.log("🔄 Rating update received in History - refreshing");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("rating-updated", handleRatingUpdated);

    return () => {
      window.removeEventListener("rating-updated", handleRatingUpdated);
    };
  }, []);

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
          };
        } else if (providerData.averageRating !== undefined) {
          return {
            rating: providerData.averageRating || 0,
            totalReviews:
              providerData.totalReviews || providerData.completedJobs || 0,
          };
        } else {
          return {
            rating: providerData.rating || 0,
            totalReviews:
              providerData.totalReviews || providerData.completedJobs || 0,
          };
        }
      }
    } catch (error) {
      console.error("Error getting provider rating:", error);
    }

    return { rating: 0, totalReviews: 0 };
  };

  // Load completed requests
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const requestsRef = collection(db, "serviceRequests");

    // ✅ IMPROVED: Use query with where clause for better performance
    const q = query(
      requestsRef,
      where("seekerId", "==", user.uid),
      where("status", "==", "completed")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        // ✅ Added async
        try {
          const userCompletedRequests: CompletedRequest[] = [];

          // Process each document
          for (const docSnap of snapshot.docs) {
            const data = docSnap.data();

            const request: CompletedRequest = {
              id: docSnap.id,
              providerName: data.providerName || "Provider",
              serviceType: data.serviceType || "Service",
              description: data.description || "",
              district: data.district || "Unknown",
              completedAt:
                data.completedAt || data.seekerConfirmedAt || Timestamp.now(),
              seekerConfirmedAt:
                data.seekerConfirmedAt || data.completedAt || Timestamp.now(),
              seekerRating: data.seekerRating || 0,
              seekerReview: data.seekerReview || "",
              providerPhone: data.providerPhone,
              providerId: data.providerId, // ✅ Added this
            };

            userCompletedRequests.push(request);
          }

          // Sort by completion date (newest first)
          const sortedRequests = userCompletedRequests.sort(
            (a, b) =>
              (b.seekerConfirmedAt?.toMillis() || 0) -
              (a.seekerConfirmedAt?.toMillis() || 0)
          );

          setCompletedRequests(sortedRequests);
          setLoading(false);

          // ✅ Log for debugging
          console.log(
            `✅ History: Loaded ${sortedRequests.length} completed requests`
          );

          // ✅ Check provider ratings for the latest rated service
          if (sortedRequests.length > 0) {
            const latestRated = sortedRequests.find(
              (r) => r.seekerRating && r.seekerRating > 0
            );
            if (latestRated && latestRated.providerId) {
              const providerRating = await getProviderCurrentRating(
                latestRated.providerId
              );
              console.log(
                `📊 Provider's current rating: ${providerRating.rating} stars (${providerRating.totalReviews} reviews)`
              );
            }
          }
        } catch (error) {
          console.error("Error processing history:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error in history subscription:", error);
        // Fallback to loading all requests
        loadHistoryFallback();
      }
    );

    return () => unsubscribe();
  }, [user?.uid, refreshKey]); // ✅ Added refreshKey dependency

  // Fallback loading method
  const loadHistoryFallback = async () => {
    if (!user?.uid) return;

    try {
      const requestsRef = collection(db, "serviceRequests");
      const snapshot = await onSnapshot(requestsRef, (snapshot) => {
        const allRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as CompletedRequest[];

        // Filter for this user's completed requests
        const userCompletedRequests = allRequests.filter(
          (req: any) => req.seekerId === user.uid && req.status === "completed"
        );

        // Sort by completion date (newest first)
        const sortedRequests = userCompletedRequests.sort(
          (a, b) =>
            (b.seekerConfirmedAt?.toMillis() || 0) -
            (a.seekerConfirmedAt?.toMillis() || 0)
        );

        setCompletedRequests(sortedRequests);
        setLoading(false);
      });
    } catch (error) {
      console.error("Fallback loading failed:", error);
      setLoading(false);
    }
  };

  /* -------------------- ✅ ADDED: Refresh function -------------------- */
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setLoading(true);
    console.log("🔄 Manually refreshing history");
  };

  // Format date
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Format date with time
  const formatDateTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Stats
  const ratedRequests = completedRequests.filter(
    (r) => r.seekerRating && r.seekerRating > 0
  );
  const totalRating = ratedRequests.reduce(
    (sum, r) => sum + (r.seekerRating || 0),
    0
  );
  const averageRating =
    ratedRequests.length > 0
      ? (totalRating / ratedRequests.length).toFixed(1)
      : "0.0";

  // Star rating display component
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating)
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium text-gray-800">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <History className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === "en" ? "Service History" : "சேவை வரலாறு"}
              </h1>
              <p className="text-sm text-gray-600">
                {lang === "en"
                  ? "View all your completed services"
                  : "உங்கள் முடிக்கப்பட்ட அனைத்து சேவைகளையும் காண்க"}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            title={
              lang === "en" ? "Refresh history" : "வரலாற்றைப் புதுப்பிக்கவும்"
            }
          >
            <RefreshCw className="w-4 h-4" />
            {lang === "en" ? "Refresh" : "புதுப்பிக்கவும்"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">
                {lang === "en" ? "Total Services" : "மொத்த சேவைகள்"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {completedRequests.length}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-blue-600">
            {lang === "en"
              ? "All completed services"
              : "அனைத்து முடிக்கப்பட்ட சேவைகள்"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">
                {lang === "en" ? "Average Rating" : "சராசரி மதிப்பீடு"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {averageRating}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-amber-600">
            {ratedRequests.length}{" "}
            {lang === "en" ? "rated" : "மதிப்பிடப்பட்டது"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">
                {lang === "en" ? "Rated Services" : "மதிப்பிடப்பட்ட சேவைகள்"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {ratedRequests.length}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <Star className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-xs text-green-600">
            {completedRequests.length > 0
              ? `${Math.round(
                  (ratedRequests.length / completedRequests.length) * 100
                )}% ${lang === "en" ? "rated" : "மதிப்பிடப்பட்டது"}`
              : `0% ${lang === "en" ? "rated" : "மதிப்பிடப்பட்டது"}`}
          </p>
        </div>
      </div>

      {/* Service History List */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {lang === "en"
                    ? "Completed Services"
                    : "முடிக்கப்பட்ட சேவைகள்"}
                </h3>
                <p className="text-sm text-gray-600">
                  {lang === "en"
                    ? "Your service history in chronological order"
                    : "காலவரிசையில் உங்கள் சேவை வரலாறு"}
                </p>
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
              {completedRequests.length}{" "}
              {lang === "en" ? "services" : "சேவைகள்"}
            </span>
          </div>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-gray-100 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : completedRequests.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <History className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {lang === "en" ? "No history yet" : "இதுவரை வரலாறு இல்லை"}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {lang === "en"
                  ? "Your completed services will appear here after you confirm service completion"
                  : "சேவை நிறைவை உறுதிப்படுத்திய பிறகு உங்கள் முடிக்கப்பட்ட சேவைகள் இங்கே தோன்றும்"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                >
                  {/* Header with Provider Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {request.providerName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            {request.serviceType}
                          </span>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{request.district}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Rating Display */}
                    {request.seekerRating ? (
                      <div className="flex flex-col items-end">
                        <StarRating rating={request.seekerRating} />
                        <span className="text-xs text-gray-500 mt-1">
                          {lang === "en" ? "Rated" : "மதிப்பிடப்பட்டது"}
                        </span>
                      </div>
                    ) : (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {lang === "en" ? "Not Rated" : "மதிப்பிடப்படவில்லை"}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {request.description && (
                    <p className="text-sm text-gray-700 mb-4 border-t pt-4">
                      {request.description}
                    </p>
                  )}

                  {/* Review Section */}
                  {request.seekerReview && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {lang === "en"
                              ? "Your Review"
                              : "உங்கள் மதிப்பாய்வு"}
                          </p>
                          <p className="text-sm text-gray-600">
                            "{request.seekerReview}"
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer with Details */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{formatDateTime(request.seekerConfirmedAt)}</span>
                      </div>

                      {request.providerPhone && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300">•</span>
                          <span className="font-medium">
                            {request.providerPhone}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded">
                      {lang === "en" ? "Service Completed" : "சேவை முடிந்தது"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Note */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
            <Info className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-gray-900 mb-2">
              {lang === "en" ? "About Service History" : "சேவை வரலாறு பற்றி"}
            </p>
            <p className="text-sm text-gray-700">
              {lang === "en"
                ? "This section shows all your completed services. Services are moved here after you confirm completion and submit ratings in the 'My Requests' section."
                : "இந்தப் பிரிவு உங்கள் முடிக்கப்பட்ட அனைத்து சேவைகளையும் காட்டுகிறது. 'எனது கோரிக்கைகள்' பிரிவில் நிறைவை உறுதிப்படுத்தி மதிப்பீடுகளை சமர்ப்பித்த பிறகு சேவைகள் இங்கே நகர்த்தப்படும்."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Info icon component
const Info = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
