"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { auth, db } from "../../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useLanguage } from "../../context/LanguageContext";
import Notification from "../../components/Notification";
import { CheckCircle, Clock, XCircle } from "lucide-react";

export default function ProviderWaitingPage() {
  const router = useRouter();
  const { lang } = useLanguage();

  const [status, setStatus] = useState<"pending" | "approved" | "rejected">(
    "pending"
  );
  const [notif, setNotif] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const docRef = doc(db, "providers", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === "approved") {
            setStatus("approved");
            setNotif({
              message:
                lang === "en"
                  ? "Admin verified successfully!"
                  : "நிர்வாகி வெற்றிகரமாக சரிபார்த்தார்!",
              type: "success",
            });
          } else if (data.status === "rejected") {
            setStatus("rejected");
            setNotif({
              message:
                lang === "en"
                  ? "Your verification was rejected."
                  : "உங்கள் சரிபார்ப்பு நிராகரிக்கப்பட்டது.",
              type: "error",
            });
          } else {
            setStatus("pending");
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Check immediately and then every 5 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, [lang]);

  // Don't render until mounted to avoid layout shift
  if (!isMounted) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex flex-col">
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
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-center">
              <h1 className="text-xl font-bold text-white">QuickServe</h1>
              <h2 className="text-base font-semibold text-amber-100 mt-1">
                {lang === "en" ? "Verification Status" : "சரிபார்ப்பு நிலை"}
              </h2>
            </div>

            {/* Content Section */}
            <div className="p-6 text-center">
              {/* Status Icon */}
              <div className="flex justify-center mb-4">
                {status === "pending" && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="text-amber-500"
                  >
                    <Clock size={64} />
                  </motion.div>
                )}
                {status === "approved" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-green-500"
                  >
                    <CheckCircle size={64} />
                  </motion.div>
                )}
                {status === "rejected" && (
                  <div className="text-red-500">
                    <XCircle size={64} />
                  </div>
                )}
              </div>

              {/* Status Title */}
              <h3 className="text-lg font-bold text-gray-800 mb-3">
                {status === "pending" &&
                  (lang === "en" ? "Under Review" : "பரிசீலனையில்")}
                {status === "approved" &&
                  (lang === "en" ? "Approved!" : "அங்கீகரிக்கப்பட்டது!")}
                {status === "rejected" &&
                  (lang === "en" ? "Rejected" : "நிராகரிக்கப்பட்டது")}
              </h3>

              {/* Status Message */}
              <div className="text-sm text-gray-600 mb-6">
                {status === "pending" && (
                  <p>
                    {lang === "en"
                      ? "Your account is under review. Please wait for admin approval."
                      : "உங்கள் கணக்கு பரிசீலனையில் உள்ளது. நிர்வாகி அங்கீகாரம் அளிக்கும் வரை காத்திருங்கள்."}
                  </p>
                )}
                {status === "approved" && (
                  <p>
                    {lang === "en"
                      ? "Your account has been approved! You can now access your provider dashboard."
                      : "உங்கள் கணக்கு அங்கீகரிக்கப்பட்டது! இப்போது உங்கள் வழங்குநர் டாஷ்போர்டை அணுகலாம்."}
                  </p>
                )}
                {status === "rejected" && (
                  <div className="space-y-2">
                    <p className="text-red-600">
                      {lang === "en"
                        ? "Your verification was rejected."
                        : "உங்கள் சரிபார்ப்பு நிராகரிக்கப்பட்டது."}
                    </p>
                    <p className="text-gray-600">
                      {lang === "en"
                        ? "Please contact admin for more information."
                        : "மேலும் தகவலுக்கு நிர்வாகியை தொடர்புகொள்ளவும்."}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {status === "pending" && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">
                    {lang === "en"
                      ? "Checking status every 5 seconds..."
                      : "ஒவ்வொரு 5 விநாடிகளிலும் நிலையை சரிபார்க்கிறது..."}
                  </div>
                  <button
                    onClick={() => router.push("/")}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    {lang === "en" ? "Back to Home" : "முகப்புக்கு திரும்ப"}
                  </button>
                </div>
              )}

              {status === "approved" && (
                <button
                  onClick={() => router.push("/provider/dashboard")}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                  {lang === "en"
                    ? "Go to Dashboard"
                    : "டாஷ்போர்டுக்கு செல்லவும்"}
                </button>
              )}

              {status === "rejected" && (
                <div className="space-y-3">
                  <button
                    onClick={() => router.push("/")}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg transition duration-200 hover:scale-[1.02] active:scale-[0.98] text-sm"
                  >
                    {lang === "en" ? "Back to Home" : "முகப்புக்கு திரும்ப"}
                  </button>
                  <p className="text-xs text-gray-500">
                    {lang === "en"
                      ? "If you believe this is an error, please contact support."
                      : "இது பிழை என்று நீங்கள் நினைத்தால், ஆதரவைத் தொடர்புகொள்ளவும்."}
                  </p>
                </div>
              )}

              {/* Additional Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  {lang === "en"
                    ? "Verification usually takes 24-48 hours during business days."
                    : "சரிபார்ப்பு பொதுவாக வணிக நாட்களில் 24-48 மணி நேரம் எடுக்கும்."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-[10px] text-gray-500 mt-3 px-2">
            {lang === "en"
              ? "You will be redirected automatically when approved"
              : "அங்கீகரிக்கப்பட்டதும் தானாகவே திருப்பி விடப்படுவீர்கள்"}
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
