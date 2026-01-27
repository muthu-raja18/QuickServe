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
  rating?: {
    average: number;
    totalReviews: number;
  };
}

// ✅ FIXED: Rating calculation function (SAME as HomeSection)
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

// Helper function to safely convert to Date
const safeToDate = (value: any): Date => {
  try {
    if (!value) return new Date();

    if (typeof value.toDate === "function") {
      return value.toDate();
    }

    if (typeof value === "string") {
      const date = new Date(value);
      return isNaN(date.getTime()) ? new Date() : date;
    }

    if (value instanceof Date) {
      return value;
    }

    if (typeof value === "number") {
      return new Date(value);
    }

    return new Date();
  } catch (error) {
    console.error("Error converting to date:", value, error);
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
    profilePhoto: "Profile Photo Link",
    proofDocument: "Proof Document Link",
    notSet: "Not set",
    notSpecified: "Not specified",
    notProvided: "Not provided",
    memberSince: "Member since",
    verified: "Verified",
    pendingApproval: "Pending Approval",
    averageRating: "Average Rating",
    reviews: "reviews",
    totalReviews: "total reviews",
    approved: "Approved",
    lessThan1Year: "Less than 1 year",
    oneToThree: "1-3 years",
    threeToFive: "3-5 years",
    fiveToTen: "5-10 years",
    tenPlus: "10+ years",
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
    profilePhoto: "சுயபட இணைப்பு",
    proofDocument: "ஆவண சான்று இணைப்பு",
    notSet: "அமைக்கப்படவில்லை",
    notSpecified: "குறிப்பிடப்படவில்லை",
    notProvided: "வழங்கப்படவில்லை",
    memberSince: "உறுப்பினராக இருந்து",
    verified: "சரிபார்க்கப்பட்டது",
    pendingApproval: "ஒப்புதலுக்காக காத்திருக்கிறது",
    averageRating: "சராசரி மதிப்பீடு",
    reviews: "மதிப்பீடுகள்",
    totalReviews: "மொத்த மதிப்பீடுகள்",
    approved: "அங்கீகரிக்கப்பட்டது",
    lessThan1Year: "1 வருடத்திற்கும் குறைவாக",
    oneToThree: "1-3 ஆண்டுகள்",
    threeToFive: "3-5 ஆண்டுகள்",
    fiveToTen: "5-10 ஆண்டுகள்",
    tenPlus: "10+ ஆண்டுகள்",
  },
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
    rating: {
      average: 0,
      totalReviews: 0,
    },
  });

  const [calculatedRating, setCalculatedRating] = useState<{
    rating: number;
    completedJobs: number;
    totalReviews: number;
  }>({
    rating: 0,
    completedJobs: 0,
    totalReviews: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load profile data and calculate rating
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ FIXED: Load profile AND calculate rating from jobs
        const [providerDoc, ratingData] = await Promise.all([
          getDoc(doc(db, "providers", user.uid)),
          calculateProviderRatingFromJobs(user.uid),
        ]);

        console.log("Rating data calculated:", ratingData);
        setCalculatedRating(ratingData);

        if (providerDoc.exists()) {
          const data = providerDoc.data();
          const createdAtDate = safeToDate(data.createdAt);

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
            createdAt: createdAtDate,
            rating: {
              average: ratingData.rating, // ✅ Use calculated rating
              totalReviews: ratingData.totalReviews,
            },
          });
        } else {
          setProfile({
            name: "",
            email: user.email || "",
            phone: "",
            serviceType: "",
            district: "",
            block: "",
            experience: "",
            photoLink: "",
            proofLink: "",
            status: "pending",
            emailVerified: false,
            phoneVerified: false,
            createdAt: new Date(),
            rating: {
              average: ratingData.rating,
              totalReviews: ratingData.totalReviews,
            },
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError(t.errorLoading);
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.uid, lang]);

  // Save profile changes
  const handleSave = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      setError(null);

      const providerRef = doc(db, "providers", user.uid);

      const updateData = {
        name: profile.name,
        phone: profile.phone,
        serviceType: profile.serviceType,
        district: profile.district,
        block: profile.block,
        experience: profile.experience,
        updatedAt: new Date(),
      };

      console.log("Saving profile update:", updateData);
      await updateDoc(providerRef, updateData);

      setSuccess(t.profileUpdated);
      setEditing(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError(t.errorSaving);
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = async () => {
    setEditing(false);
    if (!user?.uid) return;

    try {
      const providerDoc = await getDoc(doc(db, "providers", user.uid));
      if (providerDoc.exists()) {
        const data = providerDoc.data();
        const createdAtDate = safeToDate(data.createdAt);

        setProfile((prev) => ({
          ...prev,
          name: data.name || "",
          phone: data.phone || "",
          serviceType: data.serviceType || "",
          district: data.district || "",
          block: data.block || "",
          experience: data.experience || "",
          createdAt: createdAtDate,
        }));
      }
    } catch (err) {
      console.error("Error reloading data:", err);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    try {
      return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch (err) {
      return "Invalid date";
    }
  };

  // Experience options
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
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

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <p className="text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">
                {lang === "en" ? "Error" : "பிழை"}
              </p>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-10 h-10 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-800 truncate">
                {profile.name || t.notSet}
              </h3>
              {profile.status === "approved" ? (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                  <Shield className="w-3 h-3" />
                  {t.approved}
                </span>
              ) : (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex-shrink-0">
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

            {/* ✅ FIXED: Rating Display (calculated from jobs) */}
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

        {/* Profile Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="space-y-5">
            <div className="pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" />
                {t.personalInfo}
              </h4>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.fullName}
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) =>
                    setProfile({ ...profile, name: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder={t.enterName}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span
                      className={
                        !profile.name ? "text-gray-400 italic" : "text-gray-800"
                      }
                    >
                      {profile.name || t.notSet}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.emailAddress}
              </label>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-800">{profile.email}</span>
                  </div>
                  {profile.emailVerified && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t.verified}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.phoneNumber}
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder="+91 9876543210"
                  maxLength={10}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span
                        className={
                          !profile.phone
                            ? "text-gray-400 italic"
                            : "text-gray-800"
                        }
                      >
                        {profile.phone || t.notSet}
                      </span>
                    </div>
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

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.yearsExperience}
              </label>
              {editing ? (
                <select
                  value={profile.experience}
                  onChange={(e) =>
                    setProfile({ ...profile, experience: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                >
                  <option value="">{t.selectExperience}</option>
                  {experienceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-500 flex-shrink-0" />
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
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-5">
            <div className="pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                {t.professionalInfo}
              </h4>
            </div>

            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.serviceType}
              </label>
              {editing ? (
                <select
                  value={profile.serviceType}
                  onChange={(e) =>
                    setProfile({ ...profile, serviceType: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                >
                  <option value="">{t.selectService}</option>
                  {SERVICE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-gray-500 flex-shrink-0" />
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
                </div>
              )}
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.district}
              </label>
              {editing ? (
                <select
                  value={profile.district}
                  onChange={(e) =>
                    setProfile({ ...profile, district: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white"
                >
                  <option value="">{t.selectDistrict}</option>
                  {TAMIL_NADU_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
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
                </div>
              )}
            </div>

            {/* Block/Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.blockArea}
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profile.block}
                  onChange={(e) =>
                    setProfile({ ...profile, block: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  placeholder={t.blockPlaceholder}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-gray-500 flex-shrink-0" />
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
                </div>
              )}
            </div>

            {/* Document Links (Read-only) */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Link className="w-5 h-5 text-gray-500" />
                {t.verificationDocs}
              </h5>

              <div className="space-y-3">
                {/* Photo Link */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.profilePhoto}</p>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    {profile.photoLink ? (
                      <a
                        href={profile.photoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 group"
                      >
                        <Link className="w-4 h-4 group-hover:scale-110 transition" />
                        <span className="truncate">
                          {profile.photoLink.length > 40
                            ? profile.photoLink.substring(0, 40) + "..."
                            : profile.photoLink}
                        </span>
                      </a>
                    ) : (
                      <span className="text-gray-400 italic text-sm">
                        {t.notProvided}
                      </span>
                    )}
                  </div>
                </div>

                {/* Proof Link */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {t.proofDocument}
                  </p>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    {profile.proofLink ? (
                      <a
                        href={profile.proofLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-2 group"
                      >
                        <Link className="w-4 h-4 group-hover:scale-110 transition" />
                        <span className="truncate">
                          {profile.proofLink.length > 40
                            ? profile.proofLink.substring(0, 40) + "..."
                            : profile.proofLink}
                        </span>
                      </a>
                    ) : (
                      <span className="text-gray-400 italic text-sm">
                        {t.notProvided}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Rating Information (Calculated from jobs) */}
        {calculatedRating.totalReviews > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 pt-6 border-t border-gray-200"
          >
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
          </motion.div>
        )}
      </div>
    </div>
  );
}
