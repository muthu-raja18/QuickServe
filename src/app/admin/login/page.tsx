"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import { Shield } from "lucide-react";

import { auth, db } from "../../firebase/config";
import Notification from "../../components/Notification";
import { useLanguage } from "../../context/LanguageContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1️⃣ Firebase Auth login
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // 2️⃣ Check admin role in Firestore
      const adminRef = doc(db, "admins", uid);
      const adminSnap = await getDoc(adminRef);

      if (!adminSnap.exists()) {
        await auth.signOut();
        throw new Error(
          lang === "en"
            ? "Unauthorized admin access."
            : "அங்கீகரிக்கப்படாத நிர்வாக அணுகல்."
        );
      }

      // 3️⃣ Success
      setNotif({
        message:
          lang === "en"
            ? "Admin login successful!"
            : "நிர்வாகி உள்நுழைவு வெற்றி!",
        type: "success",
      });

      setTimeout(() => router.push("/admin/dashboard"), 1200);
    } catch (err: any) {
      let msg =
        lang === "en" ? "Admin login failed." : "நிர்வாகி உள்நுழைவு தோல்வி.";

      if (err.code === "auth/invalid-credential") {
        msg =
          lang === "en"
            ? "Incorrect email or password."
            : "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்.";
      }

      setNotif({ message: msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Spacing from Navbar - top space */}
      <div className="h-16 flex-shrink-0"></div>

      {/* Centered content with equal top and bottom spacing */}
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Card Container */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            {/* Header Section with Branding */}
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-4 text-center">
              <div className="flex justify-center mb-2">
                <Shield className="text-white" size={32} />
              </div>
              <h1 className="text-xl font-bold text-white">QuickServe</h1>
              <h2 className="text-base font-semibold text-gray-200 mt-1">
                {lang === "en" ? "Admin Login" : "நிர்வாகி உள்நுழைவு"}
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                {lang === "en"
                  ? "Access admin control panel"
                  : "நிர்வாக கட்டுப்பாட்டு பேனலை அணுகுங்கள்"}
              </p>
            </div>

            {/* Form Section */}
            <div className="p-5">
              <form onSubmit={handleLogin} className="space-y-3">
                {/* Email Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    {lang === "en" ? "Email" : "மின்னஞ்சல்"}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "Enter admin email"
                        : "நிர்வாக மின்னஞ்சலை உள்ளிடவும்"
                    }
                    disabled={loading}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-700 focus:ring-1 focus:ring-gray-200 outline-none transition text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    {lang === "en" ? "Password" : "கடவுச்சொல்"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        lang === "en"
                          ? "Enter password"
                          : "கடவுச்சொல்லை உள்ளிடவும்"
                      }
                      disabled={loading}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-700 focus:ring-1 focus:ring-gray-200 outline-none transition text-sm disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition disabled:text-gray-400"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-sm mt-2"
                >
                  {loading
                    ? lang === "en"
                      ? "Logging in..."
                      : "உள்நுழைகிறது..."
                    : lang === "en"
                    ? "Login as Admin"
                    : "நிர்வாகியாக உள்நுழைய"}
                </button>
              </form>

              {/* Security Note */}
              <div className="mt-4 p-2 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 text-center">
                  {lang === "en"
                    ? "⚠️ Restricted access - authorized personnel only"
                    : "⚠️ கட்டுப்படுத்தப்பட்ட அணுகல் - அங்கீகரிக்கப்பட்ட பணியாளர்கள் மட்டுமே"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[10px] text-gray-500 mt-3 px-2">
            {lang === "en"
              ? "For security reasons, do not share your admin credentials"
              : "பாதுகாப்பு காரணங்களுக்காக, உங்கள் நிர்வாக அங்கீகாரங்களைப் பகிர வேண்டாம்"}
          </p>
        </motion.div>
      </div>

      {/* Spacing from bottom - bottom space */}
      <div className="h-16 flex-shrink-0"></div>

      {/* Notification positioned absolutely so it doesn't affect layout */}
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
}
