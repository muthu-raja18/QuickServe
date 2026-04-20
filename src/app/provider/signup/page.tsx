"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import { createUserWithEmailAndPassword } from "firebase/auth";
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
  { en: "Tirupathur", ta: "திருப்பத்தூர்" },
  { en: "Tiruppur", ta: "திருப்பூர்" },
  { en: "Tiruvallur", ta: "திருவள்ளூர்" },
  { en: "Tiruvannamalai", ta: "திருவண்ணாமலை" },
  { en: "Tiruvarur", ta: "திருவாரூர்" },
  { en: "Vellore", ta: "வேலூர்" },
  { en: "Viluppuram", ta: "விழுப்புரம்" },
  { en: "Virudhunagar", ta: "விருதுநகர்" },
];

// Comprehensive Service Types - with bilingual display names
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
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [proofUploading, setProofUploading] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  useEffect(() => setIsMounted(true), []);

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

  // Cloudinary widget script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://upload-widget.cloudinary.com/global/all.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) document.body.removeChild(script);
    };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "district" ? { block: "" } : {}),
    }));
  };

  // Email uniqueness check (only if email provided)
  const checkEmailUniqueness = async (email: string) => {
    if (!email) return;
    const emailLower = email.toLowerCase();
    const providersQuery = query(
      collection(db, "providers"),
      where("email", "==", emailLower),
    );
    const providersSnap = await getDocs(providersQuery);
    if (!providersSnap.empty)
      throw new Error(
        lang === "en"
          ? "Email already registered"
          : "மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது",
      );
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", emailLower),
    );
    const usersSnap = await getDocs(usersQuery);
    if (!usersSnap.empty)
      throw new Error(
        lang === "en"
          ? "Email already registered"
          : "மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது",
      );
  };

  // Get display name for service (bilingual - shows both)
  const getServiceDisplayName = (serviceValue: string) => {
    const service = SERVICE_TYPES.find((s) => s.value === serviceValue);
    if (!service) return serviceValue;
    return `${service.en} (${service.ta})`;
  };

  // Cloudinary upload functions
  const getUploadFolder = () => {
    return `quickserve/providers/${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  };

  const uploadPhoto = () => {
    setPhotoUploading(true);
    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        folder: getUploadFolder(),
        cropping: true,
        croppingAspectRatio: 1,
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxFileSize: 5 * 1024 * 1024,
      },
      (error: any, result: any) => {
        setPhotoUploading(false);
        if (!error && result.event === "success") {
          setFormData((prev) => ({
            ...prev,
            photoLink: result.info.secure_url,
          }));
          setNotif({
            message:
              lang === "en"
                ? "Photo uploaded!"
                : "புகைப்படம் பதிவேற்றப்பட்டது!",
            type: "success",
          });
        } else if (error) setNotif({ message: "Upload failed", type: "error" });
      },
    );
    widget.open();
  };

  const uploadProof = () => {
    setProofUploading(true);
    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
        folder: getUploadFolder(),
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "pdf"],
        maxFileSize: 10 * 1024 * 1024,
      },
      (error: any, result: any) => {
        setProofUploading(false);
        if (!error && result.event === "success") {
          setFormData((prev) => ({
            ...prev,
            proofLink: result.info.secure_url,
          }));
          setNotif({
            message:
              lang === "en" ? "Document uploaded!" : "ஆவணம் பதிவேற்றப்பட்டது!",
            type: "success",
          });
        } else if (error) setNotif({ message: "Upload failed", type: "error" });
      },
    );
    widget.open();
  };

  const removePhoto = () => setFormData((prev) => ({ ...prev, photoLink: "" }));
  const removeProof = () => setFormData((prev) => ({ ...prev, proofLink: "" }));

  // Final registration after confirmation popup
  const handleConfirmRegistration = async () => {
    setShowConfirmPopup(false);
    setLoading(true);
    try {
      if (formData.email) await checkEmailUniqueness(formData.email);
      const authEmail = formData.email.trim()
        ? formData.email.trim().toLowerCase()
        : `${formData.phone}@provider.local`;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        authEmail,
        formData.password,
      );
      const user = userCredential.user;
      const providerData = {
        uid: user.uid,
        name: formData.name,
        email: authEmail,
        phone: formData.phone,
        serviceType: formData.serviceType,
        district: formData.district,
        block: formData.block,
        photoLink: formData.photoLink,
        proofLink: formData.proofLink,
        phoneVerified: false,
        emailVerified: !!formData.email,
        status: "pending",
        registrationDate: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, "providers", user.uid), providerData);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: authEmail,
        phone: formData.phone,
        role: "provider",
        createdAt: serverTimestamp(),
      });
      localStorage.setItem("userRole", "provider");
      setNotif({
        message:
          lang === "en"
            ? "Registration successful! Waiting for admin approval."
            : "பதிவு வெற்றி! நிர்வாக ஒப்புதலுக்காக காத்திருக்கவும்.",
        type: "success",
      });
      setTimeout(() => router.push("/provider/waiting"), 2000);
    } catch (err: any) {
      console.error(err);
      let msg = err.message;
      if (err.code === "auth/email-already-in-use")
        msg =
          lang === "en"
            ? "Email already in use"
            : "மின்னஞ்சல் ஏற்கனவே பயன்பாட்டில் உள்ளது";
      setNotif({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Validate all fields before showing confirmation popup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.photoLink || !formData.proofLink) {
      setNotif({
        message:
          lang === "en"
            ? "Please upload profile photo and proof document"
            : "சுயபடம் மற்றும் ஆவண சான்றை பதிவேற்றவும்",
        type: "error",
      });
      return;
    }
    const required = [
      "name",
      "phone",
      "serviceType",
      "district",
      "block",
      "password",
      "confirmPassword",
    ];
    const missing = required.filter(
      (f) => !formData[f as keyof typeof formData],
    );
    if (missing.length > 0) {
      setNotif({
        message:
          lang === "en"
            ? "Fill all required fields"
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
    if (formData.password.length < 6) {
      setNotif({
        message:
          lang === "en"
            ? "Password must be at least 6 characters"
            : "கடவுச்சொல் குறைந்தது 6 எழுத்துகள்",
        type: "error",
      });
      return;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      setNotif({
        message:
          lang === "en"
            ? "Enter a valid 10-digit phone number"
            : "சரியான 10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்",
        type: "error",
      });
      return;
    }
    setShowConfirmPopup(true);
  };

  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      <div className="h-16 flex-shrink-0"></div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
              {/* Header Section with GREEN Theme (matching login page) */}
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

              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Profile Photo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700 text-center">
                      {lang === "en" ? "Profile Photo" : "சுயபடம்"} *
                    </label>
                    <div className="flex flex-col items-center justify-center">
                      <div className="relative w-28 h-28 mb-3">
                        {formData.photoLink ? (
                          <>
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-green-100 shadow-md">
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
                              className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all hover:scale-105 active:scale-95"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <div className="w-full h-full rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 hover:border-green-400 transition-all">
                            {photoUploading ? (
                              <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                            ) : (
                              <User className="w-10 h-10 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={uploadPhoto}
                        disabled={photoUploading || loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-sm"
                      >
                        {photoUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {formData.photoLink
                          ? lang === "en"
                            ? "Change Photo"
                            : "படத்தை மாற்று"
                          : lang === "en"
                            ? "Upload Photo"
                            : "புகைப்படத்தை பதிவேற்று"}
                      </button>
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
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder={
                        lang === "en"
                          ? "Enter your full name"
                          : "உங்கள் முழு பெயரை உள்ளிடவும்"
                      }
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
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={10}
                      placeholder={
                        lang === "en"
                          ? "10-digit phone number"
                          : "10-இலக்க தொலைபேசி எண்"
                      }
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                    />
                  </div>

                  {/* Email (optional) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en"
                        ? "Email Address (optional)"
                        : "மின்னஞ்சல் (விருப்பத்தேர்வு)"}
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder={
                        lang === "en" ? "your@email.com" : "உங்கள் மின்னஞ்சல்"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                    />
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
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={loading}
                        placeholder={
                          lang === "en"
                            ? "Min 6 characters"
                            : "குறைந்தது 6 எழுத்துகள்"
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:text-gray-400 cursor-pointer active:bg-green-100 active:scale-95"
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
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder={
                          lang === "en"
                            ? "Confirm your password"
                            : "உங்கள் கடவுச்சொல்லை உறுதிப்படுத்தவும்"
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 disabled:text-gray-400 cursor-pointer active:bg-green-100 active:scale-95"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Service Type - with bilingual display */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Service Type" : "சேவை வகை"} *
                    </label>
                    <div className="relative" ref={serviceDropdownRef}>
                      <div
                        onClick={() =>
                          !loading &&
                          setShowServiceDropdown(!showServiceDropdown)
                        }
                        className={`w-full px-3 py-2 border rounded-lg flex items-center justify-between transition-all duration-200 ${
                          loading
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white hover:border-green-500 cursor-pointer"
                        } ${showServiceDropdown ? "border-green-500 ring-2 ring-green-200" : "border-gray-300"}`}
                      >
                        <span className="text-sm">
                          {formData.serviceType
                            ? getServiceDisplayName(formData.serviceType)
                            : lang === "en"
                              ? "Select service type"
                              : "சேவை வகையைத் தேர்ந்தெடுக்கவும்"}
                        </span>
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
                              className="p-0.5 hover:bg-gray-100 rounded"
                            >
                              <X className="w-3 h-3 text-gray-500" />
                            </button>
                          )}
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${showServiceDropdown ? "rotate-180" : ""}`}
                          />
                        </div>
                      </div>
                      {showServiceDropdown && !loading && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-hidden">
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
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                autoFocus
                              />
                            </div>
                          </div>
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
                                    <div className="text-sm font-medium">
                                      {service.en}{" "}
                                      <span className="text-gray-500 text-xs">
                                        ({service.ta})
                                      </span>
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
                      {lang === "en" ? "Block / Taluk" : "பிளாக் / தாலுகா"} *
                    </label>
                    <input
                      type="text"
                      name="block"
                      value={formData.block}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      placeholder={
                        lang === "en"
                          ? "Enter your block / taluk"
                          : "உங்கள் பிளாக் / தாலுகாவை உள்ளிடவும்"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-green-400 cursor-text"
                    />
                  </div>

                  {/* Proof Document */}
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
                                className="text-xs text-green-600 hover:text-green-700 hover:underline transition-all"
                              >
                                {lang === "en"
                                  ? "View Document"
                                  : "ஆவணத்தை பார்க்க"}
                              </a>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={uploadProof}
                              disabled={proofUploading || loading}
                              className="px-3 py-1.5 text-sm bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                            >
                              {proofUploading ? (
                                <Loader2 className="w-3 h-3 animate-spin inline" />
                              ) : lang === "en" ? (
                                "Change"
                              ) : (
                                "மாற்று"
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={removeProof}
                              disabled={proofUploading || loading}
                              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all hover:scale-105 active:scale-95"
                            >
                              {lang === "en" ? "Remove" : "நீக்கு"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                            <Shield className="w-8 h-8 text-gray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={uploadProof}
                            disabled={proofUploading || loading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm shadow-sm"
                          >
                            {proofUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                            ) : (
                              <Upload className="w-4 h-4 inline mr-1" />
                            )}
                            {lang === "en"
                              ? "Upload Document"
                              : "ஆவணத்தை பதிவேற்று"}
                          </button>
                          <p className="text-xs text-gray-500 mt-2">
                            {lang === "en"
                              ? "Image or PDF (max 10MB)"
                              : "படம் அல்லது PDF (அதிகபட்சம் 10MB)"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      disabled={loading}
                      className="mt-0.5 rounded focus:ring-green-400 cursor-pointer"
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs text-gray-600 cursor-pointer"
                    >
                      {lang === "en"
                        ? "I agree to terms & privacy policy"
                        : "நான் விதிமுறைகள் & தனியுரிமைக் கொள்கைக்கு ஒப்புக்கொள்கிறேன்"}
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      loading || !formData.photoLink || !formData.proofLink
                    }
                    className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-md"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    ) : null}
                    {lang === "en"
                      ? "Complete Registration"
                      : "பதிவை முடிக்கவும்"}
                  </button>

                  {/* Back to Home Button */}
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 active:from-green-300 active:to-emerald-300 text-green-700 border border-green-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Home className="w-4 h-4" />
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
                      className="text-green-600 hover:text-green-700 font-medium underline transition-all duration-200 cursor-pointer hover:scale-105"
                    >
                      {lang === "en" ? "Login here" : "இங்கே உள்நுழையவும்"}
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <p className="text-center text-[10px] text-gray-500 mt-3 px-2">
              {lang === "en"
                ? "All fields are mandatory. Approval may take 24-48 hours."
                : "அனைத்து புலங்களும் கட்டாயமானவை. ஒப்புதல் 24-48 மணிநேரம் ஆகலாம்."}
            </p>
          </motion.div>
        </div>
      </div>
      <div className="h-4 flex-shrink-0"></div>

      {/* Confirmation Popup Modal */}
      {showConfirmPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              {lang === "en"
                ? "Confirm Your Details"
                : "உங்கள் விவரங்களை உறுதிப்படுத்தவும்"}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold w-20">
                  {lang === "en" ? "Email:" : "மின்னஞ்சல்:"}
                </span>
                <span className="text-gray-700">
                  {formData.email ||
                    (lang === "en" ? "Not provided" : "வழங்கப்படவில்லை")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold w-20">
                  {lang === "en" ? "Phone:" : "தொலைபேசி:"}
                </span>
                <span className="text-gray-700">{formData.phone}</span>
              </div>
              <p className="text-sm text-yellow-600 mt-3 p-2 bg-yellow-50 rounded-lg">
                {lang === "en"
                  ? "⚠️ Please verify that your email and phone are correct. You cannot change them after registration."
                  : "⚠️ உங்கள் மின்னஞ்சல் மற்றும் தொலைபேசி சரியானதா என சரிபார்க்கவும். பதிவுக்குப் பிறகு அவற்றை மாற்ற முடியாது."}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {lang === "en" ? "Edit" : "திருத்து"}
              </button>
              <button
                onClick={handleConfirmRegistration}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {lang === "en"
                  ? "Confirm & Register"
                  : "உறுதிப்படுத்தி பதிவு செய்"}
              </button>
            </div>
          </div>
        </div>
      )}

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
