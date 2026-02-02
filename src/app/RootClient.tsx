// app/RootClient.tsx
"use client";

import React from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";

/* 🔹 Global Auth Gate */
function AppGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  // ✅ Auth loading handled ONLY ONCE here
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Remove Navbar from here if it's in layout.tsx
export default function RootClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppGate>
          <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-x-hidden">
            <Navbar/>
            <main className="w-full">{children}</main>
          </div>
        </AppGate>
      </LanguageProvider>
    </AuthProvider>
  );
}