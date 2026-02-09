"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { generateEmailOTP, verifyEmailOTP } from "../../firebase/emailOTP";
import { registerProvider, getActualRole } from "../../firebase/authWithRole";
import { useLanguage } from "../../context/LanguageContext";
import Notification from "../../components/Notification";
import {
  Eye,
  EyeOff,
  Upload,
  Shield,
  ChevronDown,
  X,
  Search,
  Camera,
  FileCheck,
  Loader2,
  CheckCircle,
  User,
  Home,
} from "lucide-react";
import { auth, db } from "../../firebase/config";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// All 38 Districts of Tamil Nadu
const TAMIL_NADU_DISTRICTS = [
  { en: "Ariyalur", ta: "அரியலூர்" },
  { en: "Chengalpattu", ta: "செங்கல்பட்டு" },
  { en: "Chennai", ta: "சென்னை" },
  { en: "Coimbatore", ta: "கோயம்புத்தூர்" },
  { en: "Cuddalore", ta: "கடலூர்" },
  { en: "Dharmapuri", ta: "தருமபுரி" },
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
  { en: "Tirupathur", ta: "திருப்பத்தூர்" },
  { en: "Tiruppur", ta: "திருப்பூர்" },
  { en: "Tiruvallur", ta: "திருவள்ளூர்" },
  { en: "Tiruvannamalai", ta: "திருவண்ணாமலை" },
  { en: "Tiruvarur", ta: "திருவாரூர்" },
  { en: "Vellore", ta: "வேலூர்" },
  { en: "Viluppuram", ta: "விழுப்புரம்" },
  { en: "Virudhunagar", ta: "விருதுநகர்" },
];

// Updated Comprehensive Service Types with General & Specialized
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

