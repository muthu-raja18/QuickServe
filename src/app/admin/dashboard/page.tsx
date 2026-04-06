"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import AdminSidebar from "./components/Sidebar";
import ApprovalsSection from "./sections/ApprovalsSection";
import AnalyticsSection from "./sections/AnalyticsSection";
import RequestsSection from "./sections/RequestsSection";
import SystemSection from "./sections/SystemSection";
import ProfileSection from "./sections/ProfileSection";
import { useRealtimeStats } from "./hooks/useRealtimeStats";
import { Users, UserCheck, Activity, Star, Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== "admin") {
        router.replace("/admin/login");
      }
    }
  }, [user, authLoading, router]);

  // Ensure adminDistrict is null for super admin (handle string "null" as well)
  let adminDistrict = user?.adminData?.district;
  if (adminDistrict === "null") adminDistrict = null;
  const isSuperAdmin = adminDistrict === null;

  const stats = useRealtimeStats(isSuperAdmin, adminDistrict, user);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const renderSection = () => {
    switch (activeSection) {
      case "approvals":
        return (
          <ApprovalsSection
            isSuperAdmin={isSuperAdmin}
            adminDistrict={adminDistrict}
          />
        );
      case "analytics":
        return <AnalyticsSection />;
      case "requests":
        return (
          <RequestsSection
            isSuperAdmin={isSuperAdmin}
            adminDistrict={adminDistrict}
          />
        );
      case "system":
        return <SystemSection />;
      case "profile":
        return <ProfileSection />;
      default:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  <span className="text-sm text-gray-500">
                    {lang === "en" ? "Total Providers" : "மொத்த வழங்குநர்கள்"}
                  </span>
                </div>
                <p className="text-3xl font-bold">{stats.totalProviders}</p>
                <div className="flex justify-between text-sm mt-2">
                  <span>{lang === "en" ? "Pending" : "நிலுவையில்"}</span>
                  <span className="text-yellow-600">
                    {stats.pendingProviders}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                  <UserCheck className="w-6 h-6 text-green-600" />
                  <span className="text-sm text-gray-500">
                    {lang === "en" ? "Verified" : "சரிபார்க்கப்பட்டது"}
                  </span>
                </div>
                <p className="text-3xl font-bold">{stats.approvedProviders}</p>
                <div className="flex justify-between text-sm mt-2">
                  <span>{lang === "en" ? "Active" : "செயலில்"}</span>
                  <span className="text-green-600">
                    {stats.approvedProviders}
                  </span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                  <Activity className="w-6 h-6 text-purple-600" />
                  <span className="text-sm text-gray-500">
                    {lang === "en" ? "Total Requests" : "மொத்த கோரிக்கைகள்"}
                  </span>
                </div>
                <p className="text-3xl font-bold">{stats.totalRequests}</p>
                <div className="flex justify-between text-sm mt-2">
                  <span>{lang === "en" ? "Active" : "செயலில்"}</span>
                  <span className="text-blue-600">{stats.activeRequests}</span>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border">
                <div className="flex justify-between items-center mb-2">
                  <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
                  <span className="text-sm text-gray-500">
                    {lang === "en" ? "Avg Rating" : "சராசரி மதிப்பீடு"}
                  </span>
                </div>
                <p className="text-3xl font-bold">
                  {stats.avgRating.toFixed(1)}
                </p>
                <div className="flex justify-between text-sm mt-2">
                  <span>{lang === "en" ? "Completed" : "முடிந்தது"}</span>
                  <span className="text-emerald-600">
                    {stats.completedRequests}
                  </span>
                </div>
              </div>
            </div>
            {isSuperAdmin && (
              <div className="bg-white rounded-2xl p-5 border">
                <h3 className="font-bold text-lg mb-2">
                  {lang === "en"
                    ? "District Activity Leader"
                    : "மாவட்ட செயல்பாட்டு முன்னணி"}
                </h3>
                <p className="text-gray-600">
                  {lang === "en"
                    ? "Coming soon: top district stats"
                    : "விரைவில்: முதல் மாவட்ட புள்ளிவிவரங்கள்"}
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <AdminSidebar
        active={activeSection}
        onChange={setActiveSection}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div className="lg:ml-64 p-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto">{renderSection()}</div>
      </div>
    </div>
  );
}
