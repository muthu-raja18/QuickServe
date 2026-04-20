"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import Notification from "../../components/Notification";
import { Eye, EyeOff, Home, LogIn, ArrowRight } from "lucide-react";
import { signInWithGoogleSeeker } from "../../firebase/googleAuth";

export default function SeekerLoginPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, loading, initialized, login, manualSetUser } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [notif, setNotif] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!loading && initialized && user?.role === "seeker") {
      router.push("/seeker/dashboard");
    }
  }, [user, loading, initialized, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      setNotif({
        message:
          lang === "en"
            ? "Please enter email/username/phone and password"
            : "தயவுசெய்து மின்னஞ்சல்/பயனர்பெயர்/தொலைபேசி மற்றும் கடவுச்சொல்லை உள்ளிடவும்",
        type: "error",
      });
      return;
    }

    setFormLoading(true);

    try {
      // The login function now handles identifier resolution internally
      const result = await login(identifier, password, "seeker");

      if (!result.success) {
        console.error("Login failed:", result.error);
        setNotif({
          message:
            result.error ||
            (lang === "en"
              ? "Invalid email or password"
              : "தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்"),
          type: "error",
        });
        setFormLoading(false);
        return;
      }

      setNotif({
        message: lang === "en" ? "Login successful!" : "உள்நுழைவு வெற்றி!",
        type: "success",
      });

      setTimeout(() => {
        router.push("/seeker/dashboard");
      }, 800);
    } catch (err) {
      console.error("Login error:", err);
      setNotif({
        message:
          err.message || (lang === "en" ? "Login failed" : "உள்நுழைவு தோல்வி"),
        type: "error",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormLoading(true);
    try {
      const result = await signInWithGoogleSeeker();
      if (!result.success) throw new Error(result.message);
      manualSetUser({
        uid: result.user.uid,
        email: result.user.email,
        role: "seeker",
      });
      setNotif({
        message: lang === "en" ? "Login successful!" : "உள்நுழைவு வெற்றி!",
        type: "success",
      });
      setTimeout(() => {
        router.push("/seeker/dashboard");
        router.refresh();
      }, 800);
    } catch (err) {
      console.error("Google login error:", err);
      setNotif({
        message:
          err.message ||
          (lang === "en" ? "Google login failed" : "Google உள்நுழைவு தோல்வி"),
        type: "error",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const goToHome = () => router.push("/");

  if (!isMounted || (loading && !initialized)) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (loading || (initialized && user?.role === "seeker")) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="animate-pulse">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col">
      <div className="h-16 flex-shrink-0"></div>
      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 text-center">
              <h1 className="text-xl font-bold text-white">QuickServe</h1>
              <h2 className="text-base font-semibold text-indigo-100 mt-1">
                {lang === "en" ? "Seeker Login" : "சேவை தேடுபவர் உள்நுழைவு"}
              </h2>
              <p className="text-xs text-indigo-200 mt-1">
                {lang === "en"
                  ? "Access your seeker account"
                  : "உங்கள் சேவை தேடுபவர் கணக்கை அணுகுங்கள்"}
              </p>
            </div>

            <div className="p-5">
              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700">
                    {lang === "en"
                      ? "Email / Username / Phone"
                      : "மின்னஞ்சல் / பயனர்பெயர் / தொலைபேசி"}
                  </label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "Enter email, username, or phone number"
                        : "மின்னஞ்சல், பயனர்பெயர் அல்லது தொலைபேசி எண்ணை உள்ளிடவும்"
                    }
                    disabled={formLoading}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {lang === "en"
                      ? "Use email, username, or 10-digit phone number"
                      : "மின்னஞ்சல், பயனர்பெயர் அல்லது 10-இலக்க தொலைபேசி எண்ணைப் பயன்படுத்தவும்"}
                  </p>
                </div>

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
                          ? "Enter your password"
                          : "உங்கள் கடவுச்சொல்லை உள்ளிடவும்"
                      }
                      disabled={formLoading}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all duration-200 text-sm disabled:bg-gray-100 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={formLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-indigo-600 rounded-lg transition-all duration-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {lang === "en" ? "Signing in..." : "உள்நுழைகிறது..."}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      {lang === "en" ? "Sign In" : "உள்நுழைய"}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="my-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      {lang === "en" ? "Or" : "அல்லது"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={formLoading}
                className="w-full bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-gray-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow cursor-pointer"
              >
                <FcGoogle size={18} />
                {lang === "en"
                  ? "Continue with Google"
                  : "Google உடன் தொடரவும்"}
              </button>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-600">
                  {lang === "en" ? "Don't have an account?" : "கணக்கு இல்லையா?"}{" "}
                  <a
                    href="/seeker/signup"
                    className="text-indigo-600 hover:text-indigo-700 font-medium underline cursor-pointer"
                  >
                    {lang === "en" ? "Sign up here" : "இங்கே பதிவு செய்யவும்"}
                  </a>
                </p>
              </div>

              <button
                type="button"
                onClick={goToHome}
                disabled={formLoading}
                className="w-full mt-3 bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 border border-indigo-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                {lang === "en" ? "Back to Home" : "முகப்புக்குத் திரும்பு"}
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-500 mt-3 px-2">
            {lang === "en"
              ? "Secure login • Your data is protected"
              : "பாதுகாப்பான உள்நுழைவு • உங்கள் தரவு பாதுகாக்கப்படுகிறது"}
          </p>
        </motion.div>
      </div>
      <div className="h-4 shrink-0"></div>
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
