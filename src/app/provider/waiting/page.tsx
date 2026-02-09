"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { auth, db } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import {
  Clock,
  ShieldCheck,
  AlertCircle,
  LogOut,
  Home,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Shield,
} from "lucide-react";

export default function ProviderWaitingPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [providerData, setProviderData] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchProviderData = async () => {
    if (!user?.uid) {
      router.push("/provider/login");
      return;
    }

    try {
      const providerDoc = await getDoc(doc(db, "providers", user.uid));

      if (providerDoc.exists()) {
        const data = providerDoc.data();
        setProviderData(data);
        setStatus(data.status || "pending");

        // If approved, redirect to dashboard
        if (data.status === "approved") {
          setTimeout(() => {
            router.push("/provider/dashboard");
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error fetching provider data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchProviderData();
  }, [user, router]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProviderData();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userRole");
      router.push("/provider/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      router.push("/provider/login");
    }
  };

  const goToHome = () => {
    router.push("/");
  };

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {lang === "en"
              ? "Loading your account details..."
              : "உங்கள் கணக்கு விவரங்களை ஏற்றுகிறது..."}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(lang === "en" ? "en-IN" : "ta-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Spacing from Navbar */}
      <div className="h-16 flex-shrink-0"></div>

      {/* Centered content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-5 text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                {status === "pending" && (
                  <Clock className="w-8 h-8 text-green-100" />
                )}
                {status === "approved" && (
                  <ShieldCheck className="w-8 h-8 text-green-100" />
                )}
                {status === "rejected" && (
                  <AlertCircle className="w-8 h-8 text-green-100" />
                )}
                <h1 className="text-2xl font-bold text-white">
                  {status === "pending" &&
                    (lang === "en"
                      ? "Account Under Review"
                      : "கணக்கு மதிப்பாய்வில்")}
                  {status === "approved" &&
                    (lang === "en"
                      ? "Account Approved!"
                      : "கணக்கு அங்கீகரிக்கப்பட்டது!")}
                  {status === "rejected" &&
                    (lang === "en"
                      ? "Account Rejected"
                      : "கணக்கு நிராகரிக்கப்பட்டது")}
                </h1>
              </div>
              <p className="text-green-100 text-sm">
                {status === "pending" &&
                  (lang === "en"
                    ? "Your provider application is being reviewed by our team"
                    : "உங்கள் சேவை வழங்குநர் விண்ணப்பம் எங்கள் குழுவால் மதிப்பாய்வு செய்யப்படுகிறது")}
                {status === "approved" &&
                  (lang === "en"
                    ? "Your account has been verified and approved"
                    : "உங்கள் கணக்கு சரிபார்க்கப்பட்டு அங்கீகரிக்கப்பட்டது")}
                {status === "rejected" &&
                  (lang === "en"
                    ? "Your application requires further verification"
                    : "உங்கள் விண்ணப்பத்திற்கு கூடுதல் சரிபார்பு தேவை")}
              </p>
            </div>

            {/* Account Details Section */}
            <div className="p-6 space-y-6">
              {/* Account Information Card */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-green-600" />
                  {lang === "en" ? "Account Information" : "கணக்கு தகவல்"}
                </h2>

                <div className="space-y-4">
                  {/* Name and Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-4 h-4" />
                        <span>
                          {lang === "en" ? "Full Name" : "முழு பெயர்"}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 pl-6">
                        {providerData?.name || "N/A"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span>
                          {lang === "en"
                            ? "Email Address"
                            : "மின்னஞ்சல் முகவரி"}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 pl-6">
                        {providerData?.email || user?.email || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Service and Phone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span>
                          {lang === "en" ? "Service Type" : "சேவை வகை"}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 pl-6">
                        {providerData?.serviceType
                          ? SERVICE_TYPES.find(
                              (s) => s.value === providerData.serviceType
                            )?.[lang === "en" ? "en" : "ta"] ||
                            providerData.serviceType
                          : "N/A"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />
                        <span>
                          {lang === "en" ? "Phone Number" : "தொலைபேசி எண்"}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 pl-6">
                        {providerData?.phone || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Location and Date Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span>{lang === "en" ? "Location" : "இடம்"}</span>
                      </div>
                      <p className="font-medium text-gray-800 pl-6">
                        {providerData?.district || "N/A"}
                        {providerData?.block ? `, ${providerData.block}` : ""}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {lang === "en" ? "Registration Date" : "பதிவு தேதி"}
                        </span>
                      </div>
                      <p className="font-medium text-gray-800 pl-6">
                        {formatDate(
                          providerData?.registrationDate ||
                            providerData?.createdAt?.toDate?.()
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <div
                className={`rounded-xl p-4 border ${
                  status === "pending"
                    ? "bg-yellow-50 border-yellow-200"
                    : status === "approved"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  {status === "pending" && (
                    <Clock className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  )}
                  {status === "approved" && (
                    <ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  {status === "rejected" && (
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}

                  <div>
                    <h3
                      className={`font-semibold ${
                        status === "pending"
                          ? "text-yellow-800"
                          : status === "approved"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {status === "pending" &&
                        (lang === "en"
                          ? "Review in Progress"
                          : "மதிப்பாய்வு நடைபெறுகிறது")}
                      {status === "approved" &&
                        (lang === "en"
                          ? "Verification Complete"
                          : "சரிபார்பு முடிந்தது")}
                      {status === "rejected" &&
                        (lang === "en" ? "Action Required" : "நடவடிக்கை தேவை")}
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        status === "pending"
                          ? "text-yellow-700"
                          : status === "approved"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {status === "pending" &&
                        (lang === "en"
                          ? "Our admin team is reviewing your documents and profile. Approval typically takes 24-48 hours. You'll receive an email notification once approved."
                          : "எங்கள் நிர்வாக குழு உங்கள் ஆவணங்கள் மற்றும் சுயவிவரத்தை மதிப்பாய்வு செய்கிறது. ஒப்புதல் பொதுவாக 24-48 மணிநேரம் எடுக்கும். அங்கீகரிக்கப்பட்டதும் மின்னஞ்சல் அறிவிப்பைப் பெறுவீர்கள்.")}

                      {status === "approved" &&
                        (lang === "en"
                          ? "Congratulations! Your account has been verified. You will be redirected to your dashboard shortly."
                          : "வாழ்த்துக்கள்! உங்கள் கணக்கு சரிபார்க்கப்பட்டது. விரைவில் உங்கள் டாஷ்போர்டுக்கு திருப்பி விடப்படுவீர்கள்.")}

                      {status === "rejected" &&
                        (lang === "en"
                          ? "Your application requires additional verification. Please contact our support team for more information or submit a new application."
                          : "உங்கள் விண்ணப்பத்திற்கு கூடுதல் சரிபார்பு தேவை. மேலும் தகவலுக்கு எங்கள் ஆதரவு குழுவைத் தொடர்பு கொள்ளவும் அல்லது புதிய விண்ணப்பத்தை சமர்ப்பிக்கவும்.")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || status === "approved"}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 text-blue-700 border border-blue-200 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow cursor-pointer group"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      refreshing
                        ? "animate-spin"
                        : "group-hover:rotate-180 transition-transform"
                    }`}
                  />
                  {refreshing
                    ? lang === "en"
                      ? "Refreshing..."
                      : "புதுப்பிக்கிறது..."
                    : lang === "en"
                    ? "Check Status"
                    : "நிலையை சரிபார்க்க"}
                </button>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow cursor-pointer group"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  {lang === "en" ? "Logout" : "வெளியேறு"}
                </button>

                {/* Back to Home Button */}
                <button
                  onClick={goToHome}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 active:from-green-200 active:to-emerald-200 text-green-700 border border-green-200 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm hover:shadow cursor-pointer group"
                >
                  <Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  {lang === "en" ? "Back to Home" : "முகப்புக்குத் திரும்பு"}
                </button>
              </div>

              {/* Additional Information */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {lang === "en"
                    ? "Need assistance? Contact our support team at support@quickserve.com"
                    : "உதவி தேவையா? எங்கள் ஆதரவு குழுவை support@quickserve.com இல் தொடர்பு கொள்ளவும்"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {lang === "en"
                    ? "Your data is secure and protected with end-to-end encryption"
                    : "உங்கள் தரவு பாதுகாப்பானது மற்றும் எண்டு-டு-எண்டு குறியாக்கத்துடன் பாதுகாக்கப்படுகிறது"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8 flex-shrink-0"></div>
    </div>
  );
}

// Add missing icons
const Phone = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);

const MapPin = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);

// Service types mapping (same as in signup)
const SERVICE_TYPES = [
  { en: "Plumbing", ta: "குழாய் வேலை", value: "plumbing" },
  { en: "Electrical", ta: "மின்சாரம்", value: "electrical" },
  { en: "Carpentry", ta: "தச்சு வேலை", value: "carpentry" },
  { en: "Painting", ta: "வண்ணம் தீட்டுதல்", value: "painting" },
  { en: "Masonry", ta: "கட்டுமான வேலை", value: "masonry" },
  { en: "Tile Work", ta: "டைல் வேலை", value: "tile_work" },
  { en: "Home Repair", ta: "வீடு பழுது", value: "home_repair" },
  { en: "Furniture Repair", ta: "தட்டு பழுது", value: "furniture_repair" },
  { en: "Waterproofing", ta: "நீர்புகா வேலை", value: "waterproofing" },
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
  { en: "Hair Stylist", ta: "முடி அலங்காரம்", value: "hair_stylist" },
  { en: "Beautician", ta: "அழகு சாதனம்", value: "beautician" },
  { en: "Makeup Artist", ta: "மேக்அப் கலைஞர்", value: "makeup_artist" },
  { en: "Massage Therapy", ta: "மசாஜ் சிகிச்சை", value: "massage_therapy" },
  { en: "Spa Services", ta: "ஸ்பா சேவைகள்", value: "spa_services" },
  { en: "Nail Art", ta: "நக கலை", value: "nail_art" },
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
  { en: "Packing & Moving", ta: "பேக்கிங் & நகரும்", value: "packing_moving" },
  { en: "Goods Delivery", ta: "பொருட்கள் விநியோகம்", value: "goods_delivery" },
  {
    en: "Transport Services",
    ta: "போக்குவரத்து சேவைகள்",
    value: "transport_services",
  },
  { en: "Driver Services", ta: "டிரைவர் சேவைகள்", value: "driver_services" },
  { en: "Nursing Care", ta: "சிகிச்சை பராமரிப்பு", value: "nursing_care" },
  { en: "Elderly Care", ta: "மூப்போர் பராமரிப்பு", value: "elderly_care" },
  { en: "Babysitter", ta: "குழந்தை பராமரிப்பு", value: "babysitter" },
  {
    en: "Physiotherapist",
    ta: "உடல் சிகிச்சை நிபுணர்",
    value: "physiotherapist",
  },
  { en: "Home Nurse", ta: "வீட்டுச் செவிலியர்", value: "home_nurse" },
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
  { en: "Other Services", ta: "மற்ற சேவைகள்", value: "other_services" },
];
