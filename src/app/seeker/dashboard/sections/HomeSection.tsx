"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  limit,
} from "firebase/firestore";
import {
  Search,
  Star,
  MapPin,
  AlertCircle,
  User,
  Filter,
  X,
  Loader2,
  CheckCircle,
  Shield,
  MessageSquare,
  Phone,
  Calendar,
  Timer,
  ChevronDown,
  RefreshCw,
  Clock,
  Briefcase,
  Camera,
  Zap,
  Eye,
  Info,
  ShieldCheck,
  Check,
  Quote,
  DollarSign,
  Mic,
  MicOff,
  Image,
  Trash2,
  Upload,
} from "lucide-react";
import {
  createNotification,
  NOTIFICATION_TYPES,
} from "../../../../lib/notifications";

// ==================== TYPES ====================
interface Provider {
  id: string;
  name: string;
  email: string;
  serviceType: string;
  district: string;
  block: string;
  rating: number;
  completedJobs: number;
  availability: boolean;
  phone?: string;
  status: string;
  totalReviews: number;
  photoLink?: string;
  _ratingRefreshKey?: number;
  availabilitySettings?: AvailabilityData;
  hasActiveRequest?: boolean;
  reviews?: Review[];
  description?: string;
  pricing?: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  seekerName: string;
  createdAt: Date | Timestamp;
  jobId?: string;
}

interface AddressData {
  district: string;
  block: string;
  fullAddress?: string;
}

interface AvailabilityData {
  isAvailable: boolean;
  workingHours: { start: string; end: string };
  workingDays: string[];
  breakTime?: { start: string; end: string };
  serviceRadius?: number;
  instantBooking?: boolean;
  advanceNotice?: number;
  maxJobsPerDay?: number;
}

// ==================== CONSTANTS ====================
const SERVICE_TYPES = [
  { en: "Plumbing", ta: "குழாய் வேலை", value: "plumbing" },
  { en: "Electrical", ta: "மின்சாரம்", value: "electrical" },
  { en: "Carpentry", ta: "தச்சு வேலை", value: "carpentry" },
  { en: "Painting", ta: "வண்ணம் தீட்டுதல்", value: "painting" },
  { en: "Home Cleaning", ta: "வீட்டு சுத்தம்", value: "home_cleaning" },
  { en: "AC Repair", ta: "ஏசி பழுது", value: "ac_repair" },
  { en: "Mechanic", ta: "மெக்கானிக்", value: "mechanic" },
  { en: "Pest Control", ta: "பூச்சி கட்டுப்பாடு", value: "pest_control" },
  { en: "Gardening", ta: "தோட்டக்கலை", value: "gardening" },
  { en: "Home Repair", ta: "வீடு பழுது", value: "home_repair" },
  {
    en: "Appliance Repair",
    ta: "பயன்பாட்டு சாதன பழுது",
    value: "appliance_repair",
  },
  { en: "Other Services", ta: "மற்ற சேவைகள்", value: "other_services" },
];

const DISTRICTS_TAMIL_NADU = [
  { en: "Ariyalur", ta: "அரியலூர்" },
  { en: "Chengalpattu", ta: "செங்கல்பட்டு" },
  { en: "Chennai", ta: "சென்னை" },
  { en: "Coimbatore", ta: "கோயம்புத்தூர்" },
  { en: "Cuddalore", ta: "கடலூர்" },
  { en: "Dharmapuri", ta: "தர்மபுரி" },
  { en: "Dindigul", ta: "திண்டுக்கல்" },
  { en: "Erode", ta: "ஈரோடு" },
  { en: "Kallakurichi", ta: "கள்ளக்குறிச்சி" },
  { en: "Kanchipuram", ta: "காஞ்சிபுரம்" },
  { en: "Kanyakumari", ta: "கன்னியாகுமரி" },
  { en: "Karur", ta: "கரூர்" },
  { en: "Krishnagiri", ta: "கிருஷ்ணகிரி" },
  { en: "Madurai", ta: "மதுரை" },
  { en: "Mayiladuthurai", ta: "மயிலாடுதுறை" },
  { en: "Nagapattinam", ta: "நாகப்பட்டினம்" },
  { en: "Namakkal", ta: "நாமக்கல்" },
  { en: "Nilgiris", ta: "நீலகிரி" },
  { en: "Perambalur", ta: "பெரம்பலூர்" },
  { en: "Pudukkottai", ta: "புதுக்கோட்டை" },
  { en: "Ramanathapuram", ta: "ராமநாதபுரம்" },
  { en: "Ranipet", ta: "ராணிப்பேட்டை" },
  { en: "Salem", ta: "சேலம்" },
  { en: "Sivaganga", ta: "சிவகங்கை" },
  { en: "Tenkasi", ta: "தென்காசி" },
  { en: "Thanjavur", ta: "தஞ்சாவூர்" },
  { en: "Theni", ta: "தேனி" },
  { en: "Thoothukudi", ta: "தூத்துக்குடி" },
  { en: "Tiruchirappalli", ta: "திருச்சிராப்பள்ளி" },
  { en: "Tirunelveli", ta: "திருநெல்வேலி" },
  { en: "Tirupattur", ta: "திருப்பத்தூர்" },
  { en: "Tiruppur", ta: "திருப்பூர்" },
  { en: "Tiruvallur", ta: "திருவள்ளூர்" },
  { en: "Tiruvannamalai", ta: "திருவண்ணாமலை" },
  { en: "Tiruvarur", ta: "திருவாரூர்" },
  { en: "Vellore", ta: "வேலூர்" },
  { en: "Viluppuram", ta: "விழுப்புரம்" },
  { en: "Virudhunagar", ta: "விருதுநகர்" },
];

const RATING_FILTERS = [
  { value: 0, label: { en: "Any Rating", ta: "எந்த மதிப்பீடும்" } },
  { value: 3, label: { en: "3+ Stars", ta: "3+ நட்சத்திரங்கள்" } },
  { value: 4, label: { en: "4+ Stars", ta: "4+ நட்சத்திரங்கள்" } },
  { value: 5, label: { en: "5 Stars", ta: "5 நட்சத்திரங்கள்" } },
];

