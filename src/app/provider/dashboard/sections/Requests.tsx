"use client";

import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  CheckCircle,
  XCircle,
  MapPin,
  User,
  AlertCircle,
  Timer,
  Clock,
  Shield,
  Filter,
  Bell,
  MessageSquare,
  Calendar,
  Phone,
  EyeOff,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

interface ServiceRequest {
  id: string;
  seekerId: string;
  seekerName: string;
  serviceType: string;
  description: string;
  district: string;
  block: string;
  urgency: "1h" | "2h" | "1d";
  status: "pending" | "accepted" | "rejected" | "expired" | "cancelled";
  createdAt: Timestamp;
  expiresAt: Timestamp;
  providerId: string;
}

// Bilingual texts
const TEXTS = {
  en: {
    title: "New Requests",
    subtitle: "Accept requests to start working",
    noRequests: "No New Requests",
    noRequestsDesc: "When seekers send requests, they'll appear here",
    offline: "You're Offline",
    offlineDesc: "Go online to receive requests",
    goOnline: "Go Online",
    filterBy: "Filter by urgency",
    showFilters: "Show Filter",
    hideFilters: "Hide Filter",
    allUrgencies: "All",
    urgent1h: "1 Hour (Urgent)",
    standard2h: "2 Hours (Standard)",
    flexible1d: "1 Day (Flexible)",
    clearFilter: "Clear",
    availableRequests: "Available Requests",
    serviceDetails: "Service Details",
    serviceType: "Service Type",
    location: "Location",
    requested: "Requested",
    acceptRequest: "Accept",
    decline: "Decline",
    accepting: "Accepting...",
    expired: "Expired",
    privacyNote: "Seeker's contact details are protected until you accept",
    refresh: "Refresh",
    loadingError: "Failed to load requests",
    indexIssue: "Please wait a moment and try again",
    requests: "requests",
    minutes: "min",
    hours: "hr",
    urgent: "Urgent",
    timeLeft: "left",
    viewRequests: "View Requests",
  },
  ta: {
    title: "புதிய கோரிக்கைகள்",
    subtitle: "வேலை தொடங்க கோரிக்கைகளை ஏற்கவும்",
    noRequests: "புதிய கோரிக்கைகள் இல்லை",
    noRequestsDesc: "தேடுபவர்கள் கோரிக்கைகளை அனுப்பும் போது அவை இங்கே தோன்றும்",
    offline: "நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்",
    offlineDesc: "கோரிக்கைகளைப் பெற ஆன்லைனுக்குச் செல்லவும்",
    goOnline: "ஆன்லைனுக்குச் செல்லவும்",
    filterBy: "அவசரத்தின்படி வடிகட்டு",
    showFilters: "வடிகட்டியைக் காட்டு",
    hideFilters: "வடிகட்டியை மறை",
    allUrgencies: "அனைத்தும்",
    urgent1h: "1 மணி நேரம் (அவசரம்)",
    standard2h: "2 மணி நேரம் (நிலையான)",
    flexible1d: "1 நாள் (நெகிழ்வான)",
    clearFilter: "அழி",
    availableRequests: "கிடைக்கும் கோரிக்கைகள்",
    serviceDetails: "சேவை விவரங்கள்",
    serviceType: "சேவை வகை",
    location: "இடம்",
    requested: "கோரப்பட்டது",
    acceptRequest: "ஏற்கவும்",
    decline: "நிராகரிக்கவும்",
    accepting: "ஏற்கிறது...",
    expired: "காலாவதியானது",
    privacyNote:
      "நீங்கள் ஏற்றுக்கொள்ளும் வரை தேடுபவரின் தொடர்பு விவரங்கள் பாதுகாக்கப்படுகின்றன",
    refresh: "புதுப்பிக்கவும்",
    loadingError: "கோரிக்கைகளை ஏற்ற முடியவில்லை",
    indexIssue: "சிறிது நேரம் காத்திருக்கவும், பின்னர் மீண்டும் முயற்சிக்கவும்",
    requests: "கோரிக்கைகள்",
    minutes: "நிமிட",
    hours: "மணி",
    urgent: "அவசரம்",
    timeLeft: "மீதி",
    viewRequests: "கோரிக்கைகளைப் பார்க்க",
  },
};

interface RequestsSectionProps {
  providerDistrict: string;
  providerServiceType: string;
  isAvailable: boolean;
}

