"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  ArrowDown,
  Users,
  Zap,
  MapPin,
  User,
  Wrench,
  ShieldCheck,
} from "lucide-react";

import RoleCard from "./components/RoleCard";
import { useLanguage } from "./context/LanguageContext";

export default function Page() {
  const { lang, t } = useLanguage();
  const roleRef = useRef<HTMLDivElement | null>(null);

  const scrollToRoles = () => {
    if (!roleRef.current) return;
    roleRef.current.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* ================= HERO (FULL SCREEN) ================= */}
      <section className="h-screen flex items-center px-6">
        <div className="max-w-5xl mx-auto w-full text-center flex flex-col justify-center">
          {/* Title */}
          <h1
            className={`font-bold text-indigo-600 mb-3 ${
              lang === "ta"
                ? "font-noto-sans-tamil text-3xl sm:text-4xl leading-snug"
                : "font-inter text-4xl sm:text-5xl"
            }`}
          >
            {t.landing.title}
          </h1>

          {/* Description */}
          <p
            className={`text-gray-700 max-w-2xl mx-auto mb-6 ${
              lang === "ta"
                ? "font-noto-sans-tamil text-base leading-relaxed"
                : "font-inter text-lg"
            }`}
          >
            {t.landing.description}
          </p>

          {/* 3 INTRO DIVISIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            {[
              {
                icon: Users,
                en: "Find trusted local professionals",
                ta: "நம்பகமான உள்ளூர் நிபுணர்களைக் கண்டறியுங்கள்",
              },
              {
                icon: Zap,
                en: "Quick booking & instant support",
                ta: "விரைவான முன்பதிவு மற்றும் உடனடி ஆதரவு",
              },
              {
                icon: MapPin,
                en: "Services across Tamil Nadu",
                ta: "தமிழ்நாடு முழுவதும் சேவைகள்",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white/70 backdrop-blur-md rounded-xl p-4 shadow-sm"
              >
                <item.icon className="mx-auto mb-2 text-indigo-600" />
                <p
                  className={`text-sm text-gray-700 ${
                    lang === "ta" ? "font-noto-sans-tamil leading-relaxed" : ""
                  }`}
                >
                  {lang === "en" ? item.en : item.ta}
                </p>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToRoles}
            className="mx-auto inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md"
          >
            {t.landing.getStarted}
            <ArrowDown size={18} />
          </motion.button>
        </div>
      </section>

      {/* ================= ROLE SECTION ================= */}
      <section ref={roleRef} className="py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2
            className={`font-bold text-gray-800 mb-10 ${
              lang === "ta"
                ? "font-noto-sans-tamil text-xl"
                : "font-inter text-2xl"
            }`}
          >
            {t.landing.intro}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RoleCard
              icon={User}
              title={t.landing.roles.seeker}
              description={t.landing.roles.seeker}
              color="from-indigo-500 to-indigo-600"
              path="/seeker/login"
            />

            <RoleCard
              icon={Wrench}
              title={t.landing.roles.provider}
              description={t.landing.roles.provider}
              color="from-blue-500 to-blue-600"
              path="/provider/login"
            />

            <RoleCard
              icon={ShieldCheck}
              title={t.landing.roles.admin}
              description={t.landing.roles.admin}
              color="from-purple-500 to-purple-600"
              path="/admin/login"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
