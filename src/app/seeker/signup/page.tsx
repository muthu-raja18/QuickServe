"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Home, Loader2 } from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";
import Notification from "../../components/Notification";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const SeekerSignupPage: React.FC = () => {
  const router = useRouter();
  const { lang } = useLanguage();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const requiredFields = ["name", "email", "password", "confirmPassword"];
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

    setLoading(true);

    try {
      // 1. Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.toLowerCase(),
        formData.password
      );

      const user = userCredential.user;

      // 2. Store role in localStorage
      localStorage.setItem("userRole", "seeker");

      // 3. Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email.toLowerCase(),
        role: "seeker",
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setNotif({
        message:
          lang === "en"
            ? "🎉 Registration successful! Redirecting to dashboard..."
            : "🎉 பதிவு வெற்றிகரமாக! டாஷ்போர்டுக்கு திருப்பி விடப்படுகிறது...",
        type: "success",
      });

      // Redirect to seeker dashboard
      setTimeout(() => {
        router.push("/seeker/dashboard");
      }, 1500);
    } catch (err: any) {
      console.error("Signup error:", err);

      let errorMessage = "Registration failed";
      if (err.code === "auth/email-already-in-use") {
        errorMessage =
          lang === "en"
            ? "Email already exists. Please login."
            : "மின்னஞ்சல் ஏற்கனவே உள்ளது. தயவு செய்து உள்நுழையவும்";
      } else if (err.code === "auth/invalid-email") {
        errorMessage =
          lang === "en" ? "Invalid email address" : "தவறான மின்னஞ்சல் முகவரி";
      } else if (err.code === "auth/weak-password") {
        errorMessage =
          lang === "en"
            ? "Password is too weak. Use at least 6 characters"
            : "கடவுச்சொல் மிகவும் பலவீனமானது. குறைந்தது 6 எழுத்துகளைப் பயன்படுத்தவும்";
      }

      setNotif({
        message: errorMessage,
        type: "error",
      });
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
      {/* Spacing from Navbar */}
      <div className="h-16 flex-shrink-0"></div>

      {/* Scrollable form container */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-sm"
          >
            {/* Card Container */}
            <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200 mb-4">
              {/* Header Section with Indigo Theme */}
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

              {/* Form Section */}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-indigo-300"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-700">
                      {lang === "en" ? "Email Address" : "மின்னஞ்சல் முகவரி"} *
                    </label>
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
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-indigo-300"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-indigo-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 disabled:text-gray-400 disabled:hover:bg-transparent active:bg-indigo-100 active:scale-95"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 hover:border-indigo-300 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200 disabled:text-gray-400 disabled:hover:bg-transparent active:bg-indigo-100 active:scale-95"
                        aria-label={
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm shadow-md hover:shadow-lg active:shadow-md"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
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

                  {/* Back to Home Button */}
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 active:from-indigo-300 active:to-purple-300 text-indigo-700 border border-indigo-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow active:shadow-sm"
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
                      onClick={() => !loading && router.push("/seeker/login")}
                      disabled={loading}
                      className="text-indigo-600 hover:text-indigo-700 active:text-indigo-800 font-medium underline disabled:text-gray-500 transition-all duration-200 hover:scale-105 active:scale-95"
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
                ? "All fields are mandatory for verification."
                : "சரிபார்ப்புக்கு அனைத்து புலங்களும் கட்டாயமாகும்."}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-4 flex-shrink-0"></div>

      {/* Notification */}
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
