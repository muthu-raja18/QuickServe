// src/app/provider/dashboard/sections/Requests.tsx - FULLY FIXED
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  EyeOff,
  Loader2,
  RefreshCw,
  Image as ImageIcon,
  Mic,
  Play,
  Pause,
  X,
  Volume2,
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
  serverTimestamp,
} from "firebase/firestore";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "../../../../lib/notifications";

interface ServiceRequest {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerEmail?: string;
  seekerPhone?: string;
  serviceType: string;
  description: string;
  district: string;
  block: string;
  urgency: "1h" | "2h" | "1d";
  status:
    | "pending"
    | "accepted"
    | "rejected"
    | "expired"
    | "cancelled"
    | "in_progress";
  createdAt: Timestamp;
  expiresAt: Timestamp;
  voiceMessageUrl?: string;
  imageUrl?: string;
  providerId?: string;
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
    acceptRequest: "Accept",
    decline: "Decline",
    accepting: "Accepting...",
    expired: "Expired",
    privacyNote: "Your phone number will be shared after acceptance",
    refresh: "Refresh",
    loadingError: "Failed to load requests",
    requests: "requests",
    minutes: "min",
    hours: "hr",
    timeLeft: "left",
    voiceMessage: "Voice Message",
    photo: "Photo",
    listen: "Listen",
    viewImage: "View Image",
    close: "Close",
    debug: "Debug Info",
    providerId: "Your Provider ID",
    matchingRequests: "Matching Requests",
    noMedia: "No media attached",
    playing: "Playing...",
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
    acceptRequest: "ஏற்கவும்",
    decline: "நிராகரிக்கவும்",
    accepting: "ஏற்கிறது...",
    expired: "காலாவதியானது",
    privacyNote: "நீங்கள் ஏற்றுக்கொண்ட பிறகு உங்கள் தொலைபேசி எண் பகிரப்படும்",
    refresh: "புதுப்பிக்கவும்",
    loadingError: "கோரிக்கைகளை ஏற்ற முடியவில்லை",
    requests: "கோரிக்கைகள்",
    minutes: "நிமிட",
    hours: "மணி",
    timeLeft: "மீதி",
    voiceMessage: "குரல் செய்தி",
    photo: "புகைப்படம்",
    listen: "கேட்க",
    viewImage: "படத்தைக் காண்க",
    close: "மூடு",
    debug: "சரிசெய்தல் தகவல்",
    providerId: "உங்கள் வழங்குநர் ஐடி",
    matchingRequests: "பொருந்தும் கோரிக்கைகள்",
    noMedia: "எந்த மீடியாவும் இணைக்கப்படவில்லை",
    playing: "இயங்குகிறது...",
  },
};

interface RequestsSectionProps {
  providerDistrict: string;
  providerServiceType: string;
  isAvailable: boolean;
}