export default function RequestsSection({
  providerDistrict,
  providerServiceType,
  isAvailable,
}: RequestsSectionProps) {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.en;

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const [showFilter, setShowFilter] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");

  // Calculate time remaining
  const calculateTimeRemaining = useCallback(
    (expiresAt: Timestamp) => {
      const now = new Date();
      const expiry = expiresAt.toDate();
      const diffMs = expiry.getTime() - now.getTime();

      if (diffMs <= 0) {
        return { expired: true, text: t.expired, isUrgent: false };
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      let text = "";
      if (hours > 0) {
        text = `${hours}${t.hours}`;
        if (minutes > 0) text += ` ${minutes}${t.minutes}`;
      } else {
        text = `${minutes}${t.minutes}`;
      }

      text += ` ${t.timeLeft}`;
      const isUrgent = diffMs < 30 * 60 * 1000; // Less than 30 minutes

      return { expired: false, hours, minutes, text, isUrgent };
    },
    [lang]
  );

  // Load requests
  useEffect(() => {
    if (!user?.uid || !isAvailable) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", user.uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = Timestamp.now();
        const requestsData: ServiceRequest[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();

          // Check if expired
          if (data.expiresAt && data.expiresAt.toMillis() < now.toMillis()) {
            updateDoc(doc.ref, { status: "expired" }).catch(console.error);
            return;
          }

          requestsData.push({
            id: doc.id,
            seekerId: data.seekerId,
            seekerName: data.seekerName || "Anonymous Seeker",
            serviceType: data.serviceType,
            description: data.description || "",
            district: data.district,
            block: data.block || "",
            urgency: data.urgency || "2h",
            status: data.status,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            providerId: data.providerId,
          });
        });

        setRequests(requestsData);
        setFilteredRequests(requestsData);
        setLoading(false);
      },
      (queryError: any) => {
        console.error("Error loading requests:", queryError);
        setError(t.loadingError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, isAvailable, lang]);

  // Apply urgency filter
  useEffect(() => {
    let filtered = [...requests];

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((req) => req.urgency === urgencyFilter);
    }

    // Sort by urgency (most urgent first)
    filtered.sort((a, b) => {
      const timeA = calculateTimeRemaining(a.expiresAt);
      const timeB = calculateTimeRemaining(b.expiresAt);

      // Expired requests go to bottom
      if (timeA.expired && !timeB.expired) return 1;
      if (!timeA.expired && timeB.expired) return -1;

      // Urgent requests come first
      if (timeA.isUrgent && !timeB.isUrgent) return -1;
      if (!timeA.isUrgent && timeB.isUrgent) return 1;

      // Sort by remaining time (least time first)
      const totalA = (timeA.hours || 0) * 60 + (timeA.minutes || 0);
      const totalB = (timeB.hours || 0) * 60 + (timeB.minutes || 0);
      return totalA - totalB;
    });

    setFilteredRequests(filtered);
  }, [requests, urgencyFilter, calculateTimeRemaining]);

  // Handle accept request
  const handleAccept = async (requestId: string) => {
    if (!user?.uid) return;

    setProcessingRequest(requestId);

    try {
      const request = requests.find((r) => r.id === requestId);
      if (!request) {
        throw new Error("Request not found");
      }

      // Get provider phone number
      const providerDoc = await getDoc(doc(db, "providers", user.uid));
      const providerData = providerDoc.data();
      const providerPhone = providerData?.phone || "";

      // Update request status
      await updateDoc(doc(db, "serviceRequests", requestId), {
        status: "accepted",
        acceptedAt: serverTimestamp(),
        providerPhone: providerPhone, // ✅ Provider phone shared to seeker
      });

      // Create notification for seeker
      await addDoc(collection(db, "notifications"), {
        userId: request.seekerId,
        title:
          lang === "en"
            ? "Request Accepted!"
            : "கோரிக்கை ஏற்றுக்கொள்ளப்பட்டது!",
        message:
          lang === "en"
            ? `Provider accepted your request. Phone number shared. Please share your address.`
            : `வழங்குநர் உங்கள் கோரிக்கையை ஏற்றுக்கொண்டார். தொலைபேசி எண் பகிரப்பட்டது. உங்கள் முகவரியைப் பகிரவும்.`,
        type: "request_accepted",
        createdAt: serverTimestamp(),
        read: false,
        requestId: requestId,
      });

      // Remove from local state
      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      alert(
        lang === "en"
          ? "Request accepted! Your phone number is now visible to seeker."
          : "கோரிக்கை ஏற்றுக்கொள்ளப்பட்டது! உங்கள் தொலைபேசி எண் இப்போது தேடுபவருக்குத் தெரியும்."
      );
    } catch (err: any) {
      console.error("Error accepting request:", err);
      alert(
        lang === "en"
          ? `Failed to accept request: ${err.message}`
          : `கோரிக்கையை ஏற்க முடியவில்லை: ${err.message}`
      );
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle reject request
  const handleReject = async (requestId: string) => {
    if (
      !confirm(
        lang === "en"
          ? "Are you sure you want to reject this request?"
          : "இந்தக் கோரிக்கையை நிராகரிக்க விரும்புகிறீர்களா?"
      )
    )
      return;

    setProcessingRequest(requestId);

    try {
      await updateDoc(doc(db, "serviceRequests", requestId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
      });

      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      console.error("Error rejecting request:", err);
    } finally {
      setProcessingRequest(null);
    }
  };

  // Format date
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString(lang === "ta" ? "ta-IN" : "en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get urgency label
  const getUrgencyLabel = (urgency: string) => {
    const labels = {
      "1h": lang === "en" ? "1 hour" : "1 மணி நேரம்",
      "2h": lang === "en" ? "2 hours" : "2 மணி நேரம்",
      "1d": lang === "en" ? "1 day" : "1 நாள்",
    };
    return labels[urgency as keyof typeof labels] || urgency;
  };

  // Clear filter
  const clearFilter = () => {
    setUrgencyFilter("all");
    setShowFilter(false);
  };

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    // The onSnapshot listener will automatically update
    setTimeout(() => setLoading(false), 500);
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t.loadingError}
        </h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
      </div>
    );
  }

  // Availability warning
  if (!isAvailable) {
    return (
      <div className="text-center py-12">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {t.offline}
        </h3>
        <p className="text-gray-600 mb-6">{t.offlineDesc}</p>
        <button
          onClick={() =>
            (window.location.href = "/provider/dashboard?section=availability")
          }
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t.goOnline}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t.title}</h1>
            <p className="text-gray-600">{t.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {filteredRequests.length}
              </div>
              <div className="text-sm text-gray-600">{t.requests}</div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title={t.refresh}
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Simple Filter Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showFilter ? t.hideFilters : t.showFilters}
          </button>

          {urgencyFilter !== "all" && (
            <button
              onClick={clearFilter}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {t.clearFilter}
            </button>
          )}
        </div>

        {/* Simple Filter Dropdown */}
        {showFilter && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t.filterBy}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setUrgencyFilter("all")}
                className={`px-3 py-2 text-sm rounded-lg border ${
                  urgencyFilter === "all"
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {t.allUrgencies}
              </button>
              <button
                onClick={() => setUrgencyFilter("1h")}
                className={`px-3 py-2 text-sm rounded-lg border ${
                  urgencyFilter === "1h"
                    ? "bg-red-100 border-red-300 text-red-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                ⚡ {t.urgent1h}
              </button>
              <button
                onClick={() => setUrgencyFilter("2h")}
                className={`px-3 py-2 text-sm rounded-lg border ${
                  urgencyFilter === "2h"
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                🕑 {t.standard2h}
              </button>
              <button
                onClick={() => setUrgencyFilter("1d")}
                className={`px-3 py-2 text-sm rounded-lg border ${
                  urgencyFilter === "1d"
                    ? "bg-green-100 border-green-300 text-green-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                📅 {t.flexible1d}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 mb-1">
              {lang === "en" ? "Important" : "முக்கியமானது"}
            </p>
            <p className="text-sm text-blue-700">{t.privacyNote}</p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {t.noRequests}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {t.noRequestsDesc}
          </p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
      ) : (
        <>
          {/* Requests List */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              {t.availableRequests}{" "}
              <span className="text-gray-500">({filteredRequests.length})</span>
            </h3>

            <div className="space-y-4">
              <AnimatePresence>
                {filteredRequests.map((request) => {
                  const timeRemaining = calculateTimeRemaining(
                    request.expiresAt
                  );
                  const isProcessing = processingRequest === request.id;

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`bg-white rounded-xl border ${
                        timeRemaining.isUrgent
                          ? "border-red-200"
                          : "border-gray-200"
                      } ${timeRemaining.expired ? "opacity-60" : ""}`}
                    >
                      <div className="p-5">
                        {/* Request Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {request.seekerName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {request.serviceType}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`px-3 py-1 rounded-full text-sm ${
                              timeRemaining.expired
                                ? "bg-gray-100 text-gray-700"
                                : timeRemaining.isUrgent
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {timeRemaining.expired ? (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeRemaining.text}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Timer className="w-3 h-3" />
                                {timeRemaining.text}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Service Description */}
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {t.serviceDetails}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded-lg">
                            {request.description}
                          </p>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {t.serviceType}
                            </div>
                            <div className="font-medium text-gray-900">
                              {request.serviceType}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">
                              {t.location}
                            </div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {request.district}
                            </div>
                          </div>
                        </div>

                        {/* Privacy Status */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              {lang === "en"
                                ? "Your phone number will be shared after acceptance"
                                : "நீங்கள் ஏற்றுக்கொண்ட பிறகு உங்கள் தொலைபேசி எண் பகிரப்படும்"}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={isProcessing || timeRemaining.expired}
                            className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                              timeRemaining.expired
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-green-600 hover:bg-green-700 text-white"
                            }`}
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t.accepting}
                              </>
                            ) : timeRemaining.expired ? (
                              <>
                                <Clock className="w-4 h-4" />
                                {t.expired}
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                {t.acceptRequest}
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleReject(request.id)}
                            disabled={isProcessing}
                            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
                            title={t.decline}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* No filter results */}
          {filteredRequests.length === 0 && requests.length > 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
              <Filter className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">
                {lang === "en"
                  ? "No requests match your filter"
                  : "உங்கள் வடிகட்டலுடன் பொருந்தும் கோரிக்கைகள் இல்லை"}
              </p>
              <button
                onClick={clearFilter}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
              >
                {t.clearFilter}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
