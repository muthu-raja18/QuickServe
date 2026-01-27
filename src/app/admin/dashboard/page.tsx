"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { db } from "../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
  BarChart3,
  Search,
  RefreshCw,
  Eye,
  MessageSquare,
  Phone,
  MapPin,
  UserCheck,
  Star,
  TrendingUp,
  Activity,
  FileText,
  Mail,
  Download,
  Bell,
  ExternalLink,
  X,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ShieldCheck,
  Calendar,
  File,
  Loader2,
  AlertCircle,
  DownloadCloud,
} from "lucide-react";

// Types
interface Provider {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  district: string;
  block: string;
  photoLink: string;
  proofLink: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  createdAt: any;
  emailVerified: boolean;
  phoneVerified: boolean;
  rejectionReason?: string;
}

interface ServiceRequest {
  id: string;
  seekerName: string;
  seekerId: string;
  providerName: string;
  providerId: string;
  serviceType: string;
  district: string;
  status: string;
  urgency: string;
  createdAt: any;
}

interface DashboardStats {
  totalProviders: number;
  pendingProviders: number;
  approvedProviders: number;
  rejectedProviders: number;
  totalRequests: number;
  pendingRequests: number;
  activeRequests: number;
  completedRequests: number;
  avgRating: number;
}

const AdminDashboard = () => {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProviders: 0,
    pendingProviders: 0,
    approvedProviders: 0,
    rejectedProviders: 0,
    totalRequests: 0,
    pendingRequests: 0,
    activeRequests: 0,
    completedRequests: 0,
    avgRating: 0,
  });

  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [recentRequests, setRecentRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState<
    "overview" | "providers" | "requests" | "users" | "reports"
  >("overview");

  // Viewing modal state
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    type: "photo" | "document";
    url: string;
    title: string;
    providerName: string;
  }>({
    isOpen: false,
    type: "photo",
    url: "",
    title: "",
    providerName: "",
  });

  // Image viewer state
  const [imageViewer, setImageViewer] = useState({
    scale: 1,
    rotation: 0,
    isFullscreen: false,
  });

  // Document loading state
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState(false);

  // Safe function to convert any timestamp to Date - FIXED VERSION
  const safeToDate = (timestamp: any): Date => {
    try {
      if (!timestamp) return new Date();

      // If it's already a Date
      if (timestamp instanceof Date) {
        return timestamp;
      }

      // If it's an ISO string (like "2026-01-26T13:04:45.475Z")
      if (typeof timestamp === "string") {
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) return date;
      }

      // If it's a Firebase Timestamp object with toDate method
      if (timestamp && typeof timestamp.toDate === "function") {
        return timestamp.toDate();
      }

      // If it has seconds and nanoseconds properties (Firestore Timestamp structure)
      if (
        timestamp &&
        typeof timestamp === "object" &&
        timestamp.seconds !== undefined &&
        timestamp.nanoseconds !== undefined
      ) {
        return new Date(
          timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
        );
      }

      // If it's a number (milliseconds)
      if (typeof timestamp === "number") {
        return new Date(timestamp);
      }

      // Default to current date
      return new Date();
    } catch (error) {
      console.error("Error converting timestamp:", error);
      return new Date();
    }
  };

  // Format date safely
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";

    try {
      const date = safeToDate(timestamp);
      return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: any) => {
    try {
      const date = safeToDate(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 1) {
          return lang === "en" ? "Just now" : "இப்போது";
        }
        return lang === "en"
          ? `${diffMinutes} minutes ago`
          : `${diffMinutes} நிமிடங்களுக்கு முன்பு`;
      } else if (diffHours < 24) {
        return lang === "en"
          ? `${diffHours} hours ago`
          : `${diffHours} மணி நேரம் முன்பு`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return lang === "en"
          ? `${diffDays} days ago`
          : `${diffDays} நாட்களுக்கு முன்பு`;
      }
    } catch (error) {
      console.error("Error calculating relative time:", error);
      return lang === "en" ? "Recently" : "சமீபத்தில்";
    }
  };

  // Check if URL is PDF
  const isPDF = (url: string) => {
    return url.toLowerCase().endsWith(".pdf");
  };

  // Check if URL is image
  const isImage = (url: string) => {
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    return imageExtensions.some((ext) => url.toLowerCase().endsWith(ext));
  };

  // Preload document when modal opens
  const preloadDocument = (url: string) => {
    if (!isPDF(url)) return;

    // Preload PDF using fetch API
    fetch(url, { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          console.log("PDF is accessible");
        }
      })
      .catch((error) => {
        console.error("Failed to preload PDF:", error);
      });
  };

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();

    // Real-time listeners
    const providersRef = collection(db, "providers");
    const unsubscribeProviders = onSnapshot(
      query(providersRef, where("status", "==", "pending")),
      (snapshot) => {
        const providers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Provider[];
        setPendingProviders(providers);
      }
    );

    const requestsRef = collection(db, "serviceRequests");
    const unsubscribeRequests = onSnapshot(
      query(requestsRef, orderBy("createdAt", "desc"), limit(10)),
      (snapshot) => {
        const requests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceRequest[];
        setRecentRequests(requests);
      }
    );

    return () => {
      unsubscribeProviders();
      unsubscribeRequests();
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadProviders(), loadRequests()]);
      updateStats();
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProviders = async () => {
    const providersRef = collection(db, "providers");
    const snapshot = await getDocs(
      query(providersRef, where("status", "==", "pending"))
    );
    const providers = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Provider[];
    setPendingProviders(providers);
  };

  const loadRequests = async () => {
    const requestsRef = collection(db, "serviceRequests");
    const snapshot = await getDocs(
      query(requestsRef, orderBy("createdAt", "desc"), limit(10))
    );
    const requests = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ServiceRequest[];
    setRecentRequests(requests);
  };

  const updateStats = async () => {
    try {
      const providersRef = collection(db, "providers");
      const requestsRef = collection(db, "serviceRequests");

      const [providersSnapshot, requestsSnapshot] = await Promise.all([
        getDocs(providersRef),
        getDocs(requestsRef),
      ]);

      const totalProviders = providersSnapshot.size;
      const pendingProviders = providersSnapshot.docs.filter(
        (doc) => doc.data().status === "pending"
      ).length;
      const approvedProviders = providersSnapshot.docs.filter(
        (doc) => doc.data().status === "approved"
      ).length;
      const rejectedProviders = providersSnapshot.docs.filter(
        (doc) => doc.data().status === "rejected"
      ).length;

      const totalRequests = requestsSnapshot.size;
      const pendingRequests = requestsSnapshot.docs.filter(
        (doc) => doc.data().status === "pending"
      ).length;
      const activeRequests = requestsSnapshot.docs.filter((doc) =>
        ["accepted", "in_progress"].includes(doc.data().status)
      ).length;
      const completedRequests = requestsSnapshot.docs.filter(
        (doc) => doc.data().status === "completed"
      ).length;

      // Calculate average rating
      let totalRating = 0;
      let ratedCount = 0;
      providersSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.rating?.average) {
          totalRating += data.rating.average;
          ratedCount++;
        }
      });
      const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;

      setStats({
        totalProviders,
        pendingProviders,
        approvedProviders,
        rejectedProviders,
        totalRequests,
        pendingRequests,
        activeRequests,
        completedRequests,
        avgRating: parseFloat(avgRating.toFixed(1)),
      });
    } catch (error) {
      console.error("Error updating stats:", error);
    }
  };

  // Open view modal with improved PDF handling
  const openViewModal = (
    type: "photo" | "document",
    url: string,
    providerName: string
  ) => {
    setViewModal({
      isOpen: true,
      type,
      url,
      title:
        type === "photo"
          ? lang === "en"
            ? "Profile Photo"
            : "சுயபடம்"
          : lang === "en"
          ? "Proof Document"
          : "ஆவண சான்று",
      providerName,
    });

    setImageViewer({ scale: 1, rotation: 0, isFullscreen: false });

    // Reset document states
    setDocumentLoading(true);
    setDocumentError(false);

    // Preload PDF if it's a document
    if (type === "document") {
      preloadDocument(url);
    }
  };

  // Close view modal
  const closeViewModal = () => {
    setViewModal({
      isOpen: false,
      type: "photo",
      url: "",
      title: "",
      providerName: "",
    });
    setDocumentLoading(false);
    setDocumentError(false);
  };

  // Image viewer controls
  const zoomIn = () => {
    setImageViewer((prev) => ({
      ...prev,
      scale: Math.min(prev.scale + 0.25, 3),
    }));
  };

  const zoomOut = () => {
    setImageViewer((prev) => ({
      ...prev,
      scale: Math.max(prev.scale - 0.25, 0.5),
    }));
  };

  const rotateImage = () => {
    setImageViewer((prev) => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setImageViewer((prev) => ({ ...prev, isFullscreen: true }));
    } else {
      document.exitFullscreen();
      setImageViewer((prev) => ({ ...prev, isFullscreen: false }));
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setDocumentLoading(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setDocumentLoading(false);
    setDocumentError(true);
  };

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setImageViewer((prev) => ({ ...prev, isFullscreen: false }));
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Provider approval functions
  const handleApproveProvider = async (
    providerId: string,
    providerName: string
  ) => {
    if (
      !confirm(
        lang === "en"
          ? `Approve ${providerName}?`
          : `${providerName} ஐ அங்கீகரிக்கவா?`
      )
    )
      return;

    try {
      await updateDoc(doc(db, "providers", providerId), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: "admin",
      });
      alert(
        lang === "en"
          ? `${providerName} approved successfully!`
          : `${providerName} வெற்றிகரமாக அங்கீகரிக்கப்பட்டார்!`
      );
    } catch (error) {
      console.error("Error approving provider:", error);
      alert(
        lang === "en"
          ? "Failed to approve provider"
          : "வழங்குநரை அங்கீகரிக்க முடியவில்லை"
      );
    }
  };

  const handleRejectProvider = async (
    providerId: string,
    providerName: string
  ) => {
    const reason = prompt(
      lang === "en"
        ? `Enter rejection reason for ${providerName}:`
        : `${providerName} க்கான நிராகரிப்பு காரணத்தை உள்ளிடவும்:`,
      "Document verification failed"
    );

    if (!reason) return;

    try {
      await updateDoc(doc(db, "providers", providerId), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
        rejectedBy: "admin",
      });
      alert(
        lang === "en"
          ? `${providerName} rejected`
          : `${providerName} நிராகரிக்கப்பட்டார்`
      );
    } catch (error) {
      console.error("Error rejecting provider:", error);
      alert(
        lang === "en"
          ? "Failed to reject provider"
          : "வழங்குநரை நிராகரிக்க முடியவில்லை"
      );
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "approved":
        return "bg-green-100 text-green-800 border border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border border-red-200";
      case "suspended":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "accepted":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "in_progress":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Get status display text
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { en: string; ta: string }> = {
      pending: { en: "Pending Review", ta: "மதிப்பாய்வுக்காக நிலுவையில்" },
      approved: { en: "Verified", ta: "சரிபார்க்கப்பட்டது" },
      rejected: { en: "Rejected", ta: "நிராகரிக்கப்பட்டது" },
      suspended: { en: "Suspended", ta: "இடைநிறுத்தப்பட்டது" },
      accepted: { en: "Accepted", ta: "ஏற்றுக்கொள்ளப்பட்டது" },
      in_progress: { en: "In Progress", ta: "செயல்பாட்டில் உள்ளது" },
      completed: { en: "Completed", ta: "முடிந்தது" },
      expired: { en: "Expired", ta: "காலாவதியானது" },
    };

    return statusMap[status] ? statusMap[status][lang] : status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <ShieldCheck className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-gray-600 mt-4">
            {lang === "en"
              ? "Loading Admin Dashboard..."
              : "நிர்வாக கட்டுப்பாட்டு பலகை ஏற்றுகிறது..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {lang === "en"
                    ? "Admin Dashboard"
                    : "நிர்வாக கட்டுப்பாட்டு பலகை"}
                </h1>
                <p className="text-gray-600 mt-1">
                  {lang === "en"
                    ? "Monitor and manage platform activities"
                    : "மேடையின் செயல்பாடுகளைக் கண்காணித்து நிர்வகிக்கவும்"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboardData}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg border border-gray-300 transition-all hover:shadow-sm active:scale-95"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              {lang === "en" ? "Refresh" : "புதுப்பிக்கவும்"}
            </button>
            <div className="relative">
              <Bell className="w-5 h-5 text-gray-600 cursor-pointer hover:text-blue-600" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Providers Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              {lang === "en" ? "Total Providers" : "மொத்த வழங்குநர்கள்"}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats.totalProviders}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-600">
                {lang === "en" ? "Pending" : "நிலுவையில்"}
              </span>
            </div>
            <span className="font-semibold text-yellow-600">
              {stats.pendingProviders}
            </span>
          </div>
        </div>

        {/* Approved Providers Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              {lang === "en" ? "Verified" : "சரிபார்க்கப்பட்டது"}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats.approvedProviders}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">
                {lang === "en" ? "Active" : "செயலில்"}
              </span>
            </div>
            <span className="font-semibold text-green-600">
              {stats.approvedProviders}
            </span>
          </div>
        </div>

        {/* Service Requests Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              {lang === "en" ? "Total Requests" : "மொத்த கோரிக்கைகள்"}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats.totalRequests}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">
                {lang === "en" ? "Active" : "செயலில்"}
              </span>
            </div>
            <span className="font-semibold text-blue-600">
              {stats.activeRequests}
            </span>
          </div>
        </div>

        {/* Average Rating Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Star className="w-6 h-6 text-yellow-600 fill-yellow-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              {lang === "en" ? "Avg Rating" : "சராசரி மதிப்பீடு"}
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {stats.avgRating.toFixed(1)}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600">
                {lang === "en" ? "Completed" : "முடிந்தது"}
              </span>
            </div>
            <span className="font-semibold text-emerald-600">
              {stats.completedRequests}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pending Approvals & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals Section */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">
                        {lang === "en"
                          ? "Pending Approvals"
                          : "நிலுவையில் உள்ள அங்கீகாரங்கள்"}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {pendingProviders.length}{" "}
                        {lang === "en"
                          ? "providers waiting"
                          : "வழங்குநர்கள் காத்திருக்கிறார்கள்"}
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                    {pendingProviders.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5">
              {pendingProviders.length === 0 ? (
                <div className="text-center py-12">
                  <ShieldCheck className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {lang === "en" ? "All Caught Up!" : "அனைத்தும் முடிந்தது!"}
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {lang === "en"
                      ? "No pending provider approvals at the moment. Great work!"
                      : "இந்த நேரத்தில் நிலுவையில் உள்ள வழங்குநர் அங்கீகாரங்கள் எதுவும் இல்லை. சிறந்த வேலை!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProviders.map((provider) => (
                    <div
                      key={provider.id}
                      className="group bg-gray-50 hover:bg-blue-50 rounded-xl border border-gray-200 p-4 transition-all hover:border-blue-300"
                    >
                      <div className="flex items-start gap-4">
                        {/* Provider Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                                {provider.name}
                              </h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {provider.serviceType} • {provider.district}
                              </p>
                            </div>
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-lg">
                              {formatRelativeTime(provider.createdAt)}
                            </span>
                          </div>

                          {/* Contact Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="w-4 h-4" />
                              <span className="truncate">{provider.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{provider.phone}</span>
                            </div>
                          </div>

                          {/* Documents */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            <button
                              onClick={() =>
                                openViewModal(
                                  "photo",
                                  provider.photoLink,
                                  provider.name
                                )
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-blue-200 transition-colors group/item"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {lang === "en"
                                  ? "View Photo"
                                  : "புகைப்படத்தைக் காண்க"}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </button>
                            <button
                              onClick={() =>
                                openViewModal(
                                  "document",
                                  provider.proofLink,
                                  provider.name
                                )
                              }
                              className="inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-blue-50 text-blue-600 rounded-lg border border-blue-200 transition-colors group/item"
                            >
                              <FileText className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                {lang === "en"
                                  ? "View Document"
                                  : "ஆவணத்தைக் காண்க"}
                              </span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </button>
                          </div>

                          {/* Registration Info */}
                          <div className="text-xs text-gray-500 border-t border-gray-200 pt-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {lang === "en"
                                ? "Applied on"
                                : "விண்ணப்பித்த தேதி"}
                              : {formatDate(provider.createdAt)}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() =>
                              handleApproveProvider(provider.id, provider.name)
                            }
                            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm hover:shadow"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium">
                              {lang === "en" ? "Approve" : "அங்கீகரிக்கவும்"}
                            </span>
                          </button>
                          <button
                            onClick={() =>
                              handleRejectProvider(provider.id, provider.name)
                            }
                            className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors border border-red-200"
                          >
                            <XCircle className="w-4 h-4" />
                            <span className="font-medium">
                              {lang === "en" ? "Reject" : "நிராகரிக்கவும்"}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="bg-white rounded-2xl border border-gray-200">
            <div className="p-5 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                {lang === "en" ? "Recent Activity" : "சமீபத்திய செயல்பாடு"}
              </h2>
            </div>
            <div className="p-5">
              {recentRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {lang === "en"
                      ? "No recent activity"
                      : "சமீபத்திய செயல்பாடு இல்லை"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentRequests.slice(0, 5).map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${getStatusColor(
                            request.status
                          )}`}
                        >
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {request.seekerName} → {request.providerName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {request.serviceType} • {request.district}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {getStatusDisplay(request.status)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & System Health */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              {lang === "en" ? "Quick Actions" : "விரைவு செயல்கள்"}
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors flex items-center gap-3 group">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {lang === "en" ? "System Logs" : "கணினி பதிவுகள்"}
                  </p>
                  <p className="text-sm text-blue-600 opacity-75">
                    {lang === "en"
                      ? "View audit trail"
                      : "தணிக்கை பாதையைக் காண்க"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl transition-colors flex items-center gap-3 group">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {lang === "en" ? "Export Data" : "தரவை ஏற்றுமதி செய்யவும்"}
                  </p>
                  <p className="text-sm text-green-600 opacity-75">
                    {lang === "en"
                      ? "Generate reports"
                      : "அறிக்கைகளை உருவாக்கவும்"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-green-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl transition-colors flex items-center gap-3 group">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">
                    {lang === "en" ? "Broadcast" : "பரவலான செய்தி"}
                  </p>
                  <p className="text-sm text-purple-600 opacity-75">
                    {lang === "en"
                      ? "Send notifications"
                      : "அறிவிப்புகளை அனுப்பவும்"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {lang === "en" ? "System Health" : "கணினி ஆரோக்கியம்"}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {lang === "en" ? "Uptime" : "இயக்க நேரம்"}
                  </span>
                  <span className="font-semibold text-emerald-600">99.8%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: "99.8%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {lang === "en" ? "Response Time" : "பதில் நேரம்"}
                  </span>
                  <span className="font-semibold text-blue-600">320ms</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: "85%" }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {lang === "en" ? "Error Rate" : "பிழை விகிதம்"}
                  </span>
                  <span className="font-semibold text-yellow-600">0.2%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: "2%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeViewModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={lang === "en" ? "Close" : "மூடவும்"}
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h3 className="font-bold text-gray-900">{viewModal.title}</h3>
                  <p className="text-sm text-gray-600">
                    {lang === "en" ? "Provider" : "வழங்குநர்"}:{" "}
                    {viewModal.providerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {viewModal.type === "photo" && (
                  <>
                    <button
                      onClick={zoomOut}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={lang === "en" ? "Zoom Out" : "சிறிதாக்கு"}
                    >
                      <ZoomOut className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={zoomIn}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={lang === "en" ? "Zoom In" : "பெரிதாக்கு"}
                    >
                      <ZoomIn className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                      onClick={rotateImage}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={lang === "en" ? "Rotate" : "சுழற்று"}
                    >
                      <RotateCw className="w-5 h-5 text-gray-600" />
                    </button>
                  </>
                )}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={lang === "en" ? "Fullscreen" : "முழுத்திரை"}
                >
                  {imageViewer.isFullscreen ? (
                    <Minimize2 className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <a
                  href={viewModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                  title={
                    lang === "en"
                      ? "Open in new tab"
                      : "புதிய தாவலில் திறக்கவும்"
                  }
                >
                  <ExternalLink className="w-5 h-5" />
                </a>
                <a
                  href={viewModal.url}
                  download
                  className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors"
                  title={lang === "en" ? "Download" : "பதிவிறக்கம்"}
                >
                  <DownloadCloud className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-4">
              <div className="flex items-center justify-center h-full min-h-[400px]">
                {viewModal.type === "photo" ? (
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={viewModal.url}
                      alt={viewModal.title}
                      className="rounded-lg shadow-lg"
                      style={{
                        transform: `scale(${imageViewer.scale}) rotate(${imageViewer.rotation}deg)`,
                        transition: "transform 0.2s ease",
                        maxWidth: "100%",
                        maxHeight: "calc(90vh - 120px)",
                        objectFit: "contain",
                      }}
                      onLoad={() => setDocumentLoading(false)}
                      onError={() => {
                        setDocumentLoading(false);
                        setDocumentError(true);
                      }}
                    />
                    {documentLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {lang === "en"
                              ? "Loading image..."
                              : "படம் ஏற்றுகிறது..."}
                          </p>
                        </div>
                      </div>
                    )}
                    {documentError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-lg">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-700">
                            {lang === "en"
                              ? "Failed to load image"
                              : "படத்தை ஏற்ற முடியவில்லை"}
                          </p>
                          <a
                            href={viewModal.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            {lang === "en"
                              ? "Open directly"
                              : "நேரடியாக திறக்கவும்"}
                          </a>
                        </div>
                      </div>
                    )}
                    {imageViewer.scale !== 1 && (
                      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
                        {Math.round(imageViewer.scale * 100)}%
                      </div>
                    )}
                  </div>
                ) : isPDF(viewModal.url) ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    {documentLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            {lang === "en"
                              ? "Loading PDF document..."
                              : "PDF ஆவணம் ஏற்றுகிறது..."}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {lang === "en"
                              ? "This may take a moment..."
                              : "இது சிறிது நேரம் எடுக்கலாம்..."}
                          </p>
                        </div>
                      </div>
                    )}
                    {documentError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50 z-10">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-700">
                            {lang === "en"
                              ? "Failed to load PDF"
                              : "PDF ஐ ஏற்ற முடியவில்லை"}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <a
                              href={viewModal.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                            >
                              {lang === "en"
                                ? "Open in new tab"
                                : "புதிய தாவலில் திறக்கவும்"}
                            </a>
                            <a
                              href={viewModal.url}
                              download
                              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                            >
                              {lang === "en"
                                ? "Download PDF"
                                : "PDF ஐ பதிவிறக்கவும்"}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                    <iframe
                      src={`${viewModal.url}#toolbar=0&navpanes=0&scrollbar=0`}
                      className={`w-full h-full rounded-lg border ${
                        documentLoading ? "opacity-0" : "opacity-100"
                      }`}
                      title={viewModal.title}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      // Prevents the iframe from causing layout shifts
                      style={{ minHeight: "500px" }}
                    />
                    {!documentLoading && !documentError && (
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        {lang === "en"
                          ? "PDF viewer powered by browser"
                          : "PDF பார்வையாளர் உலாவியால் இயக்கப்படுகிறது"}
                      </div>
                    )}
                  </div>
                ) : isImage(viewModal.url) ? (
                  <div className="relative max-w-full max-h-full">
                    <img
                      src={viewModal.url}
                      alt={viewModal.title}
                      className="max-w-full max-h-[70vh] rounded-lg shadow-lg"
                      onLoad={() => setDocumentLoading(false)}
                      onError={() => {
                        setDocumentLoading(false);
                        setDocumentError(true);
                      }}
                    />
                    {documentLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                      </div>
                    )}
                    {documentError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-50/80 rounded-lg">
                        <div className="text-center">
                          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-700">
                            {lang === "en"
                              ? "Failed to load document"
                              : "ஆவணத்தை ஏற்ற முடியவில்லை"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <File className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">
                      {lang === "en"
                        ? "Document Preview Not Available"
                        : "ஆவண முன்னோட்டம் கிடைக்கவில்லை"}
                    </h4>
                    <p className="text-gray-500 mb-4">
                      {lang === "en"
                        ? "This file type cannot be previewed directly."
                        : "இந்த கோப்பு வகையை நேரடியாக முன்னோட்டமிட முடியாது."}
                    </p>
                    <div className="flex gap-3 justify-center">
                      <a
                        href={viewModal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {lang === "en" ? "Open Document" : "ஆவணத்தை திறக்கவும்"}
                      </a>
                      <a
                        href={viewModal.url}
                        download
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        {lang === "en" ? "Download" : "பதிவிறக்கம்"}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {viewModal.type === "photo" && (
                    <div className="flex items-center gap-4">
                      <span>
                        {lang === "en" ? "Zoom" : "பெரிதாக்கம்"}:{" "}
                        {Math.round(imageViewer.scale * 100)}%
                      </span>
                      <span>
                        {lang === "en" ? "Rotation" : "சுழற்சி"}:{" "}
                        {imageViewer.rotation}°
                      </span>
                    </div>
                  )}
                  {viewModal.type === "document" && isPDF(viewModal.url) && (
                    <div className="flex items-center gap-2">
                      <File className="w-4 h-4" />
                      <span>
                        {lang === "en" ? "PDF Document" : "PDF ஆவணம்"}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-lg transition-colors font-medium"
                >
                  {lang === "en"
                    ? "Back to Dashboard"
                    : "கட்டுப்பாட்டு பலகைக்குத் திரும்புக"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
