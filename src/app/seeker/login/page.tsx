"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithPopup, signOut } from "firebase/auth";
import { FcGoogle } from "react-icons/fc";
import { auth, googleProvider, db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext";
import Notification from "../../components/Notification";
import { Eye, EyeOff } from "lucide-react";
import { loginWithRole } from "../../firebase/authWithRole";

export default function SeekerLoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ---------------- EMAIL LOGIN ---------------- */
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await loginWithRole(email, password, "seeker");

      if (!result.success) {
        setNotif({ message: result.error, type: "error" });
        return;
      }

      setNotif({
        message: lang === "en" ? "Login successful!" : "உள்நுழைவு வெற்றி!",
        type: "success",
      });

      setTimeout(() => router.push("/seeker/dashboard"), 1200);
    } catch {
      setNotif({
        message: lang === "en" ? "Login failed" : "உள்நுழைவு தோல்வி",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- GOOGLE LOGIN ---------------- */
  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error("Google account has no email");
      }

      // 🔍 CHECK USER BY EMAIL
      const q = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0].data();

        // ❌ ROLE CONFLICT
        if (existingUser.role !== "seeker") {
          await signOut(auth);
          throw new Error(
            lang === "en"
              ? "This email is already registered as a Provider"
              : "இந்த மின்னஞ்சல் சேவை வழங்குநராக பதிவு செய்யப்பட்டுள்ளது"
          );
        }

        // ✅ EXISTING SEEKER → LOGIN OK
      } else {
        // ✅ NEW SEEKER → CREATE ACCOUNT
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || "",
          email: user.email,
          role: "seeker",
          authProvider: "google",
          createdAt: serverTimestamp(),
        });
      }

      setNotif({
        message: lang === "en" ? "Login successful!" : "உள்நுழைவு வெற்றி!",
        type: "success",
      });

      setTimeout(() => router.push("/seeker/dashboard"), 1200);
    } catch (err: any) {
      setNotif({
        message:
          err.message ||
          (lang === "en" ? "Google login failed" : "Google உள்நுழைவு தோல்வி"),
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col">
      <div className="h-16 flex-shrink-0" />

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {lang === "en" ? "Welcome Back" : "மீண்டும் வருக"}
              </h1>
              <p className="text-gray-600">
                {lang === "en"
                  ? "Sign in to your seeker account"
                  : "உங்கள் தேடுநர் கணக்கில் உள்நுழையவும்"}
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === "en" ? "Email" : "மின்னஞ்சல்"}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder={
                    lang === "en"
                      ? "Enter your email"
                      : "உங்கள் மின்னஞ்சலை உள்ளீடு செய்யவும்"
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {lang === "en" ? "Password" : "கடவுச்சொல்"}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder={
                      lang === "en"
                        ? "Enter your password"
                        : "உங்கள் கடவுச்சொல்லை உள்ளீடு செய்யவும்"
                    }
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === "en" ? "Signing in..." : "உள்நுழைகிறது..."}
                  </>
                ) : lang === "en" ? (
                  "Sign In"
                ) : (
                  "உள்நுழைய"
                )}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  {lang === "en" ? "Or continue with" : "அல்லது தொடரவும்"}
                </span>
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-50 disabled:bg-gray-100 border border-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-3"
            >
              <FcGoogle size={20} />
              {lang === "en" ? "Continue with Google" : "Google உடன் தொடரவும்"}
            </button>

            <div className="text-center">
              <p className="text-gray-600">
                {lang === "en" ? "Don't have an account?" : "கணக்கு இல்லையா?"}{" "}
                <a
                  href="/seeker/signup"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {lang === "en" ? "Sign up" : "பதிவு செய்ய"}
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

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
