"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "ta";

interface Translations {
  landing: {
    title: string;
    description: string;
    getStarted: string;
    intro: string;
    roles: {
      seeker: string;
      provider: string;
      admin: string;
    };
  };
}

interface LanguageContextType {
  lang: Lang;
  toggleLanguage: () => void;
  t: Translations;
}

const en: Translations = {
  landing: {
    title: "QuickServe",
    description: "Connect with local services across Tamil Nadu instantly.",
    getStarted: "Get Started",
    intro: "Select your role to access QuickServe services:",
    roles: {
      seeker: "Service Seeker",
      provider: "Service Provider",
      admin: "Admin",
    },
  },
};

const ta: Translations = {
  landing: {
    title: "குவிக் சர்வ்",
    description: "தமிழ்நாட்டின் உள்ளூர் சேவைகளுடன் உடனடியாக இணையுங்கள்.",
    getStarted: "தொடங்கவும்",
    intro: "குவிக் சர்வ் சேவைகளை அணுக உங்கள் வேலையைத் தேர்ந்தெடுக்கவும்:",
    roles: {
      seeker: "சேவை தேடுபவர்",
      provider: "சேவை வழங்குநர்",
      admin: "நிர்வாகி",
    },
  },
};

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  toggleLanguage: () => {},
  t: en,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLanguage = () => {
    setLang((prev) => (prev === "en" ? "ta" : "en"));
  };

  const t = lang === "en" ? en : ta;

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
