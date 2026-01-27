"use client";

import { useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";

export default function ProviderDashboardPage() {
  const { lang } = useLanguage();

  // This page does NOTHING - all content is handled by layout.tsx
  // It exists only to satisfy Next.js routing requirements

  useEffect(() => {
    // Optional: Set active section to home on initial load
    // This is already handled in layout.tsx, but can be added here too
    const url = new URL(window.location.href);
    if (!url.hash) {
      url.hash = "#home";
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  // Return empty fragment - layout.tsx renders everything
  return (
    <>
      {/* This empty page allows layout.tsx to handle all content */}
      {/* No loading skeletons, no duplicate content */}
    </>
  );
}
