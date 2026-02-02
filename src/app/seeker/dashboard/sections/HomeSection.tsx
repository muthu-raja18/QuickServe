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
  Sun,
  Moon,
  Eye,
  Info,
  ChevronRight,
  ShieldCheck,
  Award,
  Sparkles,
  Check,
  Ban,
  MessageCircle,
  ChevronUp,
  ChevronLeft,
  ThumbsUp,
  Quote,
} from "lucide-react";

// Types
interface Provider {
  id: string;
  name: string;
  email: string;
  serviceType: string;
  district: string;
  block: string; // Added block field
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
  reviews?: Review[]; // Added reviews field
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
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  breakTime?: {
    start: string;
    end: string;
  };
  serviceRadius?: number;
  instantBooking?: boolean;
  advanceNotice?: number;
  maxJobsPerDay?: number;
}

// ✅ Convert 24-hour to 12-hour format
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

// Service Types Array
const SERVICE_TYPES = [
  // Construction & Repair (General)
  { en: "Plumbing", ta: "குழாய் வேலை", value: "plumbing" },
  { en: "Electrical", ta: "மின்சாரம்", value: "electrical" },
  { en: "Carpentry", ta: "தச்சு வேலை", value: "carpentry" },
  { en: "Painting", ta: "வண்ணம் தீட்டுதல்", value: "painting" },
  { en: "Masonry", ta: "கட்டுமான வேலை", value: "masonry" },
  { en: "Tile Work", ta: "டைல் வேலை", value: "tile_work" },
  { en: "Home Repair", ta: "வீடு பழுது", value: "home_repair" },
  { en: "Furniture Repair", ta: "தட்டு பழுது", value: "furniture_repair" },
  { en: "Waterproofing", ta: "நீர்புகா வேலை", value: "waterproofing" },

  // Cleaning Services
  { en: "Home Cleaning", ta: "வீட்டு சுத்தம்", value: "home_cleaning" },
  { en: "Deep Cleaning", ta: "ஆழமான சுத்தம்", value: "deep_cleaning" },
  { en: "Office Cleaning", ta: "அலுவலக சுத்தம்", value: "office_cleaning" },
  {
    en: "Sofa & Carpet Cleaning",
    ta: "சோபா & கம்பளி சுத்தம்",
    value: "sofa_carpet_cleaning",
  },
  { en: "Car Cleaning", ta: "கார் சுத்தம்", value: "car_cleaning" },
  {
    en: "Tank & Drain Cleaning",
    ta: "தொட்டி & கழிவுநீர் சுத்தம்",
    value: "tank_drain_cleaning",
  },

  // Appliance Repair (General & Specialized)
  {
    en: "Appliance Repair",
    ta: "பயன்பாட்டு சாதன பழுது",
    value: "appliance_repair",
  },
  { en: "AC Services", ta: "ஏசி சேவைகள்", value: "ac_services" },
  { en: "AC Repair", ta: "ஏசி பழுது", value: "ac_repair" },
  { en: "AC Installation", ta: "ஏசி நிறுவுதல்", value: "ac_installation" },
  {
    en: "Refrigerator Repair",
    ta: "குளிர்சாதனப் பெட்டி பழுது",
    value: "refrigerator_repair",
  },
  {
    en: "Washing Machine Repair",
    ta: "சலவை இயந்திரம் பழுது",
    value: "washing_machine_repair",
  },
  {
    en: "TV & Electronics Repair",
    ta: "டிவி & மின்னணு பழுது",
    value: "tv_electronics_repair",
  },
  {
    en: "Water Purifier Services",
    ta: "நீர் சுத்திகரிப்பான் சேவைகள்",
    value: "water_purifier_services",
  },

  // Vehicle Services (General & Specialized)
  { en: "Mechanic", ta: "மெக்கானிக்", value: "mechanic" },
  { en: "Car Mechanic", ta: "கார் மெக்கானிக்", value: "car_mechanic" },
  { en: "Bike Mechanic", ta: "பைக் மெக்கானிக்", value: "bike_mechanic" },
  { en: "Car Wash", ta: "கார் கழுவுதல்", value: "car_wash" },
  { en: "Tire Services", ta: "டயர் சேவைகள்", value: "tire_services" },
  {
    en: "Vehicle Painting",
    ta: "வாகன வண்ணம் தீட்டுதல்",
    value: "vehicle_painting",
  },
  { en: "Car AC Repair", ta: "கார் ஏசி பழுது", value: "car_ac_repair" },

  // Beauty & Wellness
  { en: "Hair Stylist", ta: "முடி அலங்காரம்", value: "hair_stylist" },
  { en: "Beautician", ta: "அழகு சாதனம்", value: "beautician" },
  { en: "Makeup Artist", ta: "மேக்அப் கலைஞர்", value: "makeup_artist" },
  { en: "Massage Therapy", ta: "மசாஜ் சிகிச்சை", value: "massage_therapy" },
  { en: "Spa Services", ta: "ஸ்பா சேவைகள்", value: "spa_services" },
  { en: "Nail Art", ta: "நக கலை", value: "nail_art" },

  // Education & Tutoring
  { en: "Tutoring", ta: "பயிற்சி", value: "tutoring" },
  { en: "Math Tutor", ta: "கணித பயிற்றுவிப்பாளர்", value: "math_tutor" },
  {
    en: "Science Tutor",
    ta: "அறிவியல் பயிற்றுவிப்பாளர்",
    value: "science_tutor",
  },
  {
    en: "English Tutor",
    ta: "ஆங்கில பயிற்றுவிப்பாளர்",
    value: "english_tutor",
  },
  { en: "Music Teacher", ta: "இசை ஆசிரியர்", value: "music_teacher" },
  { en: "Dance Teacher", ta: "நடன ஆசிரியர்", value: "dance_teacher" },
  {
    en: "Yoga Instructor",
    ta: "யோகா பயிற்றுவிப்பாளர்",
    value: "yoga_instructor",
  },
  {
    en: "Fitness Trainer",
    ta: "உடற்பயிற்சி பயிற்றுவிப்பாளர்",
    value: "fitness_trainer",
  },

  // IT & Electronics
  { en: "Computer Services", ta: "கணினி சேவைகள்", value: "computer_services" },
  { en: "Computer Repair", ta: "கணினி பழுது", value: "computer_repair" },
  { en: "Laptop Repair", ta: "லேப்டாப் பழுது", value: "laptop_repair" },
  { en: "Mobile Repair", ta: "மொபைல் பழுது", value: "mobile_repair" },
  { en: "Network Setup", ta: "நெட்வொர்க் அமைப்பு", value: "network_setup" },
  {
    en: "CCTV Installation",
    ta: "சிசிடிவி நிறுவுதல்",
    value: "cctv_installation",
  },
  {
    en: "Home Automation",
    ta: "வீட்டு தானியங்கி அமைப்பு",
    value: "home_automation",
  },
  {
    en: "Software Installation",
    ta: "மென்பொருள் நிறுவுதல்",
    value: "software_installation",
  },

  // Pest Control & Gardening
  { en: "Pest Control", ta: "பூச்சி கட்டுப்பாடு", value: "pest_control" },
  {
    en: "Termite Control",
    ta: "கறையான் கட்டுப்பாடு",
    value: "termite_control",
  },
  { en: "Gardening", ta: "தோட்டக்கலை", value: "gardening" },
  { en: "Landscaping", ta: "தோட்ட அமைப்பு", value: "landscaping" },
  {
    en: "Lawn Maintenance",
    ta: "புல்வெளி பராமரிப்பு",
    value: "lawn_maintenance",
  },
  { en: "Tree Services", ta: "மர சேவைகள்", value: "tree_services" },

  // Event Services
  { en: "Photographer", ta: "புகைப்படக் கலைஞர்", value: "photographer" },
  { en: "Videographer", ta: "காணொளி கலைஞர்", value: "videographer" },
  { en: "Catering", ta: "உணவு வழங்கல்", value: "catering" },
  {
    en: "Event Decoration",
    ta: "நிகழ்ச்சி அலங்காரம்",
    value: "event_decoration",
  },
  { en: "DJ Services", ta: "டிஜே சேவைகள்", value: "dj_services" },
  {
    en: "Wedding Planner",
    ta: "திருமண திட்டமிடுபவர்",
    value: "wedding_planner",
  },

  // Professional Services
  { en: "Legal Services", ta: "சட்ட சேவைகள்", value: "legal_services" },
  { en: "Accountant", ta: "கணக்காளர்", value: "accountant" },
  { en: "Tax Consultant", ta: "வரி ஆலோசகர்", value: "tax_consultant" },
  {
    en: "Interior Designer",
    ta: "உட்புற வடிவமைப்பாளர்",
    value: "interior_designer",
  },
  { en: "Architect", ta: "கட்டடக் கலைஞர்", value: "architect" },
  { en: "Tailor", ta: "தையல்காரர்", value: "tailor" },

  // Delivery & Transportation
  { en: "Packing & Moving", ta: "பேக்கிங் & நகரும்", value: "packing_moving" },
  { en: "Goods Delivery", ta: "பொருட்கள் விநியோகம்", value: "goods_delivery" },
  {
    en: "Transport Services",
    ta: "போக்குவரத்து சேவைகள்",
    value: "transport_services",
  },
  { en: "Driver Services", ta: "டிரைவர் சேவைகள்", value: "driver_services" },

  // Healthcare Services
  { en: "Nursing Care", ta: "சிகிச்சை பராமரிப்பு", value: "nursing_care" },
  { en: "Elderly Care", ta: "மூப்போர் பராமரிப்பு", value: "elderly_care" },
  { en: "Babysitter", ta: "குழந்தை பராமரிப்பு", value: "babysitter" },
  {
    en: "Physiotherapist",
    ta: "உடல் சிகிச்சை நிபுணர்",
    value: "physiotherapist",
  },
  { en: "Home Nurse", ta: "வீட்டுச் செவிலியர்", value: "home_nurse" },

  // Miscellaneous Services
  { en: "Salon at Home", ta: "வீட்டில் சலூன்", value: "salon_at_home" },
  { en: "Pet Care", ta: "செல்லப்பிராணி பராமரிப்பு", value: "pet_care" },
  { en: "Pet Grooming", ta: "செல்லப்பிராணி அலங்காரம்", value: "pet_grooming" },
  {
    en: "Solar Panel Services",
    ta: "சோலார் பேனல் சேவைகள்",
    value: "solar_panel_services",
  },
  {
    en: "Generator Services",
    ta: "ஜெனரேட்டர் சேவைகள்",
    value: "generator_services",
  },
  {
    en: "Water Motor Services",
    ta: "நீர் மோட்டார் சேவைகள்",
    value: "water_motor_services",
  },
  {
    en: "Gas Stove Repair",
    ta: "கேஸ் அடுப்பு பழுது",
    value: "gas_stove_repair",
  },
  { en: "Chimney Cleaning", ta: "சிம்னி சுத்தம்", value: "chimney_cleaning" },

  // Other
  { en: "Other Services", ta: "மற்ற சேவைகள்", value: "other_services" },
];