// Audio Player Component
const AudioPlayer = ({ url, lang }: { url: string; lang: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = async () => {
    if (hasError) {
      window.open(url, "_blank");
      return;
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.onplaying = () => setIsLoading(false);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setHasError(true);
        setIsLoading(false);
        setIsPlaying(false);
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing audio:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition cursor-pointer"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        <span className="text-sm">
          {isLoading
            ? lang === "en"
              ? "Loading..."
              : "ஏற்றுகிறது..."
            : isPlaying
              ? lang === "en"
                ? TEXTS.en.playing
                : TEXTS.ta.playing
              : lang === "en"
                ? "Listen"
                : "கேட்க"}
        </span>
      </button>
      {hasError && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-red-500 underline"
        >
          {lang === "en" ? "Download" : "பதிவிறக்குக"}
        </a>
      )}
    </div>
  );
};

// Image Modal Component
const ImageModal = ({
  url,
  onClose,
  lang,
}: {
  url: string;
  onClose: () => void;
  lang: string;
}) => {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-[90vw] max-h-[90vh]"
      >
        {!imgError ? (
          <img
            src={url}
            alt="Request attachment"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="bg-gray-800 p-8 rounded-lg text-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-white mb-3">Failed to load image</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 underline"
            >
              {lang === "en" ? "Open in browser" : "உலாவியில் திறக்கவும்"}
            </a>
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 p-2 bg-white/20 hover:bg-white/30 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </motion.div>
    </motion.div>
  );
};

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
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null,
  );
  const [showFilter, setShowFilter] = useState(false);
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");

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
      const isUrgent = diffMs < 30 * 60 * 1000;

      return { expired: false, hours, minutes, text, isUrgent };
    },
    [t],
  );

  // Load requests - Direct query for providerId
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log("🔍 Provider UID:", user.uid);
    console.log("📍 Provider District:", providerDistrict);
    console.log("🔧 Provider Service Type:", providerServiceType);

    const requestsRef = collection(db, "serviceRequests");

    // Query for pending requests where providerId matches current provider
    const q = query(
      requestsRef,
      where("providerId", "==", user.uid),
      where("status", "==", "pending"),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("📦 Snapshot size:", snapshot.size);

        const now = Timestamp.now();
        const requestsData: ServiceRequest[] = [];

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          console.log("📄 Request doc:", doc.id, {
            hasVoice: !!data.voiceMessageUrl,
            hasImage: !!data.imageUrl,
            voiceUrl: data.voiceMessageUrl,
            imageUrl: data.imageUrl,
          });

          // Check if expired
          if (data.expiresAt && data.expiresAt.toMillis() < now.toMillis()) {
            console.log("⏰ Request expired, updating status:", doc.id);
            updateDoc(doc.ref, { status: "expired" }).catch(console.error);
            return;
          }

          requestsData.push({
            id: doc.id,
            seekerId: data.seekerId,
            seekerName: data.seekerName || "Anonymous Seeker",
            seekerEmail: data.seekerEmail,
            seekerPhone: data.seekerPhone,
            serviceType: data.serviceType,
            description: data.description || "",
            district: data.district,
            block: data.block || "",
            urgency: data.urgency || "2h",
            status: data.status,
            createdAt: data.createdAt,
            expiresAt: data.expiresAt,
            voiceMessageUrl: data.voiceMessageUrl,
            imageUrl: data.imageUrl,
            providerId: data.providerId,
          });
        });

        console.log("✅ Processed requests:", requestsData.length);
        console.log(
          "📊 Requests with voice:",
          requestsData.filter((r) => r.voiceMessageUrl).length,
        );
        console.log(
          "📷 Requests with image:",
          requestsData.filter((r) => r.imageUrl).length,
        );

        setDebugInfo(
          `Found ${requestsData.length} pending requests | Voice: ${requestsData.filter((r) => r.voiceMessageUrl).length} | Image: ${requestsData.filter((r) => r.imageUrl).length}`,
        );

        // Sort by createdAt descending (newest first)
        requestsData.sort((a, b) => {
          return (
            (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
          );
        });

        setRequests(requestsData);
        setLoading(false);
      },
      (queryError: any) => {
        console.error("❌ Error loading requests:", queryError);

        if (queryError.message?.includes("index")) {
          setError(
            "Firestore index required. Please create the index using the link in console.",
          );
          console.log(
            "🔗 Create index:",
            queryError.message.match(
              /https:\/\/console\.firebase\.google\.com[^\s]+/,
            )?.[0],
          );
        } else {
          setError(t.loadingError);
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid, t]);

  // Apply urgency filter and sorting
  useEffect(() => {
    let filtered = [...requests];

    if (urgencyFilter !== "all") {
      filtered = filtered.filter((req) => req.urgency === urgencyFilter);
    }

    filtered.sort((a, b) => {
      const timeA = calculateTimeRemaining(a.expiresAt);
      const timeB = calculateTimeRemaining(b.expiresAt);

      if (timeA.expired && !timeB.expired) return 1;
      if (!timeA.expired && timeB.expired) return -1;
      if (timeA.isUrgent && !timeB.isUrgent) return -1;
      if (!timeA.isUrgent && timeB.isUrgent) return 1;

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

      const providerDoc = await getDoc(doc(db, "providers", user.uid));
      const providerData = providerDoc.data();
      const providerPhone = providerData?.phone || "";

      await updateDoc(doc(db, "serviceRequests", requestId), {
        status: "in_progress",
        providerName: providerData?.name || "",
        providerPhone: providerPhone,
        acceptedAt: serverTimestamp(),
      });

      await createNotification({
        userId: request.seekerId,
        title:
          lang === "en"
            ? "Request Accepted!"
            : "கோரிக்கை ஏற்றுக்கொள்ளப்பட்டது!",
        message:
          lang === "en"
            ? `${providerData?.name || "Provider"} accepted your request. Phone number shared. Please share your address.`
            : `${providerData?.name || "Provider"} உங்கள் கோரிக்கையை ஏற்றுக்கொண்டார். தொலைபேசி எண் பகிரப்பட்டது. உங்கள் முகவரியைப் பகிரவும்.`,
        type: NOTIFICATION_TYPES.REQUEST_ACCEPTED,
        requestId: requestId,
      });

      setRequests((prev) => prev.filter((r) => r.id !== requestId));

      alert(
        lang === "en"
          ? "Request accepted! Your phone number is now visible to seeker."
          : "கோரிக்கை ஏற்றுக்கொள்ளப்பட்டது! உங்கள் தொலைபேசி எண் இப்போது தேடுபவருக்குத் தெரியும்.",
      );
    } catch (err: any) {
      console.error("Error accepting request:", err);
      alert(
        lang === "en"
          ? `Failed to accept request: ${err.message}`
          : `கோரிக்கையை ஏற்க முடியவில்லை: ${err.message}`,
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
          ? "Reject this request?"
          : "இந்தக் கோரிக்கையை நிராகரிக்கவா?",
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

  const clearFilter = () => {
    setUrgencyFilter("all");
    setShowFilter(false);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {lang === "en"
              ? "Loading requests..."
              : "கோரிக்கைகளை ஏற்றுகிறது..."}
          </p>
        </div>
      </div>
    );
  }

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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          {t.refresh}
        </button>
      </div>
    );
  }

  const showOfflineWarning = !isAvailable;

  return (
    <div className="space-y-6">
      {/* Image Modal */}
      <AnimatePresence>
        {imageModalUrl && (
          <ImageModal
            url={imageModalUrl}
            onClose={() => setImageModalUrl(null)}
            lang={lang}
          />
        )}
      </AnimatePresence>

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-3 text-xs">
          <details>
            <summary className="font-mono cursor-pointer">{t.debug}</summary>
            <div className="mt-2 space-y-1">
              <p>
                🔑 {t.providerId}: {user?.uid}
              </p>
              <p>
                📍 {t.matchingRequests}: {requests.length}
              </p>
              <p>💬 {debugInfo}</p>
            </div>
          </details>
        </div>
      )}

      {/* Offline Warning */}
      {showOfflineWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm font-medium text-amber-800">{t.offline}</p>
              <p className="text-sm text-amber-700">{t.offlineDesc}</p>
            </div>
            <button
              onClick={() =>
                (window.location.href =
                  "/provider/dashboard?section=availability")
              }
              className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm cursor-pointer"
            >
              {t.goOnline}
            </button>
          </div>
        </div>
      )}

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
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
              title={t.refresh}
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
          >
            <Filter className="w-4 h-4" />
            {showFilter ? t.hideFilters : t.showFilters}
          </button>
          {urgencyFilter !== "all" && (
            <button
              onClick={clearFilter}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer"
            >
              {t.clearFilter}
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        {showFilter && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t.filterBy}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setUrgencyFilter("all")}
                className={`px-3 py-2 text-sm rounded-lg border cursor-pointer ${urgencyFilter === "all" ? "bg-blue-100 border-blue-300 text-blue-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                {t.allUrgencies}
              </button>
              <button
                onClick={() => setUrgencyFilter("1h")}
                className={`px-3 py-2 text-sm rounded-lg border cursor-pointer ${urgencyFilter === "1h" ? "bg-red-100 border-red-300 text-red-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                ⚡ {t.urgent1h}
              </button>
              <button
                onClick={() => setUrgencyFilter("2h")}
                className={`px-3 py-2 text-sm rounded-lg border cursor-pointer ${urgencyFilter === "2h" ? "bg-amber-100 border-amber-300 text-amber-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
              >
                🕑 {t.standard2h}
              </button>
              <button
                onClick={() => setUrgencyFilter("1d")}
                className={`px-3 py-2 text-sm rounded-lg border cursor-pointer ${urgencyFilter === "1d" ? "bg-green-100 border-green-300 text-green-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
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
          <p className="text-sm text-blue-700">{t.privacyNote}</p>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        </div>
      ) : (
        <>
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">
              {t.availableRequests}{" "}
              <span className="text-gray-500">({filteredRequests.length})</span>
            </h3>
            <div className="space-y-4">
              <AnimatePresence>
                {filteredRequests.map((request) => {
                  const timeRemaining = calculateTimeRemaining(
                    request.expiresAt,
                  );
                  const isProcessing = processingRequest === request.id;
                  const hasVoice = !!request.voiceMessageUrl;
                  const hasImage = !!request.imageUrl;

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`bg-white rounded-xl border ${
                        timeRemaining.isUrgent
                          ? "border-red-200 bg-red-50/30"
                          : "border-gray-200"
                      } ${timeRemaining.expired ? "opacity-60" : ""}`}
                    >
                      <div className="p-5">
                        {/* Header */}
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
                        {request.description && (
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
                        )}

                        {/* Media Section - Voice + Photo in a row */}
                        {(hasVoice || hasImage) && (
                          <div className="mb-4">
                            <div className="flex flex-wrap items-center gap-4">
                              {/* Voice Message */}
                              {hasVoice && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Mic className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {t.voiceMessage}
                                    </span>
                                  </div>
                                  <AudioPlayer
                                    url={request.voiceMessageUrl!}
                                    lang={lang}
                                  />
                                </div>
                              )}

                              {/* Photo */}
                              {hasImage && (
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <ImageIcon className="w-4 h-4 text-green-500" />
                                    <span className="text-xs font-medium text-gray-600">
                                      {t.photo}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() =>
                                      setImageModalUrl(request.imageUrl!)
                                    }
                                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    <span className="text-sm">
                                      {t.viewImage}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* No Media Indicator */}
                        {!hasVoice && !hasImage && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-gray-400" />
                              <span className="text-xs text-gray-400">
                                {t.noMedia}
                              </span>
                            </div>
                          </div>
                        )}

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
                              {request.block && `, ${request.block}`}
                            </div>
                          </div>
                        </div>

                        {/* Privacy Status */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2">
                            <EyeOff className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">
                              {t.privacyNote}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAccept(request.id)}
                            disabled={isProcessing || timeRemaining.expired}
                            className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
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
                            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50 cursor-pointer"
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
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 cursor-pointer"
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
