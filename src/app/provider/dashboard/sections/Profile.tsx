"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Edit,
  Save,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Star,
  Shield,
  Link,
  Eye,
  Camera,
  FileText,
  ExternalLink,
  XCircle,
  Download,
  Info,
  DollarSign,
} from "lucide-react";

import { db } from "../../../firebase/config";
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Tamil Nadu districts
const TAMIL_NADU_DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

// Service types
const SERVICE_TYPES = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Cleaning",
  "Painting",
  "Mechanic",
  "AC Repair",
  "Pest Control",
  "Gardening",
  "Home Repair",
  "Appliance Repair",
  "Construction",
  "Beauty Services",
  "Catering",
  "Transport",
  "Tutoring",
  "Healthcare",
  "Event Management",
  "IT Services",
  "Other",
];

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  district: string;
  block: string;
  experience: string;
  photoLink: string;
  proofLink: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  rating?: { average: number; totalReviews: number };
  description?: string;
  pricing?: string;
}

// Rating calculation function
const calculateProviderRatingFromJobs = async (
  providerId: string,
): Promise<{ rating: number; completedJobs: number; totalReviews: number }> => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "==", "completed"),
      where("seekerRating", ">", 0),
    );
    const snapshot = await getDocs(q);
    const completedJobs = snapshot.size;
    let totalRating = 0;
    snapshot.docs.forEach((doc) => {
      totalRating += doc.data().seekerRating || 0;
    });
    const averageRating = completedJobs > 0 ? totalRating / completedJobs : 0;
    return {
      rating: parseFloat(averageRating.toFixed(1)),
      completedJobs,
      totalReviews: completedJobs,
    };
  } catch (error) {
    console.error("Error calculating provider rating:", error);
    return { rating: 0, completedJobs: 0, totalReviews: 0 };
  }
};

// Helper function to safely convert to Date
const safeToDate = (value: any): Date => {
  try {
    if (!value) return new Date();
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value === "string") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date() : date;
    }
    if (value instanceof Date) return value;
    if (typeof value === "number") return new Date(value);
    return new Date();
  } catch {
    return new Date();
  }
};