const URGENCY_OPTIONS = [
  { en: "1 hour", ta: "1 மணி நேரம்", value: "1h" },
  { en: "2 hours", ta: "2 மணி நேரம்", value: "2h" },
  { en: "1 day", ta: "1 நாள்", value: "1d" },
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

// Star Rating Component
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

  const textSize = {
    xs: "text-xs",
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
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
      <div className="flex items-center gap-1">
        {showText && (
          <span className={`ml-1 font-medium text-gray-800 ${textSize}`}>
            {rating.toFixed(1)}
          </span>
        )}
        {showReviews && totalReviews > 0 && (
          <span className={`text-gray-500 ${textSize}`}>({totalReviews})</span>
        )}
      </div>
    </div>
  );
};

// Provider Card Skeleton
const ProviderCardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse min-h-[360px] flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-28" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-20" />
    </div>
    <div className="space-y-3 mb-4 flex-grow">
      <div className="h-4 bg-gray-200 rounded w-32" />
      <div className="flex items-center gap-2">
        <div className="h-3 bg-gray-100 rounded w-4" />
        <div className="h-3 bg-gray-100 rounded w-24" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-36 mt-2" />
      <div className="h-3 bg-gray-100 rounded w-40 mt-2" />
    </div>
    <div className="h-10 bg-gray-200 rounded-xl" />
  </div>
);