const ProviderSignupPage: React.FC = () => {
  const router = useRouter();
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    serviceType: "",
    district: "",
    block: "",
    photoLink: "",
    proofLink: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [serviceSearch, setServiceSearch] = useState("");
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const [filteredServices, setFilteredServices] = useState(SERVICE_TYPES);

  // File upload states
  const [photoUploading, setPhotoUploading] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);

  useEffect(() => setIsMounted(true), []);

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

  // Load Cloudinary widget script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    script.onload = () => {
      console.log("Cloudinary widget loaded");
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "district" ? { block: "" } : {}),
    }));
  };

  // Upload Photo to Cloudinary
  const uploadPhoto = () => {
    if (!formData.email) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter email first"
            : "முதலில் மின்னஞ்சலை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setPhotoUploading(true);

    // Sanitize email for folder name
    const sanitizedEmail = formData.email
      .toLowerCase()
      .replace(/@/g, "_at_")
      .replace(/\./g, "_dot_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        folder: `quickserve/providers/photos/${sanitizedEmail}`,
        cropping: true,
        croppingAspectRatio: 1,
        croppingDefaultSelectionRatio: 1,
        showCompletedButton: true,
        singleUploadAutoClose: true,
        multiple: false,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxFileSize: 5 * 1024 * 1024, // 5MB
        showPoweredBy: false,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0078FF",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#FF620C",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1",
          },
        },
      },
      (error: any, result: any) => {
        setPhotoUploading(false);

        if (!error && result && result.event === "success") {
          setFormData((prev) => ({
            ...prev,
            photoLink: result.info.secure_url,
          }));
          setNotif({
            message:
              lang === "en"
                ? "Profile photo uploaded successfully!"
                : "சுயபடம் வெற்றிகரமாக பதிவேற்றப்பட்டது!",
            type: "success",
          });
        } else if (error) {
          setNotif({
            message: error.message || "Upload failed",
            type: "error",
          });
        }
      }
    );

    widget.open();
  };

  // Upload Proof Document to Cloudinary
  const uploadProof = () => {
    if (!formData.email) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter email first"
            : "முதலில் மின்னஞ்சலை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setProofUploading(true);

    // Sanitize email for folder name
    const sanitizedEmail = formData.email
      .toLowerCase()
      .replace(/@/g, "_at_")
      .replace(/\./g, "_dot_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        folder: `quickserve/providers/documents/${sanitizedEmail}`,
        multiple: false,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        showPoweredBy: false,
        styles: {
          palette: {
            window: "#FFFFFF",
            windowBorder: "#90A0B3",
            tabIcon: "#0078FF",
            menuIcons: "#5A616A",
            textDark: "#000000",
            textLight: "#FFFFFF",
            link: "#0078FF",
            action: "#FF620C",
            inactiveTabIcon: "#0E2F5A",
            error: "#F44235",
            inProgress: "#0078FF",
            complete: "#20B832",
            sourceBg: "#E4EBF1",
          },
        },
      },
      (error: any, result: any) => {
        setProofUploading(false);

        if (!error && result && result.event === "success") {
          setFormData((prev) => ({
            ...prev,
            proofLink: result.info.secure_url,
          }));
          setNotif({
            message:
              lang === "en"
                ? "Proof document uploaded successfully!"
                : "ஆவண சான்று வெற்றிகரமாக பதிவேற்றப்பட்டது!",
            type: "success",
          });
        } else if (error) {
          setNotif({
            message: error.message || "Upload failed",
            type: "error",
          });
        }
      }
    );

    widget.open();
  };

  // Remove photo
  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, photoLink: "" }));
  };

  // Remove proof
  const removeProof = () => {
    setFormData((prev) => ({ ...prev, proofLink: "" }));
  };

  // ✅ FIXED: Enhanced email conflict check
  const checkEmailConflict = async (email: string) => {
    const emailLower = email.toLowerCase();

    try {
      // 1. Check if email exists in providers collection
      const providersQuery = query(
        collection(db, "providers"),
        where("email", "==", emailLower)
      );
      const providersSnapshot = await getDocs(providersQuery);

      if (!providersSnapshot.empty) {
        throw new Error(
          lang === "en"
            ? "This email is already registered as a provider."
            : "இந்த மின்னஞ்சல் ஏற்கனவே சேவை வழங்குநராக பதிவு செய்யப்பட்டுள்ளது."
        );
      }

      // 2. Check if email exists in users collection (seekers)
      const usersQuery = query(
        collection(db, "users"),
        where("email", "==", emailLower),
        where("role", "==", "seeker")
      );
      const usersSnapshot = await getDocs(usersQuery);

      if (!usersSnapshot.empty) {
        throw new Error(
          lang === "en"
            ? "This email is already registered as a service seeker."
            : "இந்த மின்னஞ்சல் ஏற்கனவே சேவை தேடுபவராக பதிவு செய்யப்பட்டுள்ளது."
        );
      }
    } catch (error: any) {
      console.error("Email conflict check error:", error);
      if (
        error.message.includes("insufficient") ||
        error.message.includes("permission")
      ) {
        throw new Error(
          lang === "en"
            ? "Unable to verify email. Please try again or contact support."
            : "மின்னஞ்சலை சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது ஆதரவைத் தொடர்பு கொள்ளவும்."
        );
      }
      throw error;
    }
  };

  // Send OTP - SIMPLE FIX
  const handleSendOTP = async () => {
    if (!formData.email) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter your email address"
            : "உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    const emailLower = formData.email.toLowerCase();

    setLoading(true);
    try {
      await checkEmailConflict(emailLower);
      await generateEmailOTP(emailLower); // Just await, don't check result
      setOtpSent(true);
      setNotif({
        message:
          lang === "en"
            ? "OTP sent to your email! Check your inbox/spam."
            : "OTP உங்கள் மின்னஞ்சலுக்கு அனுப்பப்பட்டது! உங்கள் இன்பாக்ஸ்/ஸ்பேம் சரிபார்க்கவும்",
        type: "success",
      });
    } catch (error: any) {
      console.error("OTP Send Error:", error);

      let errorMessage = error.message;
      if (
        error.message.includes("permission") ||
        error.message.includes("insufficient")
      ) {
        errorMessage =
          lang === "en"
            ? "Database permission error. Please check Firestore security rules."
            : "தரவுத்தள அனுமதி பிழை. Firestore பாதுகாப்பு விதிகளை சரிபார்க்கவும்.";
      } else if (error.message.includes("EmailJS")) {
        errorMessage =
          lang === "en"
            ? "Email service error. Please try again."
            : "மின்னஞ்சல் சேவை பிழை. மீண்டும் முயற்சிக்கவும்.";
      } else if (error.message.includes("already registered")) {
        errorMessage = error.message;
      }

      setNotif({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Verify OTP with better error handling
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter 6-digit OTP"
            : "6-இலக்க OTP ஐ உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const verification = await verifyEmailOTP(
        formData.email.toLowerCase(),
        otp
      );

      if (verification.success) {
        setOtpVerified(true);
        setNotif({
          message: lang === "en" ? "OTP verified!" : "OTP சரிபார்க்கப்பட்டது!",
          type: "success",
        });
      } else {
        setNotif({
          message: verification.message || "Invalid OTP",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("OTP Verify Error:", error);
      setNotif({
        message: error.message || "Error verifying OTP",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setOtp("");
    try {
      await checkEmailConflict(formData.email.toLowerCase());
      await generateEmailOTP(formData.email.toLowerCase()); // Just await
      setNotif({
        message: lang === "en" ? "New OTP sent!" : "புதிய OTP அனுப்பப்பட்டது!",
        type: "success",
      });
    } catch (error: any) {
      console.error("Resend OTP Error:", error);

      let errorMessage = error.message;
      if (error.message.includes("permission")) {
        errorMessage =
          lang === "en"
            ? "Cannot send OTP. Database permission issue."
            : "OTP அனுப்ப முடியவில்லை. தரவுத்தள அனுமதி பிரச்சனை.";
      }

      setNotif({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpVerified) {
      setNotif({
        message:
          lang === "en"
            ? "Please verify OTP first"
            : "முதலில் OTP ஐ சரிபார்க்கவும்",
        type: "error",
      });
      return;
    }

    // Check if files are uploaded
    if (!formData.photoLink) {
      setNotif({
        message:
          lang === "en"
            ? "Please upload your profile photo"
            : "உங்கள் சுயபடத்தை பதிவேற்றவும்",
        type: "error",
      });
      return;
    }

    if (!formData.proofLink) {
      setNotif({
        message:
          lang === "en"
            ? "Please upload your proof document"
            : "உங்கள் ஆவண சான்றை பதிவேற்றவும்",
        type: "error",
      });
      return;
    }

    const requiredFields = [
      "name",
      "phone",
      "email",
      "password",
      "confirmPassword",
      "serviceType",
      "district",
      "block",
    ];

    const missing = requiredFields.filter(
      (f) => !formData[f as keyof typeof formData]
    );

    if (missing.length > 0) {
      setNotif({
        message:
          lang === "en"
            ? "Please fill all mandatory fields"
            : "அனைத்து கட்டாய புலங்களையும் நிரப்பவும்",
        type: "error",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setNotif({
        message:
          lang === "en"
            ? "Passwords do not match"
            : "கடவுச்சொற்கள் பொருந்தவில்லை",
        type: "error",
      });
      return;
    }

    if (formData.phone.length !== 10) {
      setNotif({
        message:
          lang === "en"
            ? "Enter valid 10-digit phone number"
            : "சரியான 10 இலக்க எண்ணை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const providerData = {
        name: formData.name,
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        serviceType: formData.serviceType,
        district: formData.district,
        block: formData.block,
        photoLink: formData.photoLink,
        proofLink: formData.proofLink,
        phoneVerified: false,
        emailVerified: true,
        status: "pending",
        // Add Cloudinary info for admin reference
        cloudinaryPhotoPath: formData.photoLink,
        cloudinaryProofPath: formData.proofLink,
        registrationDate: new Date().toISOString(),
      };

      const result = await registerProvider(
        formData.email.toLowerCase(),
        formData.password,
        providerData
      );

      if (result.success && auth.currentUser) {
        // ✅ CRITICAL FIX: Store role in localStorage IMMEDIATELY
        localStorage.setItem("userRole", "provider");

        // ✅ CRITICAL FIX: Create provider document in Firestore
        await setDoc(doc(db, "providers", auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          ...providerData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // ✅ CRITICAL FIX: Also create a user document with provider role
        await setDoc(doc(db, "users", auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          name: formData.name,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          role: "provider",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        setNotif({
          message:
            lang === "en"
              ? "🎉 Registration successful! Waiting for approval."
              : "🎉 பதிவு வெற்றிகரமாக! நிர்வாக ஒப்புதலுக்காக காத்திருக்கவும்.",
          type: "success",
        });

        // Wait 2 seconds then redirect to waiting page
        setTimeout(() => {
          router.push("/provider/waiting");
        }, 2000);
      } else {
        setNotif({
          message: result.error || "Registration failed",
          type: "error",
        });
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setNotif({
        message:
          err.message ||
          (lang === "en" ? "Registration failed" : "பதிவு தோல்வி"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      {/* Spacing from Navbar */}
      <div className="h-16 flex-shrink-0"></div>

      {/* Scrollable form container */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            {/* Card Container */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-4">
              {/* Header Section with GREEN Theme */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 text-center">
                <h1 className="text-xl font-bold text-white">QuickServe</h1>
                <h2 className="text-base font-semibold text-green-100 mt-1">
                  {lang === "en"
                    ? "Provider Registration"
                    : "சேவை வழங்குநர் பதிவு"}
                </h2>
                <p className="text-xs text-green-200 mt-1">
                  {lang === "en"
                    ? "Join as a verified service provider"
                    : "சரிபார்க்கப்பட்ட சேவை வழங்குநராக இணையுங்கள்"}
                </p>
              </div>

              {/* Form Section */}
              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* PROFILE PHOTO */}
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-gray-700 text-center">
                      {lang === "en" ? "Profile Photo" : "சுயபடம்"} *
                    </label>

                    {/* Traditional round photo upload area */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-32 h-32 mb-4">
                        {formData.photoLink ? (
                          <>
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-green-100 shadow-lg">
                              <img
                                src={formData.photoLink}
                                alt="Profile preview"
                                className="w-full h-full object-cover"
                              />
                              {photoUploading && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={removePhoto}
                              disabled={photoUploading || loading}
                              className="absolute -top-1 -right-1 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all duration-200 active:scale-95 cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-green-400 transition-all duration-200">
                            {photoUploading ? (
                              <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
                            ) : (
                              <User className="w-12 h-12 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={uploadPhoto}
                        disabled={photoUploading || loading || !formData.email}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-sm hover:shadow cursor-pointer"
                      >
                        {photoUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {lang === "en"
                              ? "Uploading..."
                              : "பதிவேற்றுகிறது..."}
                          </>
                        ) : formData.photoLink ? (
                          <>
                            <Camera className="w-4 h-4" />
                            {lang === "en" ? "Change Photo" : "படத்தை மாற்று"}
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            {lang === "en"
                              ? "Upload Profile Photo"
                              : "சுயபடத்தை பதிவேற்று"}
                          </>
                        )}
                      </button>

                      {!formData.email && (
                        <p className="text-xs text-red-500 mt-2 text-center">
                          {lang === "en"
                            ? "Enter email first to upload photo"
                            : "படம் பதிவேற்ற முதலில் மின்னஞ்சலை உள்ளிடவும்"}
                        </p>
                      )}

                      {formData.photoLink && (
                        <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs mt-2">
                          <CheckCircle className="w-3 h-3" />
                          {lang === "en"
                            ? "Photo uploaded successfully"
                            : "படம் வெற்றிகரமாக பதிவேற்றப்பட்டது"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Full Name" : "முழு பெயர்"} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder={
                        lang === "en"
                          ? "Enter your full name"
                          : "உங்கள் முழு பெயரை உள்ளிடவும்"
                      }
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Phone Number" : "தொலைபேசி எண்"} *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      placeholder={
                        lang === "en"
                          ? "Enter 10-digit phone number"
                          : "10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
                      }
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                    />
                  </div>

                  {/* Email & OTP Section */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-700">
                        {lang === "en" ? "Email Address" : "மின்னஞ்சல் முகவரி"}{" "}
                        *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          name="email"
                          placeholder={
                            lang === "en"
                              ? "Enter your email address"
                              : "உங்கள் மின்னஞ்சலை உள்ளிடவும்"
                          }
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={otpSent || loading}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                        />
                        <button
                          type="button"
                          onClick={handleSendOTP}
                          disabled={loading || !formData.email || otpSent}
                          className="px-3 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm font-medium whitespace-nowrap shadow-sm hover:shadow cursor-pointer"
                        >
                          {loading
                            ? lang === "en"
                              ? "Sending..."
                              : "அனுப்புகிறது..."
                            : otpSent
                            ? lang === "en"
                              ? "Sent ✓"
                              : "அனுப்பப்பட்டது ✓"
                            : lang === "en"
                            ? "Send OTP"
                            : "OTP அனுப்பவும்"}
                        </button>
                      </div>
                    </div>

                    {otpSent && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700">
                          {lang === "en" ? "Enter OTP" : "OTP உள்ளிடவும்"} *
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder={
                              lang === "en"
                                ? "Enter 6-digit OTP"
                                : "6-இலக்க OTP ஐ உள்ளிடவும்"
                            }
                            value={otp}
                            onChange={(e) =>
                              setOtp(e.target.value.replace(/\D/g, ""))
                            }
                            maxLength={6}
                            disabled={otpVerified || loading}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text text-center font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={
                              loading || otpVerified || otp.length !== 6
                            }
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm font-medium whitespace-nowrap shadow-sm hover:shadow cursor-pointer"
                          >
                            {otpVerified
                              ? lang === "en"
                                ? "✓ Verified"
                                : "✓ சரிபார்க்கப்பட்டது"
                              : lang === "en"
                              ? "Verify"
                              : "சரிபார்க்கவும்"}
                          </button>
                        </div>

                        {!otpVerified && (
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={handleResendOTP}
                              disabled={loading}
                              className="text-green-600 hover:text-green-700 active:text-green-800 text-xs disabled:text-gray-400 transition-all duration-200 underline hover:no-underline cursor-pointer hover:scale-105 active:scale-95"
                            >
                              {lang === "en"
                                ? "Resend OTP"
                                : "OTP மீண்டும் அனுப்பவும்"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Password" : "கடவுச்சொல்"} *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder={
                          lang === "en"
                            ? "Enter password (min 6 characters)"
                            : "கடவுச்சொல்லை உள்ளிடவும் (குறைந்தது 6 எழுத்துகள்)"
                        }
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text pr-10"
                      />
                      {/* Eye Icon with hover hand cursor */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:text-gray-400 disabled:hover:bg-transparent active:bg-green-100 active:scale-95 cursor-pointer"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en"
                        ? "Confirm Password"
                        : "கடவுச்சொல் உறுதிப்படுத்தல்"}{" "}
                      *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        placeholder={
                          lang === "en"
                            ? "Confirm your password"
                            : "உங்கள் கடவுச்சொல்லை உறுதிப்படுத்தவும்"
                        }
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text pr-10"
                      />
                      {/* Eye Icon with hover hand cursor */}
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:text-gray-400 disabled:hover:bg-transparent active:bg-green-100 active:scale-95 cursor-pointer"
                        title={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Service Type */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Service Type" : "சேவை வகை"} *
                    </label>
                    <div className="relative">
                      {/* Trigger Button */}
                      <div
                        onClick={() =>
                          !loading &&
                          setShowServiceDropdown(!showServiceDropdown)
                        }
                        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between transition-all duration-200 ${
                          loading
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white hover:border-green-500 focus:border-green-500 cursor-pointer"
                        } ${
                          showServiceDropdown
                            ? "border-green-500 ring-2 ring-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {formData.serviceType ? (
                          <span className="truncate">
                            {SERVICE_TYPES.find(
                              (s) => s.value === formData.serviceType
                            )?.[lang === "en" ? "en" : "ta"] ||
                              formData.serviceType}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {lang === "en"
                              ? "Select your service type"
                              : "உங்கள் சேவை வகையைத் தேர்ந்தெடுக்கவும்"}
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          {formData.serviceType && !loading && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFormData((prev) => ({
                                  ...prev,
                                  serviceType: "",
                                }));
                              }}
                              className="p-0.5 hover:bg-gray-100 rounded cursor-pointer"
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
                      {showServiceDropdown && !loading && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
                          {/* Search Input */}
                          <div className="p-2 border-b">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                value={serviceSearch}
                                onChange={(e) =>
                                  setServiceSearch(e.target.value)
                                }
                                placeholder={
                                  lang === "en"
                                    ? "Search services..."
                                    : "சேவைகளைத் தேடுங்கள்..."
                                }
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm hover:border-green-400 cursor-text"
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
                                      setFormData((prev) => ({
                                        ...prev,
                                        serviceType: service.value,
                                      }));
                                      setShowServiceDropdown(false);
                                      setServiceSearch("");
                                    }}
                                    className={`px-3 py-2.5 hover:bg-green-50 transition-colors cursor-pointer ${
                                      formData.serviceType === service.value
                                        ? "bg-green-50 text-green-700 font-medium"
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

                  {/* District */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "District" : "மாவட்டம்"} *
                    </label>
                    <select
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-pointer"
                    >
                      <option value="">
                        {lang === "en"
                          ? "Select your district"
                          : "உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்"}
                      </option>
                      {TAMIL_NADU_DISTRICTS.map((district) => (
                        <option key={district.en} value={district.en}>
                          {lang === "en" ? district.en : district.ta}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Block */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Block" : "பிளாக்"} *
                    </label>
                    <input
                      type="text"
                      name="block"
                      placeholder={
                        lang === "en"
                          ? "Enter your block (Taluk/Mandal)"
                          : "உங்கள் பிளாக் (தாலுகா/மண்டலம்) உள்ளிடவும்"
                      }
                      value={formData.block}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                    />
                  </div>

                  {/* Proof Document Upload */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Proof Document" : "ஆவண சான்று"} *
                    </label>

                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-all duration-200">
                      {formData.proofLink ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-3 p-3 bg-green-50 rounded-lg">
                            <FileCheck className="w-10 h-10 text-green-500" />
                            <div className="text-left">
                              <p className="text-sm font-medium text-gray-700">
                                {lang === "en"
                                  ? "Document Uploaded"
                                  : "ஆவணம் பதிவேற்றப்பட்டது"}
                              </p>
                              <a
                                href={formData.proofLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-green-600 hover:text-green-700 hover:underline transition-all duration-200 cursor-pointer"
                              >
                                {lang === "en"
                                  ? "View Document"
                                  : "ஆவணத்தை பார்க்க"}
                              </a>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            <button
                              type="button"
                              onClick={uploadProof}
                              disabled={
                                proofUploading || loading || !formData.email
                              }
                              className="px-3 py-1.5 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer"
                            >
                              {proofUploading ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  {lang === "en"
                                    ? "Uploading..."
                                    : "பதிவேற்றுகிறது..."}
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3 h-3" />
                                  {lang === "en"
                                    ? "Change Document"
                                    : "ஆவணத்தை மாற்று"}
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={removeProof}
                              disabled={proofUploading || loading}
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-sm hover:shadow cursor-pointer"
                            >
                              {lang === "en" ? "Remove" : "நீக்கு"}
                            </button>
                          </div>
                          <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs">
                            <CheckCircle className="w-3 h-3" />
                            {lang === "en"
                              ? "Document uploaded"
                              : "ஆவணம் பதிவேற்றப்பட்டது"}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                            <Shield className="w-8 h-8 text-gray-400" />
                          </div>
                          <p className="text-sm text-gray-600">
                            {lang === "en"
                              ? "Upload your ID proof document"
                              : "உங்கள் அடையாள சான்றை பதிவேற்றவும்"}
                          </p>
                          <button
                            type="button"
                            onClick={uploadProof}
                            disabled={
                              proofUploading || loading || !formData.email
                            }
                            className="mx-auto px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow cursor-pointer"
                          >
                            {proofUploading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {lang === "en"
                                  ? "Uploading..."
                                  : "பதிவேற்றுகிறது..."}
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                {lang === "en"
                                  ? "Upload Document"
                                  : "ஆவணத்தை பதிவேற்று"}
                              </>
                            )}
                          </button>
                          <p className="text-xs text-gray-500">
                            {lang === "en"
                              ? "Image or PDF (max 10MB)"
                              : "படம் அல்லது PDF (அதிகபட்சம் 10MB)"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {lang === "en"
                              ? "Aadhar, Driving License, or other government ID proof"
                              : "ஆதார், ஓட்டுநர் உரிமம் அல்லது பிற அரசு அடையாள சான்று"}
                          </p>
                          {!formData.email && (
                            <p className="text-xs text-red-500">
                              {lang === "en"
                                ? "Enter email first to upload"
                                : "பதிவேற்ற முதலில் மின்னஞ்சலை உள்ளிடவும்"}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      disabled={loading}
                      className="mt-0.5 rounded focus:ring-green-400 focus:ring-2 disabled:cursor-not-allowed cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-gray-600">
                      {lang === "en"
                        ? "I agree to terms & privacy policy"
                        : "நான் விதிமுறைகள் & தனியுரிமைக் கொள்கைக்கு ஒப்புக்கொள்கிறேன்"}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      !otpVerified ||
                      loading ||
                      !formData.photoLink ||
                      !formData.proofLink
                    }
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm mt-2 shadow-md hover:shadow-lg cursor-pointer"
                  >
                    {loading
                      ? lang === "en"
                        ? "Processing..."
                        : "செயல்படுத்தப்படுகிறது..."
                      : lang === "en"
                      ? "Complete Registration"
                      : "பதிவை முடிக்கவும்"}
                  </button>

                  {/* Back to Home Button */}
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 active:from-green-300 active:to-emerald-300 text-green-700 border border-green-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-green-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer group"
                  >
                    <Home className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    {lang === "en" ? "Back to Home" : "முகப்புக்குத் திரும்பு"}
                  </button>
                </form>

                {/* Login Redirect */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600">
                    {lang === "en"
                      ? "Already have an account?"
                      : "ஏற்கனவே கணக்கு உள்ளதா?"}{" "}
                    <button
                      type="button"
                      onClick={() => !loading && router.push("/provider/login")}
                      disabled={loading}
                      className="text-green-600 hover:text-green-700 active:text-green-800 font-medium underline hover:no-underline disabled:text-gray-500 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      {lang === "en" ? "Login here" : "இங்கே உள்நுழையவும்"}
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-[10px] text-gray-500 px-2">
              {lang === "en"
                ? "All fields are mandatory for verification. Approval may take 24-48 hours."
                : "சரிபார்ப்புக்கு அனைத்து புலங்களும் கட்டாயமாகும். ஒப்புதல் 24-48 மணிநேரம் எடுக்கலாம்."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-4 flex-shrink-0"></div>

      {/* Notification */}
      {notif && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Notification
            message={notif.message}
            type={notif.type}
            onClose={() => setNotif(null)}
          />
        </div>
      )}
    </div>
  );
};

export default ProviderSignupPage;
