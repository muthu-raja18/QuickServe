"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
} from "lucide-react";

// Types
interface Provider {
  id: string;
  name: string;
  email: string;
  serviceType: string;
  district: string;
  rating: number;
  completedJobs: number;
  availability: boolean;
  phone?: string;
  status: string;
  totalReviews?: number;
  profileImage?: string;
  _ratingRefreshKey?: number;
}

interface AddressData {
  district: string;
  block: string;
  fullAddress?: string;
}

// Updated Comprehensive Service Types with General & Specialized
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

// ALL 38 DISTRICTS OF TAMIL NADU IN ALPHABETICAL ORDER
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

// Star rating component
const StarRating = ({
  rating,
  size = "sm",
  showText = true,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
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
      {showText && (
        <span className="ml-1 text-sm font-medium text-gray-700">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Provider Card Skeleton
const ProviderCardSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-[220px] flex flex-col">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-20" />
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-16" />
    </div>
    <div className="space-y-2 mb-3 flex-grow">
      <div className="h-4 bg-gray-200 rounded w-28" />
      <div className="flex items-center gap-2">
        <div className="h-3 bg-gray-100 rounded w-4" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
      <div className="h-4 bg-gray-200 rounded w-32 mt-2" />
    </div>
    <div className="h-9 bg-gray-200 rounded-lg" />
  </div>
);

// ✅ NEW: Function to calculate provider rating from completed jobs (USES INDEX)
const calculateProviderRatingFromJobs = async (
  providerId: string
): Promise<{ rating: number; completedJobs: number; totalReviews: number }> => {
  try {
    console.log(`📊 Calculating rating for provider: ${providerId}`);

    // Query all completed jobs for this provider with ratings
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

    // Calculate average rating
    let averageRating = 0;
    if (ratedJobs.length > 0) {
      const totalRating = ratedJobs.reduce((sum, job) => sum + job.rating, 0);
      averageRating = totalRating / ratedJobs.length;
    }

    console.log(
      `📊 Result: ${averageRating.toFixed(
        1
      )} stars (${totalReviews} reviews, ${completedJobs} jobs)`
    );

    return {
      rating: parseFloat(averageRating.toFixed(1)),
      completedJobs,
      totalReviews,
    };
  } catch (error) {
    console.error("Error calculating provider rating from jobs:", error);

    // Fallback: Get from provider document
    try {
      const providerRef = doc(db, "providers", providerId);
      const providerDoc = await getDoc(providerRef);

      if (providerDoc.exists()) {
        const providerData = providerDoc.data();
        let rating = 0;
        let totalReviews = 0;
        let completedJobs = 0;

        // Check rating breakdown
        if (providerData.rating?.breakdown) {
          const breakdown = providerData.rating.breakdown;
          totalReviews =
            (breakdown[1] || 0) +
            (breakdown[2] || 0) +
            (breakdown[3] || 0) +
            (breakdown[4] || 0) +
            (breakdown[5] || 0);

          const totalScore =
            (breakdown[1] || 0) * 1 +
            (breakdown[2] || 0) * 2 +
            (breakdown[3] || 0) * 3 +
            (breakdown[4] || 0) * 4 +
            (breakdown[5] || 0) * 5;

          rating = totalReviews > 0 ? totalScore / totalReviews : 0;
          completedJobs = providerData.completedJobs || totalReviews;
        }
        // Check rating average
        else if (providerData.rating?.average) {
          rating = Number(providerData.rating.average) || 0;
          totalReviews = Number(providerData.rating.totalReviews) || 0;
          completedJobs = Number(providerData.completedJobs) || totalReviews;
        }

        console.log(
          `📊 Fallback result: ${rating.toFixed(
            1
          )} stars (${totalReviews} reviews)`
        );

        return {
          rating: parseFloat(rating.toFixed(1)),
          completedJobs,
          totalReviews,
        };
      }
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    }

    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  }
};

export default function HomeSection() {
  const { lang } = useLanguage();
  const { user, userData } = useAuth();

  // State
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAddress, setLoadingAddress] = useState(true);
  const [seekerAddress, setSeekerAddress] = useState<AddressData | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // ✅ Listen for rating updates
  useEffect(() => {
    const handleRatingUpdate = () => {
      console.log("📢 Rating update received in Seeker HomeSection");
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("rating-updated", handleRatingUpdate);

    return () => {
      window.removeEventListener("rating-updated", handleRatingUpdate);
    };
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

  // ✅ Load providers with CALCULATED ratings from completed jobs
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);

    const providersRef = collection(db, "providers");
    const q = query(providersRef, where("status", "==", "approved"));

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const providersData: Provider[] = [];

          // Process each provider to calculate their actual rating
          for (const d of snapshot.docs) {
            const providerData = d.data();
            const providerId = d.id;

            // ✅ CALCULATE rating from completed jobs
            const calculatedRating = await calculateProviderRatingFromJobs(
              providerId
            );

            const provider: Provider = {
              id: providerId,
              name: providerData.name || "",
              email: providerData.email || "",
              serviceType: providerData.serviceType || "",
              district: providerData.district || "",
              rating: calculatedRating.rating, // ✅ CALCULATED value
              completedJobs: calculatedRating.completedJobs, // ✅ ACTUAL count
              availability: providerData.availability !== false,
              phone: providerData.phone,
              status: providerData.status || "approved",
              totalReviews: calculatedRating.totalReviews, // ✅ ACTUAL reviews count
              profileImage: providerData.profileImage,
              _ratingRefreshKey: refreshKey,
            };

            providersData.push(provider);
          }

          // Sort by calculated rating (highest first)
          providersData.sort((a, b) => b.rating - a.rating);

          setProviders(providersData);
          setLoading(false);

          console.log(
            `✅ Loaded ${providersData.length} providers with CALCULATED ratings`
          );
          providersData.forEach((p) => {
            console.log(
              `   ${p.name}: ${p.rating} stars (${p.completedJobs} jobs, ${p.totalReviews} reviews)`
            );
          });
        } catch (error) {
          console.error("Error processing providers:", error);
          loadProvidersFallback();
        }
      },
      (error) => {
        console.error("Error in provider subscription:", error);
        loadProvidersFallback();
      }
    );

    return () => unsubscribe();
  }, [user?.uid, refreshKey]);

  // Fallback loading function
  const loadProvidersFallback = async () => {
    try {
      const providersRef = collection(db, "providers");
      const q = query(providersRef, where("status", "==", "approved"));
      const snap = await getDocs(q);

      const providersData: Provider[] = [];

      for (const d of snap.docs) {
        const providerData = d.data();
        const providerId = d.id;

        // Fallback: Get from provider document
        const providerRef = doc(db, "providers", providerId);
        const providerDoc = await getDoc(providerRef);

        let rating = 0;
        let totalReviews = 0;
        let completedJobs = 0;

        if (providerDoc.exists()) {
          const providerData = providerDoc.data();

          // Check rating breakdown
          if (providerData.rating?.breakdown) {
            const breakdown = providerData.rating.breakdown;
            totalReviews =
              (breakdown[1] || 0) +
              (breakdown[2] || 0) +
              (breakdown[3] || 0) +
              (breakdown[4] || 0) +
              (breakdown[5] || 0);

            const totalScore =
              (breakdown[1] || 0) * 1 +
              (breakdown[2] || 0) * 2 +
              (breakdown[3] || 0) * 3 +
              (breakdown[4] || 0) * 4 +
              (breakdown[5] || 0) * 5;

            rating = totalReviews > 0 ? totalScore / totalReviews : 0;
            completedJobs = providerData.completedJobs || totalReviews;
          }
        }

        const provider: Provider = {
          id: providerId,
          name: providerData.name || "",
          email: providerData.email || "",
          serviceType: providerData.serviceType || "",
          district: providerData.district || "",
          rating: rating,
          completedJobs: completedJobs,
          availability: providerData.availability !== false,
          phone: providerData.phone,
          status: providerData.status || "approved",
          totalReviews: totalReviews,
          profileImage: providerData.profileImage,
          _ratingRefreshKey: refreshKey,
        };

        providersData.push(provider);
      }

      providersData.sort((a, b) => b.rating - a.rating);
      setProviders(providersData);
    } catch (fallbackError) {
      console.error("Fallback also failed:", fallbackError);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh all providers
  const refreshAllProviders = () => {
    console.log("🔄 Manually refreshing all providers with calculated ratings");
    setRefreshKey((prev) => prev + 1);
  };

  // Filter providers
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
      list = list.filter((p) => p.availability);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.serviceType.toLowerCase().includes(query) ||
          p.district.toLowerCase().includes(query) ||
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

  // Send request handler
  const handleSendRequest = async () => {
    if (!selectedProvider || !user || !seekerAddress?.district) {
      alert(
        lang === "en"
          ? "Missing required information"
          : "தேவையான தகவல்கள் காணவில்லை"
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

      refreshAllProviders();
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
  const getDistrictName = (districtEn: string) => {
    const district = DISTRICTS_TAMIL_NADU.find((d) => d.en === districtEn);
    return lang === "en" ? districtEn : district?.ta || districtEn;
  };

  // Get service name in current language
  const getServiceName = (serviceValue: string) => {
    const service = SERVICE_TYPES.find((s) => s.value === serviceValue);
    return service ? service[lang === "en" ? "en" : "ta"] : serviceValue;
  };

  // Format completed jobs number
  const formatCompletedJobs = (jobs: number) => {
    if (jobs >= 1000) return `${(jobs / 1000).toFixed(1)}k`;
    return jobs.toString();
  };

  // Get selected service display name
  const getSelectedServiceDisplay = () => {
    if (!selectedService)
      return lang === "en" ? "All Services" : "அனைத்து சேவைகளும்";
    const service = SERVICE_TYPES.find((s) => s.value === selectedService);
    return service ? service[lang === "en" ? "en" : "ta"] : selectedService;
  };

  if (loadingAddress) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Location, Search, and Refresh */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Location Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                {lang === "en"
                  ? "Find Service Providers"
                  : "சேவை வழங்குநர்களைக் கண்டறியவும்"}
              </h1>
              <button
                onClick={refreshAllProviders}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition"
                title={
                  lang === "en"
                    ? "Refresh providers"
                    : "வழங்குநர்களைப் புதுப்பிக்கவும்"
                }
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-500 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>
            {seekerAddress?.district ? (
              <p className="text-sm text-gray-600">
                {lang === "en" ? "Your location:" : "உங்கள் இடம்:"}{" "}
                <span className="font-medium text-gray-800">
                  {getDistrictName(seekerAddress.district)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-red-600">
                {lang === "en"
                  ? "Please set your address in Profile section"
                  : "உங்கள் முகவரியை சுயவிவரப் பிரிவில் அமைக்கவும்"}
              </p>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={
                  lang === "en"
                    ? "Search providers by name, service, or district..."
                    : "பெயர், சேவை அல்லது மாவட்டத்தின் பெயரால் வழங்குநர்களைத் தேடுங்கள்..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            {lang === "en" ? "Filter Providers" : "வழங்குநர்களை வடிகட்டு"}
          </h2>
          <div className="flex items-center gap-2">
            {filteredProviders.length > 0 && !loading && (
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                {filteredProviders.length}{" "}
                {lang === "en" ? "providers" : "வழங்குநர்கள்"}
              </div>
            )}
            <button
              onClick={handleResetFilters}
              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1 px-2 py-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3" />
              {lang === "en" ? "Clear" : "அழி"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* District Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {lang === "en" ? "District" : "மாவட்டம்"}
              </label>
              <div className="relative">
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none bg-white"
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
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Service Type Filter - Updated with Searchable Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {lang === "en" ? "Service Type" : "சேவை வகை"}
              </label>
              <div className="relative" ref={serviceDropdownRef}>
                {/* Trigger Button */}
                <div
                  onClick={() => setShowServiceDropdown(!showServiceDropdown)}
                  className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between cursor-pointer transition-colors bg-white hover:border-blue-500 focus:border-blue-500 ${
                    showServiceDropdown
                      ? "border-blue-500 ring-1 ring-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  <span className="truncate">
                    {getSelectedServiceDisplay()}
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedService && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedService("");
                          setServiceSearch("");
                        }}
                        className="p-0.5 hover:bg-gray-100 rounded"
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

                {/* Dropdown Menu */}
                {showServiceDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b">
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

                    {/* Options List */}
                    <div className="overflow-y-auto max-h-48">
                      {filteredServices.length === 0 ? (
                        <div className="py-3 text-center text-gray-500 text-sm">
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
                              className={`px-3 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors ${
                                selectedService === service.value
                                  ? "bg-blue-50 text-blue-700 font-medium"
                                  : "text-gray-700"
                              }`}
                            >
                              <div className="font-medium">
                                {lang === "en" ? service.en : service.ta}
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {lang === "en" ? service.ta : service.en}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Option Count */}
                    <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
                      {filteredServices.length}{" "}
                      {lang === "en" ? "services" : "சேவைகள்"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                {lang === "en" ? "Minimum Rating" : "குறைந்தபட்ச மதிப்பீடு"}
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
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
              <div className="flex items-center gap-3 h-10">
                <input
                  type="checkbox"
                  id="available"
                  checked={showOnlyAvailable}
                  onChange={(e) => setShowOnlyAvailable(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="available"
                  className="text-sm text-gray-700 cursor-pointer whitespace-nowrap"
                >
                  {lang === "en" ? "Available now" : "தற்போது கிடைக்கும்"}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {lang === "en"
                ? "Loading providers..."
                : "வழங்குநர்களை ஏற்றுகிறது..."}
            </span>
          ) : (
            <>
              <span className="font-bold text-gray-900">
                {filteredProviders.length}
              </span>{" "}
              {lang === "en" ? "providers found" : "வழங்குநர்கள் கிடைத்தன"}
              {selectedDistrict && (
                <span className="text-gray-800 font-medium ml-1">
                  • {getDistrictName(selectedDistrict)}
                </span>
              )}
              {selectedService && (
                <span className="text-gray-800 font-medium ml-1">
                  • {getServiceName(selectedService)}
                </span>
              )}
            </>
          )}
        </p>
        {!loading && filteredProviders.length > 0 && (
          <button
            onClick={refreshAllProviders}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            {lang === "en" ? "Refresh" : "புதுப்பிக்கவும்"}
          </button>
        )}
      </div>

      {/* Providers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProviderCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {lang === "en"
              ? "No providers found"
              : "வழங்குநர்கள் கிடைக்கவில்லை"}
          </h3>
          <p className="text-gray-600 mb-4">
            {lang === "en"
              ? "Try adjusting your filters or search terms"
              : "உங்கள் வடிப்பான்கள் அல்லது தேடல் விதிமுறைகளை மாற்றவும்"}
          </p>
          <button
            onClick={handleResetFilters}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {lang === "en" ? "Reset Filters" : "வடிப்பான்களை மீட்டமை"}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => (
            <div
              key={`${provider.id}-${provider._ratingRefreshKey || 0}`}
              className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 flex flex-col h-full"
              style={{ minHeight: "220px" }}
            >
              <div className="p-4 flex-grow flex flex-col">
                {/* Provider Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {provider.profileImage ? (
                        <img
                          src={provider.profileImage}
                          alt={provider.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">
                        {provider.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">
                        {lang === "en" ? "Provider" : "வழங்குநர்"}
                      </p>
                    </div>
                  </div>
                  {provider.availability ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0">
                      {lang === "en" ? "Available" : "கிடைக்கும்"}
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full whitespace-nowrap flex-shrink-0">
                      {lang === "en" ? "Busy" : "பிஸியாக"}
                    </span>
                  )}
                </div>

                {/* Service Info */}
                <div className="mb-3 space-y-2 flex-grow">
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded">
                      {getServiceName(provider.serviceType)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {getDistrictName(provider.district)}
                      </span>
                    </div>
                  </div>

                  {/* Rating - Now shows CALCULATED rating from completed jobs */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <StarRating rating={provider.rating} size="md" />
                      {provider.totalReviews && provider.totalReviews > 0 && (
                        <span className="text-xs text-gray-500">
                          ({provider.totalReviews})
                        </span>
                      )}
                    </div>

                    {/* Completed Jobs - Now shows ACTUAL count */}
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Briefcase className="w-3 h-3" />
                      <span>
                        {formatCompletedJobs(provider.completedJobs)}{" "}
                        {lang === "en" ? "jobs" : "வேலைகள்"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Request Button */}
                <button
                  onClick={() => {
                    setSelectedProvider(provider);
                    setShowRequestModal(true);
                  }}
                  disabled={!provider.availability || !seekerAddress?.district}
                  className={`w-full py-2.5 rounded-lg font-medium text-sm transition ${
                    provider.availability && seekerAddress?.district
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {!seekerAddress?.district
                    ? lang === "en"
                      ? "Set Address First"
                      : "முதலில் முகவரியை அமைக்கவும்"
                    : provider.availability
                    ? lang === "en"
                      ? "Request Service"
                      : "சேவையைக் கோருங்கள்"
                    : lang === "en"
                    ? "Unavailable"
                    : "கிடைக்கவில்லை"}
                </button>
              </div>
            </div>
          ))}
        </div>
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
              className="bg-white rounded-xl w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === "en" ? "Request Service" : "சேவையைக் கோருங்கள்"}
                </h3>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setServiceDescription("");
                    setUrgency("2h");
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Provider Info */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border">
                    {selectedProvider.profileImage ? (
                      <img
                        src={selectedProvider.profileImage}
                        alt={selectedProvider.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {selectedProvider.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {getServiceName(selectedProvider.serviceType)} •{" "}
                      {getDistrictName(selectedProvider.district)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <StarRating rating={selectedProvider.rating} size="sm" />
                      <span className="text-xs text-gray-500">
                        ({selectedProvider.totalReviews || 0}{" "}
                        {lang === "en" ? "reviews" : "மதிப்பீடுகள்"})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Service Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Service Description" : "சேவை விளக்கம்"} *
                  </label>
                  <textarea
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "Describe what you need in detail..."
                        : "உங்களுக்கு என்ன தேவை என விரிவாக விவரிக்கவும்..."
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[120px]"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === "en"
                      ? "Be specific about your requirements"
                      : "உங்கள் தேவைகளை குறிப்பிட்டு விவரிக்கவும்"}
                  </p>
                </div>

                {/* Urgency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Urgency" : "அவசரத்தன்மை"}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {URGENCY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setUrgency(option.value)}
                        className={`py-2 text-sm rounded-lg border transition-colors ${
                          urgency === option.value
                            ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                            : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                      >
                        <div className="font-medium">
                          {lang === "en" ? option.en : option.ta}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
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
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">
                        {lang === "en"
                          ? "Privacy Protected"
                          : "தனியுரிமை பாதுகாக்கப்பட்டது"}
                      </p>
                      <p className="text-xs text-gray-600">
                        {lang === "en"
                          ? "Your phone and address will be shared only after the provider accepts your request."
                          : "வழங்குநர் உங்கள் கோரிக்கையை ஏற்றுக்கொண்ட பிறகே உங்கள் தொலைபேசி மற்றும் முகவரி பகிரப்படும்."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRequestModal(false);
                      setServiceDescription("");
                      setUrgency("2h");
                    }}
                    className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                  >
                    {lang === "en" ? "Cancel" : "ரத்து செய்"}
                  </button>
                  <button
                    onClick={handleSendRequest}
                    disabled={submittingRequest || !serviceDescription.trim()}
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {submittingRequest ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {lang === "en" ? "Sending..." : "அனுப்புகிறது..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        {lang === "en" ? "Send Request" : "கோரிக்கையை அனுப்பு"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