// Star Rating Component
const StarRating = ({
  rating,
  size = "md",
  showNumber = true,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
}) => {
  const starSize =
    size === "lg" ? "w-6 h-6" : size === "md" ? "w-5 h-5" : "w-4 h-4";
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
      {showNumber && (
        <span className="ml-2 font-semibold text-gray-800">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

// Bilingual texts
const TEXTS = {
  en: {
    profileSettings: "Profile Settings",
    profileDesc: "Manage your personal and professional information",
    editProfile: "Edit Profile",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    saving: "Saving...",
    profileUpdated: "Profile updated successfully!",
    errorLoading: "Failed to load profile data",
    errorSaving: "Failed to save changes. Please try again.",
    personalInfo: "Personal Information",
    professionalInfo: "Professional Information",
    verificationDocs: "Verification Documents",
    customerRatings: "Customer Ratings",
    fullName: "Full Name",
    enterName: "Enter your full name",
    emailAddress: "Email Address",
    phoneNumber: "Phone Number",
    yearsExperience: "Years of Experience",
    selectExperience: "Select experience",
    serviceType: "Service Type",
    selectService: "Select service type",
    district: "District",
    selectDistrict: "Select District",
    blockArea: "Block/Area",
    blockPlaceholder: "e.g., Anna Nagar, T Nagar",
    profilePhoto: "Profile Photo",
    proofDocument: "Proof Document",
    notSet: "Not set",
    notSpecified: "Not specified",
    notProvided: "Not provided",
    memberSince: "Member since",
    verified: "Verified",
    pendingApproval: "Pending Approval",
    averageRating: "Average Rating",
    reviews: "reviews",
    approved: "Approved",
    lessThan1Year: "Less than 1 year",
    oneToThree: "1-3 years",
    threeToFive: "3-5 years",
    fiveToTen: "5-10 years",
    tenPlus: "10+ years",
    viewPhoto: "View Photo",
    viewDocument: "View Document",
    zoom: "Zoom",
    close: "Close",
    download: "Download",
    openNewTab: "Open in new tab",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    rotate: "Rotate",
    fullscreen: "Fullscreen",
    documentPreview: "Document Preview",
    photoPreview: "Photo Preview",
    provider: "Provider",
    backToProfile: "Back to Profile",
    aboutMe: "About Me & Services",
    aboutMeDesc: "Describe your services and pricing information",
    description: "Service Description",
    descriptionPlaceholder:
      "Describe your services, expertise, and what makes you unique...",
    pricing: "Pricing Information",
    pricingPlaceholder:
      "e.g., ₹300-500 per visit, ₹200 per hour, Call for quote...",
    noDescription: "No description provided",
    noPricing: "No pricing information provided",
    charLimit: (limit: number) => `Max ${limit} characters`,
    remaining: (count: number) => `${count} characters remaining`,
  },
  ta: {
    profileSettings: "சுயவிவர அமைப்புகள்",
    profileDesc: "உங்கள் தனிப்பட்ட மற்றும் தொழில்முறை தகவல்களை நிர்வகிக்கவும்",
    editProfile: "சுயவிவரத்தைத் திருத்து",
    cancel: "ரத்து செய்",
    saveChanges: "மாற்றங்களை சேமிக்கவும்",
    saving: "சேமிக்கிறது...",
    profileUpdated: "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!",
    errorLoading: "சுயவிவர தரவை ஏற்ற முடியவில்லை",
    errorSaving: "மாற்றங்களை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    personalInfo: "தனிப்பட்ட தகவல்",
    professionalInfo: "தொழில்முறை தகவல்",
    verificationDocs: "சரிபார்ப்பு ஆவணங்கள்",
    customerRatings: "வாடிக்கையாளர் மதிப்பீடுகள்",
    fullName: "முழு பெயர்",
    enterName: "உங்கள் முழு பெயரை உள்ளிடவும்",
    emailAddress: "மின்னஞ்சல் முகவரி",
    phoneNumber: "தொலைபேசி எண்",
    yearsExperience: "அனுபவ ஆண்டுகள்",
    selectExperience: "அனுபவத்தைத் தேர்ந்தெடுக்கவும்",
    serviceType: "சேவை வகை",
    selectService: "சேவை வகையைத் தேர்ந்தெடுக்கவும்",
    district: "மாவட்டம்",
    selectDistrict: "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
    blockArea: "பகுதி",
    blockPlaceholder: "எ.கா., அண்ணா நகர், டி. நகர்",
    profilePhoto: "சுயபடம்",
    proofDocument: "ஆவண சான்று",
    notSet: "அமைக்கப்படவில்லை",
    notSpecified: "குறிப்பிடப்படவில்லை",
    notProvided: "வழங்கப்படவில்லை",
    memberSince: "உறுப்பினராக இருந்து",
    verified: "சரிபார்க்கப்பட்டது",
    pendingApproval: "ஒப்புதலுக்காக காத்திருக்கிறது",
    averageRating: "சராசரி மதிப்பீடு",
    reviews: "மதிப்பீடுகள்",
    approved: "அங்கீகரிக்கப்பட்டது",
    lessThan1Year: "1 வருடத்திற்கும் குறைவாக",
    oneToThree: "1-3 ஆண்டுகள்",
    threeToFive: "3-5 ஆண்டுகள்",
    fiveToTen: "5-10 ஆண்டுகள்",
    tenPlus: "10+ ஆண்டுகள்",
    viewPhoto: "புகைப்படத்தைக் காண்க",
    viewDocument: "ஆவணத்தைக் காண்க",
    zoom: "பெரிதாக்கு",
    close: "மூடு",
    download: "பதிவிறக்கம்",
    openNewTab: "புதிய தாவலில் திறக்கவும்",
    zoomIn: "பெரிதாக்கு",
    zoomOut: "சிறிதாக்கு",
    rotate: "சுழற்று",
    fullscreen: "முழுத்திரை",
    documentPreview: "ஆவண முன்னோட்டம்",
    photoPreview: "புகைப்பட முன்னோட்டம்",
    provider: "வழங்குநர்",
    backToProfile: "சுயவிவரத்திற்குத் திரும்புக",
    aboutMe: "என்னைப் பற்றி & சேவைகள்",
    aboutMeDesc: "உங்கள் சேவைகள் மற்றும் விலை தகவல்களை விவரிக்கவும்",
    description: "சேவை விளக்கம்",
    descriptionPlaceholder:
      "உங்கள் சேவைகள், நிபுணத்துவம் மற்றும் உங்களை தனித்துவமாக்குவது பற்றி விவரிக்கவும்...",
    pricing: "விலை தகவல்",
    pricingPlaceholder:
      "எ.கா., ஒரு விஜயத்திற்கு ₹300-500, ஒரு மணி நேரத்திற்கு ₹200, மேலும் தகவலுக்கு அழைக்கவும்...",
    noDescription: "விளக்கம் எதுவும் வழங்கப்படவில்லை",
    noPricing: "விலை தகவல் எதுவும் வழங்கப்படவில்லை",
    charLimit: (limit: number) => `அதிகபட்சம் ${limit} எழுத்துக்கள்`,
    remaining: (count: number) => `${count} எழுத்துக்கள் மீதமுள்ளன`,
  },
};

// Character limits
const DESCRIPTION_LIMIT = 500;
const PRICING_LIMIT = 200;

// View Modal Component (unchanged)
const ViewModal = ({
  isOpen,
  type,
  url,
  title,
  providerName,
  onClose,
  lang = "en",
}: any) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.en;
  const isPDF = url?.toLowerCase().endsWith(".pdf");

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setRotation((prev) => (prev + 90) % 360);
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h3 className="font-bold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">
                {t.provider}: {providerName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {type === "photo" && (
              <>
                <button
                  onClick={zoomOut}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={zoomIn}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Eye className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={rotate}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg
                    className="w-5 h-5 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ExternalLink className="w-5 h-5 text-gray-600" />
            </button>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
            <a
              href={url}
              download
              className="p-2 hover:bg-green-50 text-green-600 rounded-lg"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="flex items-center justify-center h-full min-h-[400px]">
            {type === "photo" ? (
              <img
                src={url}
                alt={title}
                className="rounded-lg shadow-lg"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transition: "transform 0.2s ease",
                  maxWidth: "100%",
                  maxHeight: "calc(90vh - 120px)",
                  objectFit: "contain",
                }}
              />
            ) : isPDF ? (
              <iframe
                src={`${url}#toolbar=0`}
                className="w-full h-full rounded-lg border"
                title={title}
                style={{ minHeight: "500px" }}
              />
            ) : (
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
              />
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between">
          <div className="text-sm text-gray-600">
            {type === "photo" && (
              <>
                <span>
                  {t.zoom}: {Math.round(scale * 100)}%
                </span>
                <span className="ml-4">
                  {t.rotate}: {rotation}°
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg"
          >
            {t.backToProfile}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ProfileSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.en;

  const [profile, setProfile] = useState<ProfileData>({
    name: "",
    email: "",
    phone: "",
    serviceType: "",
    district: "",
    block: "",
    experience: "",
    photoLink: "",
    proofLink: "",
    status: "",
    emailVerified: false,
    phoneVerified: false,
    createdAt: new Date(),
    rating: { average: 0, totalReviews: 0 },
    description: "",
    pricing: "",
  });
  const [calculatedRating, setCalculatedRating] = useState({
    rating: 0,
    completedJobs: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    type: "photo" as "photo" | "document",
    url: "",
    title: "",
  });

  const openViewModal = (type: "photo" | "document", url: string) =>
    setViewModal({
      isOpen: true,
      type,
      url,
      title: type === "photo" ? t.photoPreview : t.documentPreview,
    });
  const closeViewModal = () =>
    setViewModal({ isOpen: false, type: "photo", url: "", title: "" });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    const loadProfile = async () => {
      try {
        setLoading(true);
        const [providerDoc, ratingData] = await Promise.all([
          getDoc(doc(db, "providers", user.uid)),
          calculateProviderRatingFromJobs(user.uid),
        ]);
        setCalculatedRating(ratingData);
        if (providerDoc.exists()) {
          const data = providerDoc.data();
          setProfile({
            name: data.name || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            serviceType: data.serviceType || "",
            district: data.district || "",
            block: data.block || "",
            experience: data.experience || "",
            photoLink: data.photoLink || "",
            proofLink: data.proofLink || "",
            status: data.status || "pending",
            emailVerified: data.emailVerified || false,
            phoneVerified: data.phoneVerified || false,
            createdAt: safeToDate(data.createdAt),
            rating: {
              average: ratingData.rating,
              totalReviews: ratingData.totalReviews,
            },
            description: data.description || "",
            pricing: data.pricing || "",
          });
        }
      } catch (err) {
        console.error(err);
        setError(t.errorLoading);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user?.uid, lang]);

  const handleSave = async () => {
    if (!user?.uid) return;
    try {
      setSaving(true);
      await updateDoc(doc(db, "providers", user.uid), {
        name: profile.name,
        phone: profile.phone,
        serviceType: profile.serviceType,
        district: profile.district,
        block: profile.block,
        experience: profile.experience,
        description: profile.description,
        pricing: profile.pricing,
        updatedAt: new Date(),
      });
      setSuccess(t.profileUpdated);
      setEditing(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    setEditing(false);
    if (!user?.uid) return;
    try {
      const providerDoc = await getDoc(doc(db, "providers", user.uid));
      if (providerDoc.exists()) {
        const data = providerDoc.data();
        setProfile((prev) => ({
          ...prev,
          name: data.name || "",
          phone: data.phone || "",
          serviceType: data.serviceType || "",
          district: data.district || "",
          block: data.block || "",
          experience: data.experience || "",
          description: data.description || "",
          pricing: data.pricing || "",
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const experienceOptions = [
    { value: "Less than 1 year", label: t.lessThan1Year },
    { value: "1-3 years", label: t.oneToThree },
    { value: "3-5 years", label: t.threeToFive },
    { value: "5-10 years", label: t.fiveToTen },
    { value: "10+ years", label: t.tenPlus },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-100 rounded-lg animate-pulse"
                ></div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  // Character remaining helpers
  const descRemaining = DESCRIPTION_LIMIT - (profile.description?.length || 0);
  const pricingRemaining = PRICING_LIMIT - (profile.pricing?.length || 0);

  return (
    <div className="space-y-6">
      {/* Header with Edit/Save at top right */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {t.profileSettings}
          </h2>
          <p className="text-gray-600 mt-1">{t.profileDesc}</p>
        </div>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition flex items-center gap-2"
          >
            <Edit className="w-4 h-4" />
            {t.editProfile}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 border border-gray-300"
            >
              <X className="w-4 h-4" />
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? t.saving : t.saveChanges}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Profile Header (unchanged) */}
        <div className="flex items-start gap-4 pb-6 mb-6 border-b border-gray-200">
          <div className="relative group">
            {profile.photoLink ? (
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={profile.photoLink}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => openViewModal("photo", profile.photoLink)}
                    className="p-2 bg-white/90 rounded-full"
                  >
                    <Eye className="w-5 h-5 text-gray-800" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            {profile.photoLink && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 shadow-lg">
                <Camera className="w-4 h-4" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-800 truncate">
                {profile.name || t.notSet}
              </h3>
              {profile.status === "approved" ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {t.approved}
                </span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {profile.status === "pending"
                    ? t.pendingApproval
                    : profile.status}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {profile.serviceType || t.notSet}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {profile.district || t.notSet}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t.memberSince} {formatDate(profile.createdAt)}
              </span>
            </div>
            {calculatedRating.totalReviews > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <StarRating rating={calculatedRating.rating} size="md" />
                <span className="text-sm text-gray-600">
                  ({calculatedRating.totalReviews} {t.reviews})
                </span>
                <span className="text-sm text-gray-500">
                  • {calculatedRating.completedJobs}{" "}
                  {lang === "en" ? "jobs completed" : "வேலைகள் முடிக்கப்பட்டன"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Two Column Grid - Personal & Professional Info (unchanged) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
          {/* Personal Information Column */}
          <div>
            <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 pb-2 border-b border-gray-200 mb-4">
              <User className="w-5 h-5 text-teal-600" />
              {t.personalInfo}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.fullName}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile({ ...profile, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder={t.enterName}
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span
                      className={
                        !profile.name ? "text-gray-400 italic" : "text-gray-800"
                      }
                    >
                      {profile.name || t.notSet}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.emailAddress}
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-800">{profile.email}</span>
                    {profile.emailVerified && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {t.verified}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.phoneNumber}
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="+91 9876543210"
                    maxLength={10}
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          !profile.phone
                            ? "text-gray-400 italic"
                            : "text-gray-800"
                        }
                      >
                        {profile.phone || t.notSet}
                      </span>
                      {profile.phoneVerified && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {t.verified}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.yearsExperience}
                </label>
                {editing ? (
                  <select
                    value={profile.experience}
                    onChange={(e) =>
                      setProfile({ ...profile, experience: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{t.selectExperience}</option>
                    {experienceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span
                      className={
                        !profile.experience
                          ? "text-gray-400 italic"
                          : "text-gray-800"
                      }
                    >
                      {profile.experience || t.notSpecified}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information Column */}
          <div>
            <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 pb-2 border-b border-gray-200 mb-4">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {t.professionalInfo}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.serviceType}
                </label>
                {editing ? (
                  <select
                    value={profile.serviceType}
                    onChange={(e) =>
                      setProfile({ ...profile, serviceType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{t.selectService}</option>
                    {SERVICE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span
                      className={
                        !profile.serviceType
                          ? "text-gray-400 italic"
                          : "text-gray-800"
                      }
                    >
                      {profile.serviceType || t.notSet}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.district}
                </label>
                {editing ? (
                  <select
                    value={profile.district}
                    onChange={(e) =>
                      setProfile({ ...profile, district: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="">{t.selectDistrict}</option>
                    {TAMIL_NADU_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span
                      className={
                        !profile.district
                          ? "text-gray-400 italic"
                          : "text-gray-800"
                      }
                    >
                      {profile.district || t.notSet}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.blockArea}
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={profile.block}
                    onChange={(e) =>
                      setProfile({ ...profile, block: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder={t.blockPlaceholder}
                  />
                ) : (
                  <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                    <span
                      className={
                        !profile.block
                          ? "text-gray-400 italic"
                          : "text-gray-800"
                      }
                    >
                      {profile.block || t.notSet}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  {t.verificationDocs}
                </h5>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t.profilePhoto}
                    </p>
                    {profile.photoLink ? (
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 truncate text-sm text-blue-600">
                          {profile.photoLink.length > 40
                            ? profile.photoLink.substring(0, 40) + "..."
                            : profile.photoLink}
                        </div>
                        <button
                          onClick={() =>
                            openViewModal("photo", profile.photoLink)
                          }
                          className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400 italic text-sm">
                        {t.notProvided}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      {t.proofDocument}
                    </p>
                    {profile.proofLink ? (
                      <div className="flex gap-2">
                        <div className="flex-1 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100 truncate text-sm text-blue-600">
                          {profile.proofLink.length > 40
                            ? profile.proofLink.substring(0, 40) + "..."
                            : profile.proofLink}
                        </div>
                        <button
                          onClick={() =>
                            openViewModal("document", profile.proofLink)
                          }
                          className="px-3 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 text-gray-400 italic text-sm">
                        {t.notProvided}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About Me Section - Full Width with character limits */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 pb-2 border-b border-gray-200 mb-4">
            <Info className="w-5 h-5 text-purple-600" />
            {t.aboutMe}
          </h4>
          <p className="text-sm text-gray-500 mb-4">{t.aboutMeDesc}</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.description}
                {editing && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({t.charLimit(DESCRIPTION_LIMIT)})
                  </span>
                )}
              </label>
              {editing ? (
                <>
                  <textarea
                    value={profile.description}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= DESCRIPTION_LIMIT) {
                        setProfile({ ...profile, description: value });
                      }
                    }}
                    rows={4}
                    maxLength={DESCRIPTION_LIMIT}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder={t.descriptionPlaceholder}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {t.remaining(descRemaining)}
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]">
                  {profile.description ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {profile.description}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">{t.noDescription}</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.pricing}
                {editing && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({t.charLimit(PRICING_LIMIT)})
                  </span>
                )}
              </label>
              {editing ? (
                <>
                  <textarea
                    value={profile.pricing}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= PRICING_LIMIT) {
                        setProfile({ ...profile, pricing: value });
                      }
                    }}
                    rows={2}
                    maxLength={PRICING_LIMIT}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                    placeholder={t.pricingPlaceholder}
                  />
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {t.remaining(pricingRemaining)}
                  </div>
                </>
              ) : (
                <div className="px-4 py-3 bg-green-50 rounded-lg border border-green-200">
                  {profile.pricing ? (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {profile.pricing}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-400 italic">{t.noPricing}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rating Section (unchanged) */}
        {calculatedRating.totalReviews > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {t.customerRatings}
            </h4>
            <div className="flex flex-col md:flex-row md:items-center gap-6 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 rounded-xl border border-amber-100">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">
                  {calculatedRating.rating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t.averageRating}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-2">
                  <StarRating rating={calculatedRating.rating} size="lg" />
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">
                      {calculatedRating.totalReviews}
                    </span>{" "}
                    {t.reviews}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {calculatedRating.completedJobs}
                    </span>{" "}
                    {lang === "en"
                      ? "jobs completed"
                      : "வேலைகள் முடிக்கப்பட்டன"}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-3">
                  {lang === "en"
                    ? "Based on actual service completion and customer feedback"
                    : "உண்மையான சேவை நிறைவு மற்றும் வாடிக்கையாளர் கருத்துகளின் அடிப்படையில்"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <ViewModal
        isOpen={viewModal.isOpen}
        type={viewModal.type}
        url={viewModal.url}
        title={viewModal.title}
        providerName={profile.name}
        onClose={closeViewModal}
        lang={lang}
      />
    </div>
  );
}
