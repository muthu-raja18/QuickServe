"use client";

import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { User, Mail, MapPin, Shield } from "lucide-react";

export default function ProfileSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const adminData = user?.adminData;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {adminData?.name?.charAt(0) || user?.email?.charAt(0) || "A"}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {adminData?.name || "Admin"}
          </h2>
          <p className="text-gray-600">
            {adminData?.role === "super-admin"
              ? "Super Administrator"
              : "District Administrator"}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3 text-gray-700">
          <Mail className="w-5 h-5" /> {user?.email}
        </div>
        {adminData?.district && (
          <div className="flex items-center gap-3 text-gray-700">
            <MapPin className="w-5 h-5" /> {adminData.district}
          </div>
        )}
        <div className="flex items-center gap-3 text-gray-700">
          <Shield className="w-5 h-5" />{" "}
          {adminData?.role === "super-admin" ? "Super Admin" : "District Admin"}
        </div>
      </div>
    </div>
  );
}
