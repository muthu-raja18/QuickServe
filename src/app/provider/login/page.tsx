"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import Notification from "../../components/Notification";
import { useLanguage } from "../../context/LanguageContext";

// Define user type for better TypeScript support
interface AuthUser {
  uid: string;
  email: string;
  role: "seeker" | "provider" | "admin";
  isApproved?: boolean;
  name?: string;
  phone?: string;
  // Add other user properties as needed
}

export default function ProviderLoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { login, user } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  /* ---------- Mount fix ---------- */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ---------- Redirect only when APPROVED ---------- */
  useEffect(() => {
    if (user?.role === "provider" && user.isApproved) {
      setRedirecting(true);
      const timer = setTimeout(() => {
        router.replace("/provider/dashboard");
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  /* ---------- Show status messages for non-approved providers ---------- */
  useEffect(() => {
    if (user?.role === "provider" && user.isApproved === false && !loading) {
      setNotif({
        message:
          lang === "en"
            ? "Your account is waiting for admin approval. You will be redirected once approved."
            : "உங்கள் கணக்கு நிர்வாக ஒப்புதலுக்காக காத்திருக்கிறது. ஒப்புதல் பெற்றவுடன் திருப்பி விடப்படுவீர்கள்.",
        type: "error",
      });
    }
  }, [user, loading, lang]);

  /* ---------- Login ---------- */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter both email and password"
            : "மின்னஞ்சல் மற்றும் கடவுச்சொல் இரண்டையும் உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter a valid email address"
            : "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setNotif(null);

    try {
      const result = await login(
        email.toLowerCase().trim(),
        password,
        "provider"
      );

      if (!result.success) {
        setNotif({
          message:
            result.error ||
            (lang === "en"
              ? "Login failed. Please check your credentials."
              : "உள்நுழைவு தோல்வியடைந்தது. உங்கள் சான்றுகளை சரிபார்க்கவும்."),
          type: "error",
        });
        return;
      }

      // Login successful - the useEffect will handle redirect based on approval status
      setNotif({
        message:
          lang === "en"
            ? "Login successful! Redirecting to dashboard..."
            : "உள்நுழைவு வெற்றி! டாஷ்போர்டுக்கு திருப்பி விடப்படுகிறது...",
        type: "success",
      });

      // Auto-redirect handled by useEffect
    } catch (err: any) {
      console.error("Login error:", err);
      setNotif({
        message:
          err.message ||
          (lang === "en"
            ? "An unexpected error occurred. Please try again."
            : "எதிர்பாராத பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-indigo-100 to-purple-100">
        <div className="animate-pulse text-sm text-indigo-600">
          {lang === "en" ? "Loading..." : "லோட் செய்யப்படுகிறது..."}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gradient-to-br from-indigo-50 via-indigo-100 to-purple-100 flex flex-col">
      {/* Spacing for navbar */}
      <div className="h-16 flex-shrink-0" />

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Login card */}
          <div className="bg-white rounded-xl shadow-xl border border-indigo-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-center">
              <h1 className="text-xl font-bold text-white">QuickServe</h1>
              <h2 className="text-sm font-semibold text-indigo-100 mt-1">
                {lang === "en"
                  ? "Service Provider Login"
                  : "சேவை வழங்குநர் உள்நுழைவு"}
              </h2>
              <p className="text-[11px] text-indigo-200 mt-1">
                {lang === "en"
                  ? "Manage your services professionally"
                  : "உங்கள் சேவைகளை தொழில்முறையாக நிர்வகிக்கவும்"}
              </p>
            </div>

            {/* Form */}
            <div className="p-5">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {lang === "en" ? "Email" : "மின்னஞ்சல்"} *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading || redirecting}
                    required
                    placeholder={
                      lang === "en"
                        ? "Enter your email"
                        : "உங்கள் மின்னஞ்சலை உள்ளிடவும்"
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    {lang === "en" ? "Password" : "கடவுச்சொல்"} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || redirecting}
                      required
                      placeholder={
                        lang === "en"
                          ? "Enter your password"
                          : "உங்கள் கடவுச்சொல்லை உள்ளிடவும்"
                      }
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500 outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading || redirecting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600 transition disabled:text-gray-400"
                      aria-label={
                        showPassword
                          ? lang === "en"
                            ? "Hide password"
                            : "கடவுச்சொல்லை மறை"
                          : lang === "en"
                          ? "Show password"
                          : "கடவுச்சொல்லை காட்டு"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Forgot password link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => router.push("/provider/forgot-password")}
                    disabled={loading || redirecting}
                    className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline transition disabled:text-gray-400"
                  >
                    {lang === "en"
                      ? "Forgot password?"
                      : "கடவுச்சொல் மறந்துவிட்டதா?"}
                  </button>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || redirecting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition duration-200 disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {redirecting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                      {lang === "en"
                        ? "Redirecting..."
                        : "திருப்பி விடப்படுகிறது..."}
                    </>
                  ) : loading ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                      {lang === "en" ? "Logging in..." : "உள்நுழைகிறது..."}
                    </>
                  ) : lang === "en" ? (
                    "Login"
                  ) : (
                    "உள்நுழைய"
                  )}
                </button>
              </form>

              {/* Signup link */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-center text-xs text-gray-600">
                  {lang === "en" ? "New provider?" : "புதிய வழங்குநரா?"}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      !loading &&
                      !redirecting &&
                      router.push("/provider/signup")
                    }
                    disabled={loading || redirecting}
                    className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition disabled:text-gray-400"
                  >
                    {lang === "en" ? "Sign up here" : "இங்கே பதிவு செய்யவும்"}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-center text-[10px] text-gray-500 mt-3 px-4">
            {lang === "en"
              ? "Provider accounts require admin approval. Approval may take 24-48 hours."
              : "வழங்குநர் கணக்குகளுக்கு நிர்வாக ஒப்புதல் தேவை. ஒப்புதல் 24-48 மணிநேரம் எடுக்கலாம்."}
          </p>
        </motion.div>
      </div>

      {/* Notification */}
      {notif && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <Notification
            message={notif.message}
            type={notif.type}
            onClose={() => setNotif(null)}
          />
        </div>
      )}
    </div>
  );
}
