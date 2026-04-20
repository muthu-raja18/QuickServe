"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import Notification from "../../components/Notification";
import { Eye, EyeOff, Home } from "lucide-react";
import { auth, db } from "../../firebase/config";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function ProviderLoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, loading, initialized, manualSetUser, refreshUser } = useAuth();

  const [identifier, setIdentifier] = useState(""); // email or phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-redirect if already logged in AND approved
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!loading && initialized && user?.uid) {
        try {
          const providerDoc = await getDoc(doc(db, "providers", user.uid));
          if (providerDoc.exists()) {
            const providerData = providerDoc.data();
            if (providerData.status === "approved") {
              router.push("/provider/dashboard");
            } else if (providerData.status === "pending") {
              router.push("/provider/waiting");
            }
          }
        } catch (error) {
          console.error("Auto-redirect error:", error);
        }
      }
    };
    checkAndRedirect();
  }, [user, loading, initialized, router]);

  // Resolve identifier (email or phone) to actual email
  const resolveIdentifierToEmail = async (
    input: string,
  ): Promise<string | null> => {
    const trimmed = input.trim().toLowerCase();

    // Check if input is email format
    const isEmailFormat = /^\S+@\S+\.\S+$/.test(trimmed);
    if (isEmailFormat) {
      console.log("📧 Checking as email...");
      // Check in providers collection
      const providersRef = collection(db, "providers");
      const q = query(providersRef, where("email", "==", trimmed));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const email = snap.docs[0].data().email;
        console.log("✅ Found email in providers:", email);
        return email;
      }
      // Also check users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("email", "==", trimmed));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        const email = userSnap.docs[0].data().email;
        console.log("✅ Found email in users:", email);
        return email;
      }
      return null;
    }

    // Check if input is phone number (10 digits)
    const isPhoneFormat = /^\d{10}$/.test(trimmed);
    if (isPhoneFormat) {
      console.log("📱 Checking as phone number...");
      // Check in providers collection
      const providersRef = collection(db, "providers");
      const q = query(providersRef, where("phone", "==", trimmed));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const email = snap.docs[0].data().email;
        console.log("✅ Found email by phone in providers:", email);
        return email;
      }
      // Check in users collection
      const usersRef = collection(db, "users");
      const userQuery = query(usersRef, where("phone", "==", trimmed));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        const email = userSnap.docs[0].data().email;
        console.log("✅ Found email by phone in users:", email);
        return email;
      }
      return null;
    }

    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier || !password) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter email/phone and password"
            : "மின்னஞ்சல்/தொலைபேசி மற்றும் கடவுச்சொல்லை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setFormLoading(true);

    try {
      // Resolve identifier to email
      const resolvedEmail = await resolveIdentifierToEmail(identifier);

      if (!resolvedEmail) {
        setNotif({
          message:
            lang === "en"
              ? "No account found with this email/phone. Please sign up first."
              : "இந்த மின்னஞ்சல்/தொலைபேசியுடன் கணக்கு இல்லை. தயவுசெய்து முதலில் பதிவு செய்யவும்.",
          type: "error",
        });
        setFormLoading(false);
        return;
      }

      console.log(`🔐 Attempting login with resolved email: ${resolvedEmail}`);

      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        resolvedEmail,
        password,
      );
      const currentUser = userCredential.user;

      // Check if provider document exists
      const providerDoc = await getDoc(doc(db, "providers", currentUser.uid));

      if (!providerDoc.exists()) {
        await auth.signOut();
        throw new Error(
          lang === "en"
            ? "Provider account not found. Please sign up as a provider."
            : "சேவை வழங்குநர் கணக்கு கிடைக்கவில்லை. சேவை வழங்குநராக பதிவு செய்யவும்",
        );
      }

      const providerData = providerDoc.data();

      // Update AuthContext
      if (manualSetUser) {
        manualSetUser({
          uid: currentUser.uid,
          email: currentUser.email,
          role: "provider",
        });
      }

      localStorage.setItem("userRole", "provider");
      await refreshUser();

      // Route based on approval status
      if (providerData.status === "approved") {
        setNotif({
          message: lang === "en" ? "Login successful!" : "உள்நுழைவு வெற்றி!",
          type: "success",
        });
        setTimeout(() => {
          router.push("/provider/dashboard");
        }, 800);
      } else if (providerData.status === "pending") {
        setNotif({
          message:
            lang === "en"
              ? "Your account is pending admin approval. Redirecting to waiting page."
              : "உங்கள் கணக்கு நிர்வாக ஒப்புதலுக்காக காத்திருக்கிறது. காத்திருக்கும் பக்கத்திற்கு திருப்பி விடப்படுகிறது.",
          type: "info",
        });
        setTimeout(() => {
          router.push("/provider/waiting");
        }, 800);
      } else if (providerData.status === "rejected") {
        setNotif({
          message:
            lang === "en"
              ? "Your account has been rejected. Please contact admin for more information."
              : "உங்கள் கணக்கு நிராகரிக்கப்பட்டது. மேலும் தகவலுக்கு நிர்வாகியை தொடர்பு கொள்ளவும்.",
          type: "error",
        });
      }
    } catch (error: any) {
      console.error("Provider login error:", error);

      let errorMessage = lang === "en" ? "Login failed" : "உள்நுழைவு தோல்வி";

      if (error.code === "auth/invalid-credential") {
        errorMessage =
          lang === "en"
            ? "Invalid email/phone or password"
            : "தவறான மின்னஞ்சல்/தொலைபேசி அல்லது கடவுச்சொல்";
      } else if (error.code === "auth/user-not-found") {
        errorMessage =
          lang === "en"
            ? "No account found with this email/phone"
            : "இந்த மின்னஞ்சல்/தொலைபேசியுடன் கணக்கு கிடைக்கவில்லை";
      } else if (error.code === "auth/wrong-password") {
        errorMessage =
          lang === "en" ? "Incorrect password" : "தவறான கடவுச்சொல்";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage =
          lang === "en"
            ? "Too many failed attempts. Try again later"
            : "பல தோல்வியுற்ற முயற்சிகள். பின்னர் முயற்சிக்கவும்";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setNotif({ message: errorMessage, type: "error" });
    } finally {
      setFormLoading(false);
    }
  };

  const goToHome = () => router.push("/");

  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  if (loading && !initialized) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      <div className="h-16 flex-shrink-0"></div>
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4 text-center">
              <h1 className="text-xl font-bold text-white">QuickServe</h1>
              <h2 className="text-base font-semibold text-green-100 mt-1">
                {lang === "en" ? "Provider Login" : "சேவை வழங்குநர் உள்நுழைவு"}
              </h2>
              <p className="text-xs text-green-200 mt-1">
                {lang === "en"
                  ? "Access your provider account"
                  : "உங்கள் சேவை வழங்குநர் கணக்கை அணுகுங்கள்"}
              </p>
            </div>

            <div className="p-5">
              {!loading && user?.role === "provider" && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {lang === "en"
                      ? "⚠️ You are already logged in. Login will replace current session."
                      : "⚠️ நீங்கள் ஏற்கனவே உள்நுழைந்துள்ளீர்கள். உள்நுழைவு தற்போதைய அமர்வை மாற்றும்."}
                  </p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email / Phone Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    {lang === "en"
                      ? "Email or Phone Number"
                      : "மின்னஞ்சல் அல்லது தொலைபேசி எண்"}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "Enter your email or phone number"
                        : "உங்கள் மின்னஞ்சல் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்"
                    }
                    disabled={formLoading}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === "en"
                      ? "Use email address or 10-digit phone number"
                      : "மின்னஞ்சல் முகவரி அல்லது 10-இலக்க தொலைபேசி எண்ணைப் பயன்படுத்தவும்"}
                  </p>
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    {lang === "en" ? "Password" : "கடவுச்சொல்"} *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        lang === "en"
                          ? "Enter your password"
                          : "உங்கள் கடவுச்சொல்லை உள்ளிடவும்"
                      }
                      disabled={formLoading}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={formLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200 cursor-pointer active:bg-green-100 active:scale-95"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg cursor-pointer"
                >
                  {formLoading
                    ? lang === "en"
                      ? "Logging in..."
                      : "உள்நுழைகிறது..."
                    : lang === "en"
                      ? "Sign In"
                      : "உள்நுழைய"}
                </button>

                {/* Back to Home Button */}
                <button
                  type="button"
                  onClick={goToHome}
                  disabled={formLoading}
                  className="w-full bg-gradient-to-r from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 active:from-green-300 active:to-emerald-300 text-green-700 border border-green-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  {lang === "en" ? "Back to Home" : "முகப்புக்குத் திரும்பு"}
                </button>
              </form>

              {/* Signup Redirect */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  {lang === "en" ? "Don't have an account?" : "கணக்கு இல்லையா?"}{" "}
                  <button
                    type="button"
                    onClick={() =>
                      !formLoading && router.push("/provider/signup")
                    }
                    disabled={formLoading}
                    className="text-green-600 hover:text-green-700 font-medium underline transition-all duration-200 cursor-pointer hover:scale-105"
                  >
                    {lang === "en" ? "Sign up here" : "இங்கே பதிவு செய்யவும்"}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[10px] text-gray-500 mt-3 px-2">
            {lang === "en"
              ? "Secure login • Your data is protected"
              : "பாதுகாப்பான உள்நுழைவு • உங்கள் தரவு பாதுகாக்கப்படுகிறது"}
          </p>
        </motion.div>
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
}
