"use client";

import { useRef, useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  ArrowDown,
  Users,
  Zap,
  Shield,
  Clock,
  Star,
  MapPin,
  Sparkles,
} from "lucide-react";

import RoleCard from "./components/RoleCard";
import { useLanguage } from "./context/LanguageContext";
import Navbar from "./components/Navbar";

export default function Page() {
  const { lang } = useLanguage();
  const roleRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const scrollToRoles = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (roleRef.current) {
      const element = roleRef.current;
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  // Features data
  const features = [
    {
      icon: Shield,
      titleEn: "Privacy First",
      titleTa: "முதன்மையான தனியுரிமை",
      descEn: "Your contact details are shared only after service acceptance",
      descTa:
        "சேவை ஏற்றுக்கொள்ளப்பட்ட பிறகு மட்டுமே உங்கள் தொடர்பு விவரங்கள் பகிரப்படும்",
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Clock,
      titleEn: "Real-time Tracking",
      titleTa: "நிகழ்நேர கண்காணிப்பு",
      descEn: "Track your service request status in real-time",
      descTa: "உங்கள் சேவை கோரிக்கை நிலையை நிகழ்நேரத்தில் கண்காணிக்கவும்",
      color: "from-green-500 to-green-600",
    },
    {
      icon: Star,
      titleEn: "Verified Ratings",
      titleTa: "சரிபார்க்கப்பட்ட மதிப்பீடுகள்",
      descEn: "Make informed decisions with verified reviews",
      descTa: "சரிபார்க்கப்பட்ட மதிப்புரைகளுடன் தகவலறிந்த முடிவுகளை எடுக்கவும்",
      color: "from-yellow-500 to-yellow-600",
    },
    {
      icon: MapPin,
      titleEn: "Local Experts",
      titleTa: "உள்ளூர் நிபுணர்கள்",
      descEn: "Connect with trusted professionals in your area",
      descTa: "உங்கள் பகுதியில் நம்பகமான நிபுணர்களுடன் இணையுங்கள்",
      color: "from-purple-500 to-purple-600",
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 min-h-screen">
      <Navbar />

      <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-8">
        <div className="max-w-6xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-4 sm:mb-6"
          >
            <motion.h1
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className={`font-bold text-indigo-600 ${
                lang === "ta"
                  ? "font-noto-sans-tamil text-3xl sm:text-4xl lg:text-5xl leading-tight"
                  : "font-inter text-4xl sm:text-5xl lg:text-6xl leading-tight"
              }`}
            >
              QuickServe
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-gray-600 max-w-2xl mx-auto text-center mb-6 sm:mb-8 ${
              lang === "ta"
                ? "font-noto-sans-tamil text-sm sm:text-base leading-relaxed px-4 min-h-[60px]"
                : "font-inter text-base sm:text-lg px-4 min-h-[60px]"
            }`}
          >
            {lang === "en"
              ? "Your trusted platform connecting professionals with people who need quality services"
              : "நம்பகமான நிபுணர்களையும் தரமான சேவைகளை விரும்பும் மக்களையும் இணைக்கும் உங்கள் நம்பகமான தளம்"}
          </motion.p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="bg-white rounded-xl p-3 sm:p-4 text-center shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3
                  className={`font-semibold text-gray-800 mb-1 text-xs sm:text-sm ${
                    lang === "ta"
                      ? "font-noto-sans-tamil text-xs sm:text-sm"
                      : "text-sm sm:text-base"
                  }`}
                >
                  {lang === "en" ? feature.titleEn : feature.titleTa}
                </h3>
                <p
                  className={`text-gray-600 text-xs ${
                    lang === "ta"
                      ? "font-noto-sans-tamil leading-relaxed text-xs"
                      : "text-xs sm:text-xs"
                  }`}
                >
                  {lang === "en" ? feature.descEn : feature.descTa}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToRoles}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
            >
              {lang === "en" ? "Get Started" : "தொடங்குங்கள்"}
              <ArrowDown size={16} className="sm:w-5 sm:h-5 animate-bounce" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <section
        ref={roleRef}
        className="py-12 sm:py-16 bg-white/30 scroll-mt-20"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2
              className={`font-bold text-gray-800 mb-3 sm:mb-4 ${
                lang === "ta"
                  ? "font-noto-sans-tamil text-xl sm:text-2xl"
                  : "font-inter text-2xl sm:text-3xl"
              }`}
            >
              {lang === "en"
                ? "Choose Your Role"
                : "உங்கள் பங்கைத் தேர்வு செய்யுங்கள்"}
            </h2>
            <p
              className={`text-gray-600 max-w-2xl mx-auto text-sm sm:text-base px-4 ${
                lang === "ta" ? "font-noto-sans-tamil" : ""
              }`}
            >
              {lang === "en"
                ? "Select your role to get started with QuickServe"
                : "க்விக்சர்வில் தொடங்க உங்கள் பங்கைத் தேர்ந்தெடுக்கவும்"}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <RoleCard
                icon={Users}
                title={lang === "en" ? "Service Seeker" : "சேவை தேடுபவர்"}
                description={
                  lang === "en"
                    ? "Find trusted professionals for your service needs"
                    : "உங்கள் சேவைத் தேவைகளுக்கு நம்பகமான நிபுணர்களைக் கண்டறியுங்கள்"
                }
                color="from-blue-500 to-blue-600"
                path="/seeker/login"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <RoleCard
                icon={Zap}
                title={lang === "en" ? "Service Provider" : "சேவை வழங்குநர்"}
                description={
                  lang === "en"
                    ? "Grow your business by connecting with customers"
                    : "வாடிக்கையாளர்களுடன் இணைப்பதன் மூலம் உங்கள் வணிகத்தை வளர்த்துக் கொள்ளுங்கள்"
                }
                color="from-green-500 to-green-600"
                path="/provider/login"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                <span className="font-bold text-lg sm:text-xl">QuickServe</span>
              </div>
              <p
                className={`text-gray-400 text-xs sm:text-sm ${
                  lang === "ta" ? "font-noto-sans-tamil" : ""
                }`}
              >
                {lang === "en"
                  ? "Connecting trusted professionals with people who need quality services"
                  : "நம்பகமான நிபுணர்களையும் தரமான சேவைகளை விரும்பும் மக்களையும் இணைக்கிறது"}
              </p>
            </div>
            <div>
              <h4
                className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${lang === "ta" ? "font-noto-sans-tamil" : ""}`}
              >
                {lang === "en" ? "Quick Links" : "விரைவு இணைப்புகள்"}
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en" ? "About Us" : "எங்களைப் பற்றி"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en"
                      ? "How it Works"
                      : "இது எப்படி வேலை செய்கிறது"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en" ? "Privacy Policy" : "தனியுரிமைக் கொள்கை"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en" ? "Terms of Service" : "சேவை விதிமுறைகள்"}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4
                className={`font-semibold mb-3 sm:mb-4 text-sm sm:text-base ${lang === "ta" ? "font-noto-sans-tamil" : ""}`}
              >
                {lang === "en" ? "Support" : "ஆதரவு"}
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-gray-400 text-xs sm:text-sm">
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en" ? "Help Center" : "உதவி மையம்"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en" ? "Contact Us" : "எங்களை தொடர்பு கொள்ள"}
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    {lang === "en" ? "Safety Tips" : "பாதுகாப்பு குறிப்புகள்"}
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-gray-400 text-xs sm:text-sm">
            © 2024 QuickServe.{" "}
            {lang === "en"
              ? "All rights reserved."
              : "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."}
          </div>
        </div>
      </footer>
    </div>
  );
}
