"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase/config";
import {
  doc,
  setDoc,
  getDocs,
  query,
  where,
  collection,
} from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext";
import Notification from "../../components/Notification";
import { Eye, EyeOff } from "lucide-react";

export default function SeekerSignupPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setNotif({
        message:
          lang === "en"
            ? "Passwords do not match"
            : "கடவுச்சொற்கள் பொருந்தவில்லை",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      /* ---------- 🔐 ROLE CONFLICT CHECK ---------- */
      const q = query(collection(db, "users"), where("email", "==", email));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existingUser = snapshot.docs[0].data();

        if (existingUser.role === "provider") {
          setNotif({
            message:
              lang === "en"
                ? "This email is already registered as a Provider"
                : "இந்த மின்னஞ்சல் ஏற்கனவே சேவை வழங்குநராக பதிவு செய்யப்பட்டுள்ளது",
            type: "error",
          });
          setLoading(false);
          return;
        }
      }

      /* ---------- FIREBASE AUTH SIGNUP ---------- */
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      /* ---------- SAVE USER ROLE ---------- */
      await setDoc(doc(db, "users", result.user.uid), {
        name,
        email,
        role: "seeker",
        authProvider: "password",
        createdAt: new Date(),
      });

      setNotif({
        message: lang === "en" ? "Signup successful!" : "பதிவு வெற்றி!",
        type: "success",
      });

      setTimeout(() => router.push("/seeker/dashboard"), 1200);
    } catch (err: any) {
      let message = lang === "en" ? "Signup failed" : "பதிவு தோல்வி";

      if (err.code === "auth/email-already-in-use") {
        message =
          lang === "en"
            ? "This email is already registered. Please login."
            : "இந்த மின்னஞ்சல் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது";
      }

      setNotif({ message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col">
      <div className="h-16 flex-shrink-0" />

      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 text-center">
              <h1 className="text-xl font-bold text-white">QuickServe</h1>
              <p className="text-indigo-100 text-sm mt-1">
                {lang === "en"
                  ? "Service Seeker Signup"
                  : "சேவை தேடுபவர் பதிவு"}
              </p>
            </div>

            <div className="p-5">
              <form onSubmit={handleSignup} className="space-y-3">
                <Input
                  label={lang === "en" ? "Full Name" : "முழு பெயர்"}
                  value={name}
                  onChange={setName}
                  disabled={loading}
                />
                <Input
                  label={lang === "en" ? "Email" : "மின்னஞ்சல்"}
                  type="email"
                  value={email}
                  onChange={setEmail}
                  disabled={loading}
                />
                <PasswordInput
                  label={lang === "en" ? "Password" : "கடவுச்சொல்"}
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  toggle={() => setShowPassword(!showPassword)}
                  disabled={loading}
                />
                <PasswordInput
                  label={
                    lang === "en" ? "Confirm Password" : "கடவுச்சொல் உறுதிசெய்க"
                  }
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirm}
                  toggle={() => setShowConfirm(!showConfirm)}
                  disabled={loading}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading
                    ? lang === "en"
                      ? "Creating account..."
                      : "கணக்கு உருவாக்கப்படுகிறது..."
                    : lang === "en"
                    ? "Sign Up"
                    : "பதிவு செய்யவும்"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-600 mt-4">
                {lang === "en"
                  ? "Already have an account?"
                  : "ஏற்கனவே கணக்கு உள்ளதா?"}{" "}
                <span
                  onClick={() => !loading && router.push("/seeker/login")}
                  className="text-indigo-600 font-semibold cursor-pointer hover:underline"
                >
                  {lang === "en" ? "Login" : "உள்நுழைய"}
                </span>
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

/* ---------- INPUTS (UNCHANGED) ---------- */
function Input({ label, value, onChange, type = "text", disabled }: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-sm"
      />
    </div>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  show,
  toggle,
  disabled,
}: any) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required
          minLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 outline-none text-sm pr-10"
        />
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
