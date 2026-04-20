"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Home, Loader2, CheckCircle } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import Notification from "../../components/Notification";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  doc,
  setDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";

const SeekerSignupPage: React.FC = () => {
  const router = useRouter();
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    identifier: "", // email or username
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Helper to determine if identifier is email or username
  const isEmail = (value: string) => {
    return /^\S+@\S+\.\S+$/.test(value);
  };

  // Check uniqueness: email, username, phone
  const checkUniqueness = async (identifier: string, phone: string) => {
    const usersRef = collection(db, "users");
    const isEmailValue = isEmail(identifier);
    const emailToCheck = isEmailValue ? identifier.toLowerCase() : null;
    const usernameToCheck = !isEmailValue ? identifier.toLowerCase() : null;

    if (emailToCheck) {
      const emailQuery = query(usersRef, where("email", "==", emailToCheck));
      const emailSnap = await getDocs(emailQuery);
      if (!emailSnap.empty)
        throw new Error(
          lang === "en" ? "Email already exists" : "மின்னஞ்சல் ஏற்கனவே உள்ளது",
        );
    }
    if (usernameToCheck) {
      const usernameQuery = query(
        usersRef,
        where("username", "==", usernameToCheck),
      );
      const usernameSnap = await getDocs(usernameQuery);
      if (!usernameSnap.empty)
        throw new Error(
          lang === "en"
            ? "Username already taken"
            : "பயனர்பெயர் ஏற்கனவே எடுக்கப்பட்டது",
        );
    }
    if (phone) {
      const phoneQuery = query(usersRef, where("phone", "==", phone));
      const phoneSnap = await getDocs(phoneQuery);
      if (!phoneSnap.empty)
        throw new Error(
          lang === "en"
            ? "Phone number already registered"
            : "தொலைபேசி எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது",
        );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const requiredFields = [
      "name",
      "identifier",
      "phone",
      "password",
      "confirmPassword",
    ];
    const missing = requiredFields.filter(
      (f) => !formData[f as keyof typeof formData],
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

    if (formData.password.length < 6) {
      setNotif({
        message:
          lang === "en"
            ? "Password must be at least 6 characters"
            : "கடவுச்சொல் குறைந்தது 6 எழுத்துகளாக இருக்க வேண்டும்",
        type: "error",
      });
      return;
    }

    // Phone number validation (10 digits, numeric)
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

    const identifier = formData.identifier.trim();
    const isEmailValue = isEmail(identifier);

    // If it's an email, validate format
    if (isEmailValue && !/^\S+@\S+\.\S+$/.test(identifier)) {
      setNotif({
        message:
          lang === "en" ? "Invalid email address" : "தவறான மின்னஞ்சல் முகவரி",
        type: "error",
      });
      return;
    }

    // If it's a username, validate length (min 3 chars)
    if (!isEmailValue && identifier.length < 3) {
      setNotif({
        message:
          lang === "en"
            ? "Username must be at least 3 characters"
            : "பயனர்பெயர் குறைந்தது 3 எழுத்துகளாக இருக்க வேண்டும்",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      await checkUniqueness(identifier, formData.phone);

      let authEmail = "";
      let finalEmail = null;
      let finalUsername = null;

      if (isEmailValue) {
        authEmail = identifier.toLowerCase();
        finalEmail = authEmail;
      } else {
        // Generate dummy email from username + random suffix
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const generatedDummyEmail = `${identifier.toLowerCase()}_${randomSuffix}@quickserve.local`;
        authEmail = generatedDummyEmail;
        finalEmail = generatedDummyEmail;
        finalUsername = identifier.toLowerCase();
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        authEmail,
        formData.password,
      );
      const user = userCredential.user;

      localStorage.setItem("userRole", "seeker");

      const userData: any = {
        uid: user.uid,
        name: formData.name,
        phone: formData.phone,
        role: "seeker",
        email: finalEmail,
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (finalUsername) userData.username = finalUsername;

      await setDoc(doc(db, "users", user.uid), userData);

      // Show success message with username for username signup
      if (!isEmailValue && finalUsername) {
        setNotif({
          message:
            lang === "en"
              ? `🎉 Registration successful! Your username is "${finalUsername}". You can now login with your username.`
              : `🎉 பதிவு வெற்றிகரமாக! உங்கள் பயனர்பெயர் "${finalUsername}". இப்போது உங்கள் பயனர்பெயருடன் உள்நுழையலாம்.`,
          type: "success",
        });
      } else {
        setNotif({
          message:
            lang === "en"
              ? "🎉 Registration successful! Redirecting to dashboard..."
              : "🎉 பதிவு வெற்றிகரமாக! டாஷ்போர்டுக்கு திருப்பி விடப்படுகிறது...",
          type: "success",
        });
      }

      setTimeout(() => {
        router.push("/seeker/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Signup error:", err);
      let errorMessage = "Registration failed";
      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          lang === "en"
            ? "This username is already taken. Please choose another."
            : "இந்த பயனர்பெயர் ஏற்கனவே எடுக்கப்பட்டுள்ளது. வேறொன்றைத் தேர்ந்தெடுக்கவும்.";
      } else if (err.code === "auth/invalid-email") {
        errorMessage =
          lang === "en" ? "Invalid email address" : "தவறான மின்னஞ்சல் முகவரி";
      } else if (err.code === "auth/weak-password") {
        errorMessage =
          lang === "en"
            ? "Password is too weak. Use at least 6 characters"
            : "கடவுச்சொல் மிகவும் பலவீனமானது. குறைந்தது 6 எழுத்துகளைப் பயன்படுத்தவும்";
      } else if (err.message) {
        errorMessage = err.message;
      }
      setNotif({ message: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      <div className="h-16 flex-shrink-0"></div>
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-4">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-center">
                <h1 className="text-xl font-bold text-white">QuickServe</h1>
                <h2 className="text-base font-semibold text-indigo-100 mt-1">
                  {lang === "en"
                    ? "Seeker Registration"
                    : "சேவை தேடுபவர் பதிவு"}
                </h2>
                <p className="text-xs text-indigo-200 mt-1">
                  {lang === "en"
                    ? "Join as a service seeker"
                    : "சேவை தேடுபவராக இணையுங்கள்"}
                </p>
              </div>

              <div className="p-5">
                <form onSubmit={handleSubmit} className="space-y-3">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100"
                    />
                  </div>

                  {/* Email or Username (combined) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en"
                        ? "Email or Username"
                        : "மின்னஞ்சல் அல்லது பயனர்பெயர்"}{" "}
                      *
                    </label>
                    <input
                      type="text"
                      name="identifier"
                      placeholder={
                        lang === "en"
                          ? "Enter email or choose username"
                          : "மின்னஞ்சல் அல்லது பயனர்பெயரை உள்ளிடவும்"
                      }
                      value={formData.identifier}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100"
                    />
                    <p className="text-xs text-gray-400">
                      {lang === "en"
                        ? "Use '@' for email, otherwise treated as username"
                        : "மின்னஞ்சலுக்கு '@' பயன்படுத்தவும், இல்லையெனில் பயனர்பெயராக கருதப்படும்"}
                    </p>
                  </div>

                  {/* Phone Number (required) */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Phone Number" : "தொலைபேசி எண்"} *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder={
                        lang === "en"
                          ? "Enter 10-digit phone number"
                          : "10-இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
                      }
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600 rounded-lg transition-all duration-200 cursor-pointer"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline" />
                        {lang === "en"
                          ? "Processing..."
                          : "செயல்படுத்தப்படுகிறது..."}
                      </>
                    ) : lang === "en" ? (
                      "Complete Registration"
                    ) : (
                      "பதிவை முடிக்கவும்"
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 border border-indigo-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Home className="w-4 h-4" />
                    {lang === "en" ? "Back to Home" : "முகப்புக்குத் திரும்பு"}
                  </button>
                </form>

                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600">
                    {lang === "en"
                      ? "Already have an account?"
                      : "ஏற்கனவே கணக்கு உள்ளதா?"}{" "}
                    <button
                      type="button"
                      onClick={() => !loading && router.push("/seeker/login")}
                      disabled={loading}
                      className="text-indigo-600 hover:text-indigo-700 font-medium underline cursor-pointer"
                    >
                      {lang === "en" ? "Login here" : "இங்கே உள்நுழையவும்"}
                    </button>
                  </p>
                </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-gray-500 px-2">
              {lang === "en"
                ? "All fields are mandatory."
                : "அனைத்து புலங்களும் கட்டாயமானவை."}
            </p>
          </motion.div>
        </div>
      </div>
      <div className="h-4 flex-shrink-0"></div>

      {notif && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
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

export default SeekerSignupPage;