// Reviews Modal Component
const ReviewsModal = ({
  provider,
  isOpen,
  onClose,
  lang,
}: {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}) => {
  if (!isOpen) return null;

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
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
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Overall Rating Summary */}
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
                        ? "Currently available for new requests"
                        : "தற்போது புதிய கோரிக்கைகளுக்கு கிடைக்கும்"
                      : lang === "en"
                      ? "Currently busy"
                      : "தற்போது பிஸியாக"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800 mb-2">
              {lang === "en" ? "Recent Reviews" : "சமீபத்திய மதிப்பீடுகள்"}
            </h4>

            {provider.reviews && provider.reviews.length > 0 ? (
              provider.reviews.map((review, index) => (
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
                    ? "This provider hasn't received any reviews yet. Be the first to leave a review after completing a service."
                    : "இந்த வழங்குநருக்கு இதுவரை மதிப்பீடுகள் கிடைக்கவில்லை. ஒரு சேவையை முடித்த பிறகு முதல் மதிப்பீட்டை வழங்குங்கள்."}
                </p>
              </div>
            )}

            {/* Reviews Stats */}
            {provider.reviews && provider.reviews.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {lang === "en"
                      ? "Showing all reviews"
                      : "அனைத்து மதிப்பீடுகளும் காட்டப்படுகின்றன"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {provider.reviews.length}{" "}
                    {lang === "en" ? "reviews" : "மதிப்பீடுகள்"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 font-medium text-sm transition-all shadow-sm hover:shadow"
          >
            {lang === "en" ? "Close Reviews" : "மதிப்பீடுகளை மூடு"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Availability Details Modal
const AvailabilityDetailsModal = ({
  provider,
  isOpen,
  onClose,
  lang,
}: {
  provider: Provider;
  isOpen: boolean;
  onClose: () => void;
  lang: string;
}) => {
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === "en"
                    ? "Availability Details"
                    : "கிடைக்கும் விவரங்கள்"}
                </h3>
                <p className="text-sm text-gray-600">{provider.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Availability Status Card */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-full ${
                    availability.isAvailable
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
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

          {/* Working Hours Card */}
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

          {/* Working Days Card */}
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

          {/* Service Preferences Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-gray-800">
                {lang === "en" ? "Service Preferences" : "சேவை விருப்பங்கள்"}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availability.serviceRadius && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">
                    {lang === "en" ? "Service Radius" : "சேவை ஆரம்"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {availability.serviceRadius} km
                  </p>
                </div>
              )}
              {availability.maxJobsPerDay && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">
                    {lang === "en" ? "Max Jobs/Day" : "அதிகபட்ச வேலைகள்/நாள்"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {availability.maxJobsPerDay}
                  </p>
                </div>
              )}
              {availability.advanceNotice && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">
                    {lang === "en" ? "Advance Notice" : "முன்னறிவிப்பு"}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {availability.advanceNotice}{" "}
                    {lang === "en" ? "hours" : "மணி நேரம்"}
                  </p>
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">
                  {lang === "en" ? "Instant Booking" : "உடனடி பதிவு"}
                </p>
                <p
                  className={`text-sm font-semibold ${
                    availability.instantBooking
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {availability.instantBooking
                    ? lang === "en"
                      ? "Available"
                      : "கிடைக்கும்"
                    : lang === "en"
                    ? "Not Available"
                    : "கிடைக்காது"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm transition-all shadow-sm hover:shadow"
          >
            {lang === "en" ? "Close Details" : "விவரங்களை மூடு"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Optimized function to calculate provider rating
const calculateProviderRatingFromJobs = async (
  providerId: string
): Promise<{ rating: number; completedJobs: number; totalReviews: number }> => {
  try {
    const providerRef = doc(db, "providers", providerId);
    const providerDoc = await getDoc(providerRef);

    if (providerDoc.exists()) {
      const providerData = providerDoc.data();

      // Try to get from existing data first (faster)
      if (providerData.averageRating !== undefined) {
        return {
          rating: parseFloat((providerData.averageRating || 0).toFixed(1)),
          completedJobs: providerData.completedJobs || 0,
          totalReviews: providerData.totalReviews || 0,
        };
      }

      // Fallback to job calculation
      const requestsRef = collection(db, "serviceRequests");
      const q = query(
        requestsRef,
        where("providerId", "==", providerId),
        where("status", "==", "completed"),
        where("seekerRating", ">", 0),
        limit(100)
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
    }

    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  } catch (error) {
    console.error("Error calculating provider rating:", error);
    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  }
};

// Function to load provider reviews
const loadProviderReviews = async (providerId: string): Promise<Review[]> => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "==", "completed"),
      where("seekerRating", ">", 0),
      limit(20) // Limit to recent 20 reviews for performance
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

    // Sort by date (newest first)
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

// Optimized function to load provider availability
const loadProviderAvailability = async (
  providerId: string
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

      const isAvailable = providerData.availability !== false;

      return {
        isAvailable,
        workingHours: { start: "09:00", end: "18:00" },
        workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        breakTime: { start: "13:00", end: "14:00" },
        serviceRadius: 10,
        instantBooking: true,
        advanceNotice: 2,
        maxJobsPerDay: 3,
      };
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

// Function to check if user has active request with provider
const checkIfHasActiveRequest = async (
  seekerId: string,
  providerId: string
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
        "accepted",
        "in_progress",
        "awaiting_confirmation",
      ])
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking active requests:", error);
    return false;
  }
};

// Main Component
export default function HomeSection() {
  const { lang } = useLanguage();
  const { user, userData } = useAuth();

  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [seekerAddress, setSeekerAddress] = useState<AddressData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [availabilityModalProvider, setAvailabilityModalProvider] =
    useState<Provider | null>(null);
  const [reviewsModalProvider, setReviewsModalProvider] =
    useState<Provider | null>(null); // Added reviews modal state

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  // Service search dropdown state
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [filteredServices, setFilteredServices] = useState(SERVICE_TYPES);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);

  // Request modal state
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(
    null
  );
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [serviceDescription, setServiceDescription] = useState("");
  const [urgency, setUrgency] = useState("2h");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Debug effect to check availability
  useEffect(() => {
    if (providers.length > 0) {
      console.log("=== AVAILABILITY DEBUG ===");
      console.log(`Total providers: ${providers.length}`);
      console.log(`Show only available: ${showOnlyAvailable}`);

      const availableCount = providers.filter(
        (p) => p.availability === true
      ).length;
      console.log(`Actually available: ${availableCount}`);
    }
  }, [providers, showOnlyAvailable]);

  // Listen for rating updates
  useEffect(() => {
    const handleRatingUpdate = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("rating-updated", handleRatingUpdate);
    return () =>
      window.removeEventListener("rating-updated", handleRatingUpdate);
  }, []);

  // Filter services based on search
  useEffect(() => {
    if (serviceSearch.trim() === "") {
      setFilteredServices(SERVICE_TYPES);
    } else {
      const query = serviceSearch.toLowerCase();
      const filtered = SERVICE_TYPES.filter(
        (service) =>
          service.en.toLowerCase().includes(query) ||
          service.ta.includes(query) ||
          service.value.toLowerCase().includes(query)
      );
      setFilteredServices(filtered);
    }
  }, [serviceSearch]);

  // Close service dropdown when clicking outside
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
            const address = {
              district: data.address.district,
              block: data.address.block || "",
              fullAddress: data.address.fullAddress,
            };
            setSeekerAddress(address);
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

  // Load providers with ratings, availability, and reviews
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

          // Process providers in batches for better performance
          const batchSize = 8;
          for (let i = 0; i < snapshot.docs.length; i += batchSize) {
            const batch = snapshot.docs.slice(i, i + batchSize);

            const batchPromises = batch.map(async (doc) => {
              const providerData = doc.data();
              const providerId = doc.id;

              // Check if user has active request with this provider
              const hasActiveRequest = await checkIfHasActiveRequest(
                user.uid,
                providerId
              );

              // Calculate rating, reviews, and availability in parallel
              const [calculatedRating, reviews, availabilitySettings] =
                await Promise.all([
                  calculateProviderRatingFromJobs(providerId),
                  loadProviderReviews(providerId),
                  loadProviderAvailability(providerId),
                ]);

              // Set availability correctly
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
                block: providerData.block || "", // Added block field
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
                reviews, // Added reviews
              } as Provider;
            });

            const batchResults = await Promise.all(batchPromises);
            providersData.push(...batchResults);
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
      }
    );

    return () => unsubscribe();
  }, [user?.uid, refreshKey]);

  // Function to refresh all providers
  const refreshAllProviders = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Filter providers - UPDATED to include block search
  const filteredProviders = useMemo(() => {
    let list = [...providers];

    if (selectedDistrict) {
      list = list.filter((p) => p.district === selectedDistrict);
    }

    if (selectedService) {
      list = list.filter((p) => p.serviceType === selectedService);
    }

    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating);
    }

    if (showOnlyAvailable) {
      list = list.filter((p) => p.availability === true);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.serviceType.toLowerCase().includes(query) ||
          p.district.toLowerCase().includes(query) ||
          p.block.toLowerCase().includes(query) || // Added block search
          SERVICE_TYPES.find(
            (s) =>
              s.value === p.serviceType &&
              (s.en.toLowerCase().includes(query) || s.ta.includes(query))
          )
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

  // Send request handler (with duplicate request prevention)
  const handleSendRequest = async () => {
    if (!selectedProvider || !user || !seekerAddress?.district) {
      alert(
        lang === "en"
          ? "Missing required information"
          : "தேவையான தகவல்கள் காணவில்லை"
      );
      return;
    }

    // Check if user already has active request with this provider
    if (selectedProvider.hasActiveRequest) {
      alert(
        lang === "en"
          ? "You already have an active request with this provider. Please wait for it to be completed or cancelled."
          : "உங்களிடம் ஏற்கனவே இந்த வழங்குநருடன் செயலில் உள்ள கோரிக்கை உள்ளது. அது முடிவடையும் வரை அல்லது ரத்து செய்யப்படும் வரை காத்திருக்கவும்."
      );
      return;
    }

    if (!serviceDescription.trim()) {
      alert(
        lang === "en"
          ? "Please describe your service needs"
          : "உங்கள் சேவை தேவைகளை விவரிக்கவும்"
      );
      return;
    }

    setSubmittingRequest(true);

    try {
      const expiresAt = new Date();
      if (urgency === "1h") expiresAt.setHours(expiresAt.getHours() + 1);
      if (urgency === "2h") expiresAt.setHours(expiresAt.getHours() + 2);
      if (urgency === "1d") expiresAt.setDate(expiresAt.getDate() + 1);

      const seekerName =
        userData?.name ||
        user.displayName ||
        (lang === "en" ? "Seeker" : "தேடுபவர்");

      const requestData = {
        seekerId: user.uid,
        seekerName,
        seekerEmail: user.email || "",
        providerId: selectedProvider.id,
        providerName: selectedProvider.name,
        serviceType: selectedProvider.serviceType,
        description: serviceDescription.trim(),
        district: seekerAddress.district,
        block: seekerAddress.block || "",
        urgency,
        status: "pending",
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
        seekerPhone: null,
        exactAddress: null,
        addressShared: false,
        providerPhone: null,
      };

      await addDoc(collection(db, "serviceRequests"), requestData);

      alert(
        lang === "en"
          ? "✅ Request sent successfully!"
          : "✅ கோரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது!"
      );

      setShowRequestModal(false);
      setSelectedProvider(null);
      setServiceDescription("");
      setUrgency("2h");

      // Update provider's hasActiveRequest status locally
      setProviders((prev) =>
        prev.map((p) =>
          p.id === selectedProvider.id ? { ...p, hasActiveRequest: true } : p
        )
      );
    } catch (err: any) {
      console.error("Error sending request:", err);
      alert(
        lang === "en"
          ? `Failed to send request: ${err.message}`
          : `கோரிக்கை அனுப்ப முடியவில்லை: ${err.message}`
      );
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedService("");
    setSelectedDistrict(seekerAddress?.district || "");
    setMinRating(0);
    setShowOnlyAvailable(true);
    setServiceSearch("");
  };

  // Get district name in current language
  const getDistrictName = useCallback(
    (districtEn: string) => {
      const district = DISTRICTS_TAMIL_NADU.find((d) => d.en === districtEn);
      return lang === "en" ? districtEn : district?.ta || districtEn;
    },
    [lang]
  );

  // Get service name in current language
  const getServiceName = useCallback(
    (serviceValue: string) => {
      const service = SERVICE_TYPES.find((s) => s.value === serviceValue);
      return service ? service[lang === "en" ? "en" : "ta"] : serviceValue;
    },
    [lang]
  );

  // Format availability time in 12-hour format
  const formatAvailabilityTime = useCallback((provider: Provider) => {
    if (!provider.availabilitySettings) return "";

    const { workingHours } = provider.availabilitySettings;
    return `${convertTo12Hour(workingHours.start)} - ${convertTo12Hour(
      workingHours.end
    )}`;
  }, []);

  // Handle availability details
  const handleShowAvailabilityDetails = (provider: Provider) => {
    setAvailabilityModalProvider(provider);
  };

  // Handle reviews details
  const handleShowReviews = (provider: Provider) => {
    setReviewsModalProvider(provider);
  };

  // Provider Card Component
  const ProviderCard = ({ provider }: { provider: Provider }) => {
    const canRequest =
      provider.availability &&
      seekerAddress?.district &&
      !provider.hasActiveRequest;

    // Check if provider has reviews
    const hasReviews = provider.reviews && provider.reviews.length > 0;
    const recentReview = hasReviews ? provider.reviews![0] : null;

    return (
      <div className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 flex flex-col h-full">
        {/* Provider Header */}
        <div className="p-5 pb-3 flex-1">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              {/* Profile Photo */}
              <div className="relative w-14 h-14 flex-shrink-0">
                {provider.photoLink ? (
                  <>
                    <div className="w-full h-full rounded-full overflow-hidden border-3 border-white shadow-lg">
                      <img
                        src={provider.photoLink}
                        alt={provider.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            const fallbackDiv = document.createElement("div");
                            fallbackDiv.className =
                              "w-full h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg";
                            fallbackDiv.textContent = provider.name
                              .charAt(0)
                              .toUpperCase();
                            parent.appendChild(fallbackDiv);
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center shadow-md">
                      <Camera className="w-2.5 h-2.5 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {provider.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-1">
                {/* Name */}
                <h4 className="font-bold text-gray-900 text-base mb-1.5 line-clamp-1">
                  {provider.name}
                </h4>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full whitespace-nowrap min-w-[80px]">
                    <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">
                      {lang === "en" ? "Verified" : "சரிபார்க்கப்பட்டது"}
                    </span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full whitespace-nowrap min-w-[80px] ${
                      provider.availability
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current flex-shrink-0"></span>
                    <span className="truncate">
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
                    <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full whitespace-nowrap min-w-[100px]">
                      <Check className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {lang === "en"
                          ? "Request Sent"
                          : "கோரிக்கை அனுப்பப்பட்டது"}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <div className="mb-4">
            {/* Service Type */}
            <div className="mb-4 min-h-[40px]">
              <span className="inline-flex items-center justify-center px-3 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 text-sm font-medium rounded-lg w-full line-clamp-2 h-full">
                {getServiceName(provider.serviceType)}
              </span>
            </div>

            {/* Location - UPDATED with block */}
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4 min-h-[24px]">
              <MapPin className="w-4 h-4 flex-shrink-0 text-gray-500" />
              <span className="truncate font-medium">
                {getDistrictName(provider.district)}
                {provider.block && (
                  <span className="text-gray-500">, {provider.block}</span>
                )}
              </span>
            </div>

            {/* Rating & Jobs */}
            <div className="mb-4 min-h-[60px]">
              <div className="flex items-center gap-2 mb-2">
                <StarRating
                  rating={provider.rating}
                  size="md"
                  showText={true}
                  showReviews={true}
                  totalReviews={provider.totalReviews}
                />
                {provider.totalReviews > 0 && (
                  <button
                    onClick={() => handleShowReviews(provider)}
                    className="ml-2 px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
                    title={
                      lang === "en" ? "View Reviews" : "மதிப்பீடுகளைக் காண்க"
                    }
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>
                      {provider.totalReviews}{" "}
                      {lang === "en" ? "reviews" : "மதிப்பீடுகள்"}
                    </span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                <span className="truncate">
                  {provider.completedJobs}{" "}
                  {lang === "en" ? "jobs completed" : "வேலைகள் முடிந்தன"}
                </span>
              </div>
            </div>

            {/* Recent Review Preview - NEW */}
            {recentReview && recentReview.comment && (
              <div className="pt-3 border-t border-gray-100 mb-4">
                <div className="flex items-start gap-2 text-xs">
                  <Quote className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <StarRating
                        rating={recentReview.rating}
                        size="xs"
                        showText={false}
                      />
                      <span className="text-gray-500 text-xs">
                        {recentReview.seekerName}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2 italic">
                      "
                      {recentReview.comment.length > 80
                        ? recentReview.comment.substring(0, 80) + "..."
                        : recentReview.comment}
                      "
                    </p>
                    <button
                      onClick={() => handleShowReviews(provider)}
                      className="mt-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                    >
                      {lang === "en"
                        ? "View all reviews"
                        : "அனைத்து மதிப்பீடுகளையும் காண்க"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Availability Summary */}
            {provider.availabilitySettings && (
              <div className="pt-3 border-t border-gray-100 space-y-2 min-h-[60px]">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span className="font-medium truncate leading-tight">
                    {formatAvailabilityTime(provider)}
                  </span>
                </div>
                {provider.availabilitySettings.serviceRadius && (
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate leading-tight">
                      {provider.availabilitySettings.serviceRadius} km{" "}
                      {lang === "en" ? "radius" : "ஆரம்"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-0 mt-auto">
          <div className="flex gap-2 min-h-[42px]">
            {/* Reviews Button */}
            {provider.totalReviews > 0 && (
              <button
                onClick={() => handleShowReviews(provider)}
                className="flex-1 py-2.5 border border-amber-300 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium flex items-center justify-center gap-2 transition hover:border-amber-400 px-2 min-w-[100px]"
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {lang === "en" ? "Reviews" : "மதிப்பீடுகள்"}
                </span>
              </button>
            )}

            {/* Details Button */}
            {provider.availabilitySettings && (
              <button
                onClick={() => handleShowAvailabilityDetails(provider)}
                className="flex-1 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2 transition hover:border-gray-400 px-2 min-w-[100px]"
              >
                <Eye className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">
                  {lang === "en" ? "Details" : "விவரங்கள்"}
                </span>
              </button>
            )}

            {/* Request Button */}
            <button
              onClick={() => {
                setSelectedProvider(provider);
                setShowRequestModal(true);
              }}
              disabled={!canRequest}
              className={`flex-1 py-2.5 rounded-lg font-medium text-sm transition-all px-2 min-w-[120px] ${
                canRequest
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              <span className="truncate block">
                {provider.hasActiveRequest
                  ? lang === "en"
                    ? "Request Sent"
                    : "கோரிக்கை அனுப்பப்பட்டது"
                  : !seekerAddress?.district
                  ? lang === "en"
                    ? "Set Address"
                    : "முகவரியை அமைக்கவும்"
                  : !provider.availability
                  ? lang === "en"
                    ? "Unavailable"
                    : "கிடைக்கவில்லை"
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl border border-blue-100 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Location Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex-shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {lang === "en"
                    ? "Find Service Providers"
                    : "சேவை வழங்குநர்களைக் கண்டறியவும்"}
                </h1>
                {seekerAddress?.district ? (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-gray-600 text-sm whitespace-nowrap">
                      {lang === "en" ? "Your location:" : "உங்கள் இடம்:"}
                    </span>
                    <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm font-medium rounded-full truncate max-w-[200px]">
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

          {/* Search Bar */}
          <div className="flex-1 max-w-lg min-w-[300px]">
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
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
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
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center gap-2 transition whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              {lang === "en" ? "Clear All" : "அனைத்தையும் அழி"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* District Filter */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
              {lang === "en" ? "District" : "மாவட்டம்"}
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white appearance-none truncate"
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

          {/* Service Type Filter */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
              {lang === "en" ? "Service Type" : "சேவை வகை"}
            </label>
            <div className="relative" ref={serviceDropdownRef}>
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
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <X className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      showServiceDropdown ? "rotate-180" : ""
                    }`}
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
                        autoFocus
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

          {/* Rating Filter */}
          <div className="min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2 whitespace-nowrap">
              {lang === "en" ? "Minimum Rating" : "குறைந்தபட்ச மதிப்பீடு"}
            </label>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white truncate"
            >
              {RATING_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[lang]}
                  {option.value > 0 && ` (${option.value}+)`}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex flex-col justify-end">
            <div className="flex items-center gap-3 h-12">
              <button
                type="button"
                onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                className="flex items-center gap-3 cursor-pointer select-none"
              >
                {/* Toggle Switch */}
                <div
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                    showOnlyAvailable ? "bg-green-500" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ${
                      showOnlyAvailable ? "translate-x-5" : "translate-x-1"
                    }`}
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

      {/* Results Info */}
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
            className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm flex items-center gap-2 hover:bg-blue-50 rounded-lg transition whitespace-nowrap flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            {lang === "en" ? "Refresh Results" : "முடிவுகளை புதுப்பிக்கவும்"}
          </button>
        )}
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {lang === "en"
              ? "Try adjusting your filters or search terms to find what you're looking for."
              : "நீங்கள் தேடுவதைக் கண்டுபிடிக்க உங்கள் வடிப்பான்கள் அல்லது தேடல் விதிமுறைகளை மாற்றவும்."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleResetFilters}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm shadow-sm hover:shadow transition whitespace-nowrap"
            >
              {lang === "en"
                ? "Reset All Filters"
                : "அனைத்து வடிப்பான்களையும் மீட்டமை"}
            </button>
          </div>
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

      {/* Reviews Modal */}
      {reviewsModalProvider && (
        <ReviewsModal
          provider={reviewsModalProvider}
          isOpen={!!reviewsModalProvider}
          onClose={() => setReviewsModalProvider(null)}
          lang={lang}
        />
      )}

      {/* Availability Details Modal */}
      {availabilityModalProvider && (
        <AvailabilityDetailsModal
          provider={availabilityModalProvider}
          isOpen={!!availabilityModalProvider}
          onClose={() => setAvailabilityModalProvider(null)}
          lang={lang}
        />
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {showRequestModal && selectedProvider && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowRequestModal(false);
              setServiceDescription("");
              setUrgency("2h");
            }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
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
                      setUrgency("2h");
                    }}
                    className="p-2 hover:bg-gray-100 rounded-xl transition flex-shrink-0"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Provider Info */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {selectedProvider.photoLink ? (
                        <div className="w-full h-full rounded-full overflow-hidden border-3 border-white shadow-lg">
                          <img
                            src={selectedProvider.photoLink}
                            alt={selectedProvider.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
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
                        {getServiceName(selectedProvider.serviceType)} •{" "}
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

                {/* Service Form */}
                <div className="space-y-5">
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 whitespace-nowrap">
                      {lang === "en" ? "Service Description" : "சேவை விளக்கம்"}{" "}
                      *
                    </label>
                    <textarea
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder={
                        lang === "en"
                          ? "Describe what you need in detail..."
                          : "உங்களுக்கு என்ன தேவை என விரிவாக விவரிக்கவும்..."
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[120px] resize-none"
                      rows={4}
                    />
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3 whitespace-nowrap">
                      {lang === "en" ? "Urgency" : "அவசரத்தன்மை"}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {URGENCY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setUrgency(option.value)}
                          className={`py-3 text-sm rounded-lg border transition-all min-h-[80px] ${
                            urgency === option.value
                              ? "border-blue-500 bg-blue-50 text-blue-700 font-medium ring-2 ring-blue-100"
                              : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium text-base truncate px-1">
                            {lang === "en" ? option.en : option.ta}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 truncate px-1">
                            {option.value === "1h"
                              ? lang === "en"
                                ? "Fast response"
                                : "விரைவான பதில்"
                              : option.value === "2h"
                              ? lang === "en"
                                ? "Standard"
                                : "நிலையான"
                              : lang === "en"
                              ? "Flexible"
                              : "நெகிழ்வான"}
                          </div>
                        </button>
                      ))}
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
                        setUrgency("2h");
                      }}
                      className="flex-1 py-3.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition min-w-[100px]"
                    >
                      {lang === "en" ? "Cancel" : "ரத்து செய்"}
                    </button>
                    <button
                      onClick={handleSendRequest}
                      disabled={submittingRequest || !serviceDescription.trim()}
                      className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 min-w-[120px]"
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