// ==================== HELPER FUNCTIONS ====================
const convertTo12Hour = (time24: string): string => {
  try {
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch {
    return time24;
  }
};

// Upload blob to Cloudinary
const uploadBlobToCloudinary = async (
  blob: Blob,
  resourceType: "image" | "auto",
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      reject(
        new Error("Cloudinary credentials missing. Check your .env.local file"),
      );
      return;
    }

    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", uploadPreset);
    formData.append("cloud_name", cloudName);
    formData.append(
      "resource_type",
      resourceType === "image" ? "image" : "auto",
    );

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType === "image" ? "image" : "video"}/upload`;

    fetch(uploadUrl, {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          console.error("❌ Cloudinary error response:", data);
          throw new Error(
            data.error?.message || `Upload failed with status ${res.status}`,
          );
        }
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          reject(new Error("No secure_url in response"));
        }
      })
      .catch((err) => {
        console.error("❌ Fetch error:", err);
        reject(err);
      });
  });
};

// ==================== STAR RATING COMPONENT ====================
const StarRating = ({
  rating,
  size = "sm",
  showText = true,
  showReviews = false,
  totalReviews = 0,
}: {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
  showText?: boolean;
  showReviews?: boolean;
  totalReviews?: number;
}) => {
  const starSize = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];
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
      {showText && (
        <span className={`ml-1 font-medium text-gray-800`}>
          {rating.toFixed(1)}
        </span>
      )}
      {showReviews && totalReviews > 0 && (
        <span className={`text-gray-500`}>({totalReviews})</span>
      )}
    </div>
  );
};

// ==================== PROVIDER CARD SKELETON ====================
const ProviderCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse min-h-[280px] flex flex-col">
    <div className="flex items-start gap-3 mb-3">
      <div className="w-12 h-12 bg-gray-200 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded w-28" />
        <div className="h-4 bg-gray-100 rounded w-24" />
      </div>
    </div>
    <div className="h-10 bg-gray-100 rounded-lg mb-3" />
    <div className="h-4 bg-gray-100 rounded w-32 mb-2" />
    <div className="mt-auto pt-3 border-t border-gray-100">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-8 bg-gray-100 rounded-lg" />
        <div className="h-8 bg-gray-100 rounded-lg" />
      </div>
    </div>
  </div>
);

// ==================== REVIEWS MODAL ====================
const ReviewsModal = ({ provider, isOpen, onClose, lang }: any) => {
  if (!isOpen) return null;

  const safeToDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    if (typeof value?.toDate === "function") return value.toDate();
    return new Date();
  };

  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col cursor-default"
      >
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-yellow-50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Star className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === "en"
                    ? "Customer Reviews & Ratings"
                    : "வாடிக்கையாளர் மதிப்பீடுகள் & மதிப்புரைகள்"}
                </h3>
                <p className="text-sm text-gray-600">{provider.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {provider.rating.toFixed(1)}
                  </div>
                  <StarRating
                    rating={provider.rating}
                    size="lg"
                    showText={false}
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    {provider.totalReviews}{" "}
                    {lang === "en" ? "reviews" : "மதிப்பீடுகள்"}
                  </div>
                </div>
                <div className="h-12 w-px bg-gray-300 hidden md:block" />
                <div>
                  <p className="font-medium text-gray-800 mb-1">
                    {provider.completedJobs}{" "}
                    {lang === "en"
                      ? "jobs completed"
                      : "வேலைகள் முடிக்கப்பட்டன"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {provider.availability
                      ? lang === "en"
                        ? "Currently available"
                        : "தற்போது கிடைக்கும்"
                      : lang === "en"
                        ? "Currently busy"
                        : "தற்போது பிஸியாக"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 mb-2">
              {lang === "en" ? "Recent Reviews" : "சமீபத்திய மதிப்பீடுகள்"}
            </h4>
            {provider.reviews && provider.reviews.length > 0 ? (
              provider.reviews.map((review: any, index: number) => (
                <motion.div
                  key={review.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:border-amber-200 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-amber-600" />
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {review.seekerName ||
                            (lang === "en" ? "Customer" : "வாடிக்கையாளர்")}
                        </h5>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating
                            rating={review.rating}
                            size="sm"
                            showText={true}
                          />
                          <span className="text-xs text-gray-500">
                            {formatDate(safeToDate(review.createdAt))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <div className="bg-gray-50 p-3 rounded-lg mt-2">
                      <div className="flex items-start gap-2">
                        <Quote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 text-sm italic">
                          "{review.comment}"
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-600 mb-2">
                  {lang === "en"
                    ? "No reviews yet"
                    : "இதுவரை மதிப்பீடுகள் இல்லை"}
                </h4>
                <p className="text-gray-500 max-w-md mx-auto">
                  {lang === "en"
                    ? "This provider hasn't received any reviews yet."
                    : "இந்த வழங்குநருக்கு இதுவரை மதிப்பீடுகள் கிடைக்கவில்லை."}
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 font-medium text-sm transition-all shadow-sm hover:shadow cursor-pointer"
          >
            {lang === "en" ? "Close Reviews" : "மதிப்பீடுகளை மூடு"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== AVAILABILITY DETAILS MODAL ====================
const AvailabilityDetailsModal = ({ provider, isOpen, onClose, lang }: any) => {
  if (!isOpen || !provider.availabilitySettings) return null;
  const availability = provider.availabilitySettings;

  const formatWorkingDays = useCallback(() => {
    const daysMap: Record<string, { en: string; ta: string }> = {
      Mon: { en: "Monday", ta: "திங்கள்" },
      Tue: { en: "Tuesday", ta: "செவ்வாய்" },
      Wed: { en: "Wednesday", ta: "புதன்" },
      Thu: { en: "Thursday", ta: "வியாழன்" },
      Fri: { en: "Friday", ta: "வெள்ளி" },
      Sat: { en: "Saturday", ta: "சனி" },
      Sun: { en: "Sunday", ta: "ஞாயிறு" },
    };
    return availability.workingDays
      .map((day) => daysMap[day]?.[lang as "en" | "ta"] || day)
      .join(", ");
  }, [availability.workingDays, lang]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col cursor-default"
      >
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === "en" ? "Provider Details" : "வழங்குநர் விவரங்கள்"}
                </h3>
                <p className="text-sm text-gray-600">{provider.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {provider.description && (
            <div>
              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-500" />
                {lang === "en" ? "About Me" : "என்னைப் பற்றி"}
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {provider.description}
                </p>
              </div>
            </div>
          )}
          {provider.pricing && (
            <div>
              <h4 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                {lang === "en" ? "Pricing" : "விலை"}
              </h4>
              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-gray-700 whitespace-pre-wrap text-sm">
                  {provider.pricing}
                </p>
              </div>
            </div>
          )}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${availability.isAvailable ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
                >
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">
                    {availability.isAvailable
                      ? lang === "en"
                        ? "Currently Available"
                        : "தற்போது கிடைக்கும்"
                      : lang === "en"
                        ? "Currently Busy"
                        : "தற்போது பிஸியாக"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {availability.isAvailable
                      ? lang === "en"
                        ? "Accepting new requests now"
                        : "புதிய கோரிக்கைகளை இப்போது ஏற்கும்"
                      : lang === "en"
                        ? "Not accepting requests at this time"
                        : "இந்த நேரத்தில் கோரிக்கைகளை ஏற்காது"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-gray-800">
                {lang === "en" ? "Working Hours" : "பணி நேரங்கள்"}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 mb-1">
                  {lang === "en" ? "Start" : "தொடக்கம்"}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {convertTo12Hour(availability.workingHours.start)}
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <p className="text-xs text-blue-600 mb-1">
                  {lang === "en" ? "End" : "முடிவு"}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {convertTo12Hour(availability.workingHours.end)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-gray-800">
                {lang === "en" ? "Working Days" : "பணி நாட்கள்"}
              </h4>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-800 leading-relaxed">
                {formatWorkingDays()}
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm transition-all shadow-sm hover:shadow cursor-pointer"
          >
            {lang === "en" ? "Close" : "மூடு"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ==================== HELPER FUNCTIONS FOR DATA FETCHING ====================
const calculateProviderRatingFromJobs = async (
  providerId: string,
): Promise<{ rating: number; completedJobs: number; totalReviews: number }> => {
  try {
    const providerRef = doc(db, "providers", providerId);
    const providerDoc = await getDoc(providerRef);
    if (providerDoc.exists()) {
      const providerData = providerDoc.data();
      if (providerData.averageRating !== undefined) {
        return {
          rating: parseFloat((providerData.averageRating || 0).toFixed(1)),
          completedJobs: providerData.completedJobs || 0,
          totalReviews: providerData.totalReviews || 0,
        };
      }
    }
    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  } catch (error) {
    console.error("Error calculating provider rating:", error);
    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  }
};

const loadProviderReviews = async (providerId: string): Promise<Review[]> => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "==", "completed"),
      where("seekerRating", ">", 0),
      limit(20),
    );
    const snapshot = await getDocs(q);
    const reviews: Review[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.seekerRating && data.seekerRating > 0) {
        reviews.push({
          id: doc.id,
          rating: data.seekerRating,
          comment: data.seekerReview || "",
          seekerName: data.seekerName || "Customer",
          createdAt:
            data.seekerConfirmedAt ||
            data.completedAt ||
            data.createdAt ||
            Timestamp.now(),
          jobId: doc.id,
        });
      }
    });
    reviews.sort((a, b) => {
      const dateA =
        a.createdAt instanceof Date
          ? a.createdAt
          : (a.createdAt as Timestamp).toDate();
      const dateB =
        b.createdAt instanceof Date
          ? b.createdAt
          : (b.createdAt as Timestamp).toDate();
      return dateB.getTime() - dateA.getTime();
    });
    return reviews;
  } catch (error) {
    console.error("Error loading provider reviews:", error);
    return [];
  }
};

const loadProviderAvailability = async (
  providerId: string,
): Promise<AvailabilityData> => {
  try {
    const providerRef = doc(db, "providers", providerId);
    const providerDoc = await getDoc(providerRef);
    if (providerDoc.exists()) {
      const providerData = providerDoc.data();
      if (providerData.availabilitySettings) {
        const settings = providerData.availabilitySettings;
        return {
          isAvailable:
            settings.isAvailable !== undefined ? settings.isAvailable : true,
          workingHours: settings.workingHours || {
            start: "09:00",
            end: "18:00",
          },
          workingDays: settings.workingDays || [
            "Mon",
            "Tue",
            "Wed",
            "Thu",
            "Fri",
            "Sat",
          ],
          breakTime: settings.breakTime || { start: "13:00", end: "14:00" },
          serviceRadius: settings.serviceRadius || 10,
          instantBooking:
            settings.instantBooking !== undefined
              ? settings.instantBooking
              : true,
          advanceNotice: settings.advanceNotice || 2,
          maxJobsPerDay: settings.maxJobsPerDay || 3,
        };
      }
    }
  } catch (error) {
    console.error(`Error loading availability:`, error);
  }
  return {
    isAvailable: true,
    workingHours: { start: "09:00", end: "18:00" },
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    breakTime: { start: "13:00", end: "14:00" },
    serviceRadius: 10,
    instantBooking: true,
    advanceNotice: 2,
    maxJobsPerDay: 3,
  };
};

const checkIfHasActiveRequest = async (
  seekerId: string,
  providerId: string,
): Promise<boolean> => {
  if (!seekerId || !providerId) return false;
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("seekerId", "==", seekerId),
      where("providerId", "==", providerId),
      where("status", "in", [
        "pending",
        "in_progress",
        "awaiting_confirmation",
      ]),
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking active requests:", error);
    return false;
  }
};

// ==================== MAIN COMPONENT ====================
export default function HomeSection() {
  const { lang } = useLanguage();
  const { user, userData } = useAuth();

  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [seekerAddress, setSeekerAddress] = useState<AddressData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [availabilityModalProvider, setAvailabilityModalProvider] =
    useState<Provider | null>(null);
  const [reviewsModalProvider, setReviewsModalProvider] =
    useState<Provider | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [filteredServices, setFilteredServices] = useState(SERVICE_TYPES);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null,
  );
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [serviceDescription, setServiceDescription] = useState("");
  const [urgencyHours, setUrgencyHours] = useState(2);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [voiceUploading, setVoiceUploading] = useState(false);
  const [voiceUploadedUrl, setVoiceUploadedUrl] = useState<string | null>(null);

  // Image upload states
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadedUrl, setImageUploadedUrl] = useState<string | null>(null);

  const [, setNotif] = useState<null | {
    message: string;
    type: "success" | "error";
  }>(null);

  useEffect(() => {
    if (serviceSearch.trim() === "") setFilteredServices(SERVICE_TYPES);
    else {
      const q = serviceSearch.toLowerCase();
      setFilteredServices(
        SERVICE_TYPES.filter(
          (s) =>
            s.en.toLowerCase().includes(q) ||
            s.ta.includes(q) ||
            s.value.toLowerCase().includes(q),
        ),
      );
    }
  }, [serviceSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target as Node)
      ) {
        setShowServiceDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load seeker address
  useEffect(() => {
    if (!user?.uid) {
      setLoadingAddress(false);
      return;
    }
    const loadAddress = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data?.address?.district) {
            setSeekerAddress({
              district: data.address.district,
              block: data.address.block || "",
              fullAddress: data.address.fullAddress,
            });
            setSelectedDistrict(data.address.district);
          }
        }
      } catch (err) {
        console.error("Error loading address:", err);
      } finally {
        setLoadingAddress(false);
      }
    };
    loadAddress();
  }, [user?.uid]);

  // Load providers with real-time updates
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const providersRef = collection(db, "providers");
    const q = query(providersRef, where("status", "==", "approved"), limit(50));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const providersData: Provider[] = [];
          const batchSize = 8;
          for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            const batch = snapshot.docs.slice(i, i + batchSize);
            const batchPromises = batch.map(async (docSnap) => {
              const providerData = docSnap.data();
              const providerId = docSnap.id;
              const hasActiveRequest = await checkIfHasActiveRequest(
                user.uid,
                providerId,
              );
              const [calculatedRating, reviews, availabilitySettings] =
                await Promise.all([
                  calculateProviderRatingFromJobs(providerId),
                  loadProviderReviews(providerId),
                  loadProviderAvailability(providerId),
                ]);
              const providerAvailability =
                providerData.availability !== undefined
                  ? providerData.availability === true
                  : availabilitySettings.isAvailable;
              return {
                id: providerId,
                name: providerData.name || "",
                email: providerData.email || "",
                serviceType: providerData.serviceType || "",
                district: providerData.district || "",
                block: providerData.block || "",
                rating: calculatedRating.rating,
                completedJobs: calculatedRating.completedJobs,
                availability: providerAvailability,
                phone: providerData.phone,
                status: providerData.status || "approved",
                totalReviews: calculatedRating.totalReviews,
                photoLink: providerData.photoLink || "",
                _ratingRefreshKey: refreshKey,
                availabilitySettings,
                hasActiveRequest,
                reviews,
                description: providerData.description || "",
                pricing: providerData.pricing || "",
              } as Provider;
            });
            providersData.push(...(await Promise.all(batchPromises)));
          }
          providersData.sort((a, b) => b.rating - a.rating);
          setProviders(providersData);
          setLoading(false);
        } catch (error) {
          console.error("Error processing providers:", error);
          setLoading(false);
        }
      },
      (error) => {
        console.error("Error in provider subscription:", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user?.uid, refreshKey]);

  const refreshAllProviders = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const filteredProviders = useMemo(() => {
    let list = [...providers];
    if (selectedDistrict)
      list = list.filter((p) => p.district === selectedDistrict);
    if (selectedService)
      list = list.filter((p) => p.serviceType === selectedService);
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    if (showOnlyAvailable) list = list.filter((p) => p.availability === true);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.serviceType.toLowerCase().includes(query) ||
          p.district.toLowerCase().includes(query) ||
          p.block.toLowerCase().includes(query),
      );
    }
    return list;
  }, [
    providers,
    selectedDistrict,
    selectedService,
    minRating,
    showOnlyAvailable,
    searchQuery,
  ]);

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());

        setVoiceUploading(true);
        try {
          const uploadedUrl = await uploadBlobToCloudinary(blob, "auto");
          setVoiceUploadedUrl(uploadedUrl);
          setNotif({
            message:
              lang === "en"
                ? "Voice uploaded successfully!"
                : "குரல் வெற்றிகரமாக பதிவேற்றப்பட்டது!",
            type: "success",
          });
        } catch (err: any) {
          console.error("Voice upload failed:", err);
          setNotif({
            message:
              lang === "en"
                ? `Voice upload failed: ${err.message}`
                : `குரல் பதிவேற்றம் தோல்வி: ${err.message}`,
            type: "error",
          });
          setAudioUrl(null);
          setAudioBlob(null);
        } finally {
          setVoiceUploading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.error("Microphone access denied:", err);
      setNotif({
        message:
          lang === "en"
            ? "Please allow microphone access"
            : "மைக்ரோஃபோன் அனுமதியை வழங்கவும்",
        type: "error",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
      setVoiceUploadedUrl(null);
    }
  };

  // ✅ FIXED: Camera access - uses 'capture' attribute for direct camera
  const handleTakePhoto = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    // ✅ CRITICAL FIX: 'capture' attribute opens camera directly on mobile
    input.setAttribute("capture", "environment");

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setNotif({
          message:
            lang === "en"
              ? "Image too large (max 5MB)"
              : "படம் மிகப்பெரியது (அதிகபட்சம் 5MB)",
          type: "error",
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageUploading(true);

      try {
        const uploadedUrl = await uploadBlobToCloudinary(file, "image");
        setImageUploadedUrl(uploadedUrl);
        setNotif({
          message: lang === "en" ? "Image uploaded!" : "படம் பதிவேற்றப்பட்டது!",
          type: "success",
        });
      } catch (err: any) {
        console.error("Image upload failed:", err);
        setNotif({
          message:
            lang === "en"
              ? `Image upload failed: ${err.message}`
              : `படம் பதிவேற்றம் தோல்வி: ${err.message}`,
          type: "error",
        });
        setImagePreview(null);
      } finally {
        setImageUploading(false);
      }
    };

    input.click();
  };

  // Gallery upload (opens file picker)
  const handleUploadFromGallery = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    // No capture attribute - opens gallery/file picker

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        setNotif({
          message:
            lang === "en"
              ? "Image too large (max 5MB)"
              : "படம் மிகப்பெரியது (அதிகபட்சம் 5MB)",
          type: "error",
        });
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageUploading(true);

      try {
        const uploadedUrl = await uploadBlobToCloudinary(file, "image");
        setImageUploadedUrl(uploadedUrl);
        setNotif({
          message: lang === "en" ? "Image uploaded!" : "படம் பதிவேற்றப்பட்டது!",
          type: "success",
        });
      } catch (err: any) {
        console.error("Image upload failed:", err);
        setNotif({
          message:
            lang === "en"
              ? `Image upload failed: ${err.message}`
              : `படம் பதிவேற்றம் தோல்வி: ${err.message}`,
          type: "error",
        });
        setImagePreview(null);
      } finally {
        setImageUploading(false);
      }
    };

    input.click();
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageUploadedUrl(null);
  };

  // Send request to provider
  const handleSendRequest = async () => {
    if (!selectedProvider || !user || !seekerAddress?.district) {
      alert(
        lang === "en"
          ? "Missing required information"
          : "தேவையான தகவல்கள் காணவில்லை",
      );
      return;
    }
    if (selectedProvider.hasActiveRequest) {
      alert(
        lang === "en"
          ? "You already have an active request with this provider."
          : "உங்களிடம் ஏற்கனவே இந்த வழங்குநருடன் செயலில் உள்ள கோரிக்கை உள்ளது.",
      );
      return;
    }
    setSubmittingRequest(true);
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + urgencyHours);
      const seekerName =
        userData?.name ||
        user.displayName ||
        (lang === "en" ? "Seeker" : "தேடுபவர்");

      const requestData: any = {
        seekerId: user.uid,
        seekerName,
        seekerEmail: user.email || "",
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        serviceType: selectedProvider.serviceType,
        description:
          serviceDescription.trim() ||
          (lang === "en" ? "Service request" : "சேவை கோரிக்கை"),
        district: seekerAddress.district,
        block: seekerAddress.block || "",
        urgency: `${urgencyHours}h`,
        status: "pending",
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        seekerPhone: null,
        exactAddress: null,
        addressShared: false,
        providerPhone: null,
      };

      if (voiceUploadedUrl) {
        requestData.voiceMessageUrl = voiceUploadedUrl;
      }
      if (imageUploadedUrl) {
        requestData.imageUrl = imageUploadedUrl;
      }

      const requestRef = await addDoc(
        collection(db, "serviceRequests"),
        requestData,
      );

      await createNotification({
        userId: selectedProvider.id,
        title: lang === "en" ? "New Service Request" : "புதிய சேவை கோரிக்கை",
        message:
          lang === "en"
            ? `${seekerName} requested service`
            : `${seekerName} சேவை கோரிக்கை வைத்துள்ளார்`,
        type: NOTIFICATION_TYPES.REQUEST_RECEIVED,
        requestId: requestRef.id,
      });

      alert(
        lang === "en"
          ? "✅ Request sent successfully!"
          : "✅ கோரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது!",
      );
      setShowRequestModal(false);
      setSelectedProvider(null);
      setServiceDescription("");
      setUrgencyHours(2);
      deleteRecording();
      removeImage();
      setProviders((prev) =>
        prev.map((p) =>
          p.id === selectedProvider.id ? { ...p, hasActiveRequest: true } : p,
        ),
      );
    } catch (err: any) {
      console.error("Error sending request:", err);
      alert(
        lang === "en"
          ? `Failed to send request: ${err.message}`
          : `கோரிக்கை அனுப்ப முடியவில்லை: ${err.message}`,
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedService("");
    setSelectedDistrict(seekerAddress?.district || "");
    setMinRating(0);
    setShowOnlyAvailable(true);
    setServiceSearch("");
  };

  const getDistrictName = useCallback(
    (districtEn: string) => {
      const district = DISTRICTS_TAMIL_NADU.find((d) => d.en === districtEn);
      return lang === "en" ? districtEn : district?.ta || districtEn;
    },
    [lang],
  );

  const getServiceName = useCallback(
    (serviceValue: string) => {
      const service = SERVICE_TYPES.find((s) => s.value === serviceValue);
      return service ? service[lang === "en" ? "en" : "ta"] : serviceValue;
    },
    [lang],
  );

  const getUrgencyText = (hours: number) => {
    if (hours === 1) return lang === "en" ? "1 hour" : "1 மணி நேரம்";
    if (hours === 24) return lang === "en" ? "1 day" : "1 நாள்";
    return lang === "en" ? `${hours} hours` : `${hours} மணி நேரம்`;
  };

  // Provider Card Component - Fixed for mobile
  const ProviderCard = ({ provider }: { provider: Provider }) => {
    const canRequest =
      provider.availability &&
      seekerAddress?.district &&
      !provider.hasActiveRequest;
    const recentReview =
      provider.reviews && provider.reviews.length > 0
        ? provider.reviews[0]
        : null;

    return (
      <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col h-full overflow-hidden cursor-pointer w-full">
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-3 mb-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              {provider.photoLink ? (
                <img
                  src={provider.photoLink}
                  alt={provider.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                  {provider.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
                {provider.name}
              </h4>
              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  <span>
                    {lang === "en" ? "Verified" : "சரிபார்க்கப்பட்டது"}
                  </span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${provider.availability ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                  <span>
                    {provider.availability
                      ? lang === "en"
                        ? "Available"
                        : "கிடைக்கும்"
                      : lang === "en"
                        ? "Busy"
                        : "பிஸியாக"}
                  </span>
                </span>
                {provider.hasActiveRequest && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                    <span>{lang === "en" ? "Sent" : "அனுப்பப்பட்டது"}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mb-3">
            <span className="inline-block w-full text-center text-base font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-2 rounded-lg shadow-md">
              {getServiceName(provider.serviceType)}
            </span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
            <span className="truncate font-medium">
              {getDistrictName(provider.district)}
              {provider.block && (
                <span className="text-gray-500">, {provider.block}</span>
              )}
            </span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <StarRating
              rating={provider.rating}
              size="xs"
              showText={true}
              showReviews={true}
              totalReviews={provider.totalReviews}
            />
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Briefcase className="w-3 h-3" />
              <span>{provider.completedJobs}</span>
            </div>
          </div>

          {recentReview && recentReview.comment && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex items-start gap-1.5">
                <Quote className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <StarRating
                      rating={recentReview.rating}
                      size="xs"
                      showText={false}
                    />
                    <span className="text-gray-500 text-xs truncate max-w-[80px]">
                      {recentReview.seekerName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                    "
                    {recentReview.comment.length > 80
                      ? recentReview.comment.substring(0, 80) + "..."
                      : recentReview.comment}
                    "
                  </p>
                  <button
                    onClick={() => setReviewsModalProvider(provider)}
                    className="mt-1 text-blue-600 hover:text-blue-700 text-xs font-medium cursor-pointer"
                  >
                    {lang === "en"
                      ? "View all reviews"
                      : "அனைத்து மதிப்பீடுகளையும் காண்க"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 pt-0 mt-auto border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAvailabilityModalProvider(provider)}
              className="py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{lang === "en" ? "Details" : "விவரங்கள்"}</span>
            </button>
            <button
              onClick={() => {
                setSelectedProvider(provider);
                setShowRequestModal(true);
              }}
              disabled={!canRequest}
              className={`py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                canRequest
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="block truncate">
                {provider.hasActiveRequest
                  ? lang === "en"
                    ? "Sent"
                    : "அனுப்பப்பட்டது"
                  : !seekerAddress?.district
                    ? lang === "en"
                      ? "Set Addr"
                      : "முகவரி"
                    : !provider.availability
                      ? lang === "en"
                        ? "Busy"
                        : "பிஸி"
                      : lang === "en"
                        ? "Request"
                        : "கோருங்கள்"}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loadingAddress) {
    return (
      <div className="space-y-6">
        <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header Section - Fixed overflow */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                  {lang === "en"
                    ? "Find Service Providers"
                    : "சேவை வழங்குநர்களைக் கண்டறியவும்"}
                </h1>
                {seekerAddress?.district ? (
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-gray-600 text-sm whitespace-nowrap">
                      {lang === "en" ? "Your location:" : "உங்கள் இடம்:"}
                    </span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full break-words max-w-full">
                      {getDistrictName(seekerAddress.district)}
                      {seekerAddress.block && (
                        <span className="text-blue-600">
                          , {seekerAddress.block}
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-red-600 mt-2">
                    {lang === "en"
                      ? "Please set your address in Profile section"
                      : "உங்கள் முகவரியை சுயவிவரப் பிரிவில் அமைக்கவும்"}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-lg min-w-[250px] w-full">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  lang === "en"
                    ? "Search by name, service, district, or block..."
                    : "பெயர், சேவை, மாவட்டம் அல்லது பிளாக் மூலம் தேடுங்கள்..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section - Fixed mobile layout */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-sm overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
              <Filter className="w-5 h-5 text-gray-700" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-lg truncate">
                {lang === "en" ? "Filter Providers" : "வழங்குநர்களை வடிகட்டு"}
              </h2>
              <p className="text-sm text-gray-600 truncate">
                {lang === "en"
                  ? "Refine your search results"
                  : "உங்கள் தேடல் முடிவுகளை சுத்தி செய்யுங்கள்"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {!loading && filteredProviders.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium whitespace-nowrap min-w-[120px] text-center">
                {filteredProviders.length}{" "}
                {lang === "en" ? "providers" : "வழங்குநர்கள்"}
              </div>
            )}
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2 transition cursor-pointer whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              {lang === "en" ? "Clear All" : "அனைத்தையும் அழி"}
            </button>
          </div>
        </div>

        {/* Filters grid - responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
              {lang === "en" ? "District" : "மாவட்டம்"}
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none truncate cursor-pointer"
              >
                <option value="">
                  {lang === "en" ? "All Districts" : "அனைத்து மாவட்டங்களும்"}
                </option>
                {DISTRICTS_TAMIL_NADU.map((district) => (
                  <option key={district.en} value={district.en}>
                    {lang === "en" ? district.en : district.ta}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div className="min-w-0" ref={serviceDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
              {lang === "en" ? "Service Type" : "சேவை வகை"}
            </label>
            <div className="relative">
              <div
                onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                className={`w-full px-4 py-3 border rounded-lg flex items-center justify-between cursor-pointer transition bg-white hover:border-blue-500 min-h-[48px] ${
                  showServiceDropdown
                    ? "border-blue-500 ring-2 ring-blue-100"
                    : "border-gray-300"
                }`}
              >
                <span className="truncate text-sm">
                  {selectedService
                    ? getServiceName(selectedService)
                    : lang === "en"
                      ? "All Services"
                      : "அனைத்து சேவைகளும்"}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {selectedService && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService("");
                        setServiceSearch("");
                      }}
                      className="p-1 hover:bg-gray-100 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${showServiceDropdown ? "rotate-180" : ""}`}
                  />
                </div>
              </div>
              {showServiceDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-64 overflow-hidden">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        placeholder={
                          lang === "en"
                            ? "Search services..."
                            : "சேவைகளைத் தேடுங்கள்..."
                        }
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto max-h-48">
                    {filteredServices.length === 0 ? (
                      <div className="py-4 text-center text-gray-500 text-sm">
                        {lang === "en"
                          ? "No services found"
                          : "சேவைகள் கிடைக்கவில்லை"}
                      </div>
                    ) : (
                      <div className="py-1">
                        {filteredServices.map((service) => (
                          <div
                            key={service.value}
                            onClick={() => {
                              setSelectedService(service.value);
                              setShowServiceDropdown(false);
                              setServiceSearch("");
                            }}
                            className={`px-4 py-3 cursor-pointer hover:bg-blue-50 transition ${
                              selectedService === service.value
                                ? "bg-blue-50 text-blue-700 font-medium"
                                : "text-gray-700"
                            }`}
                          >
                            <div className="font-medium text-sm truncate">
                              {lang === "en" ? service.en : service.ta}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                              {lang === "en" ? service.ta : service.en}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
              {lang === "en" ? "Minimum Rating" : "குறைந்தபட்ச மதிப்பீடு"}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white truncate cursor-pointer"
            >
              {RATING_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[lang]}
                  {option.value > 0 && ` (${option.value}+)`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-3 h-12">
              <button
                type="button"
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${showOnlyAvailable ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${showOnlyAvailable ? "translate-x-5" : "translate-x-1"}`}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {lang === "en" ? "Available now" : "தற்போது கிடைக்கும்"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600 whitespace-nowrap">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span className="truncate">
                {lang === "en"
                  ? "Loading providers..."
                  : "வழங்குநர்களை ஏற்றுகிறது..."}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-gray-900">
                {filteredProviders.length}
              </span>
              <span className="text-gray-600 whitespace-nowrap">
                {lang === "en" ? "providers found" : "வழங்குநர்கள் கிடைத்தன"}
              </span>
              {(selectedDistrict || selectedService) && (
                <span className="text-gray-400">•</span>
              )}
              {selectedDistrict && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium truncate max-w-[150px]">
                  {getDistrictName(selectedDistrict)}
                </span>
              )}
              {selectedService && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium truncate max-w-[150px]">
                  {getServiceName(selectedService)}
                </span>
              )}
            </div>
          )}
        </div>
        {!loading && filteredProviders.length > 0 && (
          <button
            onClick={refreshAllProviders}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2 hover:bg-blue-50 rounded-lg transition cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === "en" ? "Refresh Results" : "முடிவுகளை புதுப்பிக்கவும்"}
          </button>
        )}
      </div>

      {/* Providers Grid - Fixed mobile: 1 column on mobile */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <ProviderCardSkeleton key={i} />
            ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-b from-white to-gray-50 rounded-2xl border border-gray-200">
          <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {lang === "en"
              ? "No providers found"
              : "வழங்குநர்கள் கிடைக்கவில்லை"}
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto px-4">
            {lang === "en"
              ? "Try adjusting your filters or search terms to find what you're looking for."
              : "நீங்கள் தேடுவதைக் கண்டுபிடிக்க உங்கள் வடிப்பான்கள் அல்லது தேடல் விதிமுறைகளை மாற்றவும்."}
          </p>
          <button
            onClick={handleResetFilters}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm shadow-sm hover:shadow transition cursor-pointer"
          >
            {lang === "en"
              ? "Reset All Filters"
              : "அனைத்து வடிப்பான்களையும் மீட்டமை"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={`${provider.id}-${provider._ratingRefreshKey || 0}`}
              provider={provider}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {reviewsModalProvider && (
        <ReviewsModal
          provider={reviewsModalProvider}
          isOpen={!!reviewsModalProvider}
          onClose={() => setReviewsModalProvider(null)}
          lang={lang}
        />
      )}
      {availabilityModalProvider && (
        <AvailabilityDetailsModal
          provider={availabilityModalProvider}
          isOpen={!!availabilityModalProvider}
          onClose={() => setAvailabilityModalProvider(null)}
          lang={lang}
        />
      )}

      {/* Request Modal - Fixed mobile */}
      <AnimatePresence>
        {showRequestModal && selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowRequestModal(false);
              setServiceDescription("");
              setUrgencyHours(2);
              deleteRecording();
              removeImage();
            }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto cursor-default"
            >
              <div className="p-4 sm:p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      {lang === "en" ? "Request Service" : "சேவையைக் கோருங்கள்"}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                      {lang === "en"
                        ? "Send service request to provider"
                        : "வழங்குநருக்கு சேவை கோரிக்கையை அனுப்பவும்"}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setServiceDescription("");
                      setUrgencyHours(2);
                      deleteRecording();
                      removeImage();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition cursor-pointer flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Provider Info */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {selectedProvider.photoLink ? (
                        <img
                          src={selectedProvider.photoLink}
                          alt={selectedProvider.name}
                          className="w-full h-full rounded-full object-cover border-3 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {selectedProvider.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-lg truncate">
                        {selectedProvider.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 truncate">
                        {getDistrictName(selectedProvider.district)}
                        {selectedProvider.block && (
                          <span className="text-gray-500">
                            , {selectedProvider.block}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <StarRating
                          rating={selectedProvider.rating}
                          size="md"
                          showReviews={true}
                          totalReviews={selectedProvider.totalReviews}
                        />
                        {selectedProvider.completedJobs > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 whitespace-nowrap">
                            <Briefcase className="w-4 h-4 flex-shrink-0" />
                            <span>{selectedProvider.completedJobs}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HIGHLIGHTED SERVICE TYPE */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-center shadow-lg">
                    <p className="text-xs text-blue-100 mb-1">
                      {lang === "en" ? "Service Type" : "சேவை வகை"}
                    </p>
                    <p className="text-xl font-bold text-white">
                      {getServiceName(selectedProvider.serviceType)}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Service Description - Optional */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
                      {lang === "en" ? "Service Description" : "சேவை விளக்கம்"}{" "}
                      <span className="text-gray-400 text-xs font-normal">
                        ({lang === "en" ? "Optional" : "விருப்பத்தேர்வு"})
                      </span>
                    </label>
                    <textarea
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder={
                        lang === "en"
                          ? "Describe what you need (optional)..."
                          : "உங்களுக்கு என்ன தேவை என விவரிக்கவும் (விருப்பத்தேர்வு)..."
                      }
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    />
                  </div>

                  {/* VOICE RECORDING - ALWAYS VISIBLE */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {lang === "en" ? "Voice Message" : "குரல் செய்தி"}
                      <span className="text-xs text-gray-400 ml-1">
                        ({lang === "en" ? "Optional" : "விருப்பத்தேர்வு"})
                      </span>
                    </label>
                    <div className="flex items-center gap-3">
                      {!audioUrl ? (
                        <button
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={voiceUploading}
                          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition cursor-pointer ${
                            isRecording
                              ? "bg-red-500 text-white animate-pulse"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          } disabled:opacity-50`}
                        >
                          {isRecording ? (
                            <>
                              <MicOff className="w-4 h-4" />
                              {lang === "en"
                                ? "Stop Recording"
                                : "பதிவை நிறுத்து"}
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" />
                              {lang === "en"
                                ? "Start Recording"
                                : "பதிவை தொடங்கு"}
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <audio
                            src={audioUrl}
                            controls
                            className="h-10 flex-1"
                          />
                          {voiceUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          ) : (
                            <button
                              type="button"
                              onClick={deleteRecording}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {isRecording && (
                      <p className="text-xs text-red-500 animate-pulse">
                        {lang === "en"
                          ? "Recording... Click stop when done"
                          : "பதிவு செய்யப்படுகிறது... முடிந்ததும் நிறுத்து கிளிக் செய்யவும்"}
                      </p>
                    )}
                    {voiceUploadedUrl && !voiceUploading && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {lang === "en"
                          ? "Voice message ready"
                          : "குரல் செய்தி தயார்"}
                      </p>
                    )}
                  </div>

                  {/* IMAGE UPLOAD - ALWAYS VISIBLE with separate Camera and Gallery buttons */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {lang === "en" ? "Photo" : "புகைப்படம்"}
                      <span className="text-xs text-gray-400 ml-1">
                        ({lang === "en" ? "Optional" : "விருப்பத்தேர்வு"})
                      </span>
                    </label>
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Problem preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* Upload from Gallery Button */}
                        <button
                          type="button"
                          onClick={handleUploadFromGallery}
                          disabled={imageUploading}
                          className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition cursor-pointer"
                        >
                          {imageUploading ? (
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          ) : (
                            <>
                              <Image className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">
                                {lang === "en"
                                  ? "Upload from Gallery"
                                  : "கேலரியில் இருந்து பதிவேற்று"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {lang === "en"
                                  ? "JPG, PNG up to 5MB"
                                  : "JPG, PNG அதிகபட்சம் 5MB"}
                              </p>
                            </>
                          )}
                        </button>
                        {/* Take Photo Button - Opens Camera directly */}
                        <button
                          type="button"
                          onClick={handleTakePhoto}
                          disabled={imageUploading}
                          className="flex-1 flex flex-col items-center justify-center py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition cursor-pointer"
                        >
                          {imageUploading ? (
                            <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                          ) : (
                            <>
                              <Camera className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-sm text-gray-500">
                                {lang === "en"
                                  ? "Take Photo"
                                  : "புகைப்படம் எடு"}
                              </p>
                              <p className="text-xs text-gray-400">
                                {lang === "en"
                                  ? "Use camera"
                                  : "கேமராவைப் பயன்படுத்து"}
                              </p>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Urgency Slider */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 whitespace-nowrap">
                      {lang === "en"
                        ? "Urgency (Hours)"
                        : "அவசரத்தன்மை (மணி நேரம்)"}
                    </label>
                    <div className="space-y-4">
                      <div className="px-2">
                        <input
                          type="range"
                          min="1"
                          max="24"
                          value={urgencyHours}
                          onChange={(e) =>
                            setUrgencyHours(parseInt(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(urgencyHours / 24) * 100}%, #e5e7eb ${(urgencyHours / 24) * 100}%, #e5e7eb 100%)`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">
                            {lang === "en"
                              ? "Time needed:"
                              : "தேவைப்படும் நேரம்:"}
                          </span>
                          <span className="text-lg font-bold text-blue-600">
                            {getUrgencyText(urgencyHours)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">1h</span>
                          <span className="text-xs text-gray-500">24h</span>
                        </div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-blue-700">
                            {lang === "en"
                              ? `Request expires in ${getUrgencyText(urgencyHours)} if not accepted`
                              : `ஏற்கப்படாவிட்டால் ${getUrgencyText(urgencyHours)} இல் கோரிக்கை காலாவதியாகும்`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Privacy Note */}
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 mb-1 truncate">
                          {lang === "en"
                            ? "Your privacy is protected"
                            : "உங்கள் தனியுரிமை பாதுகாக்கப்படுகிறது"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {lang === "en"
                            ? "Your contact details will be shared only after the provider accepts your request."
                            : "வழங்குநர் உங்கள் கோரிக்கையை ஏற்றுக்கொண்ட பிறகே உங்கள் தொடர்பு விவரங்கள் பகிரப்படும்."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => {
                        setShowRequestModal(false);
                        setServiceDescription("");
                        setUrgencyHours(2);
                        deleteRecording();
                        removeImage();
                      }}
                      className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition cursor-pointer"
                    >
                      {lang === "en" ? "Cancel" : "ரத்து செய்"}
                    </button>
                    <button
                      onClick={handleSendRequest}
                      disabled={submittingRequest}
                      className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submittingRequest ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                          <span className="truncate">
                            {lang === "en" ? "Sending..." : "அனுப்புகிறது..."}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            {lang === "en"
                              ? "Send Request"
                              : "கோரிக்கையை அனுப்பு"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
