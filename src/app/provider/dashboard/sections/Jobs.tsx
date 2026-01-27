"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Calendar,
  Navigation,
  Truck,
  Loader2,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../context/AuthContext";
import { useLanguage } from "../../../context/LanguageContext";

type JobStatus = "active" | "awaiting_confirmation";

interface Job {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerPhone?: string;
  serviceType: string;
  description: string;
  district: string;
  block: string;
  exactAddress?: string;
  status: "accepted" | "in_progress" | "awaiting_confirmation";
  createdAt: Timestamp;
  acceptedAt: Timestamp;
  providerName: string;
  markedCompleteAt?: Timestamp;
  addressShared: boolean;
}

// Bilingual texts
const TEXTS = {
  en: {
    title: "My Jobs",
    subtitle: "Manage your ongoing services",
    activeJobs: "Active Jobs",
    awaitingConfirmation: "Awaiting Confirmation",
    viewDetails: "View Details",
    hideDetails: "Hide Details",
    markComplete: "Mark Complete",
    processing: "Processing...",
    customerInfo: "Customer Information",
    serviceLocation: "Service Location",
    serviceDescription: "Service Description",
    jobTimeline: "Job Timeline",
    requested: "Requested",
    accepted: "Accepted",
    addressShared: "Address Shared",
    markedComplete: "Marked Complete",
    waitingForAddress: "Waiting for Address",
    waitingForSeeker: "Waiting for Seeker Address",
    waitingForSeekerDesc: "Seeker needs to share address before you can start",
    waitingForConfirmation: "Waiting for Seeker Confirmation",
    waitingForConfirmationDesc: "Seeker needs to confirm completion",
    callCustomer: "Call Customer",
    contactSeeker: "Contact Seeker",
    openMaps: "Open Maps",
    openInMaps: "Open in Maps",
    noActiveJobs: "No Active Jobs",
    noActiveJobsDesc:
      "When you accept requests and seekers share addresses, jobs will appear here",
    noConfirmationJobs: "No Jobs Awaiting Confirmation",
    noConfirmationJobsDesc:
      "After marking jobs as complete, they appear here while waiting for seeker confirmation",
    addressNotShared: "Address not shared yet",
    addressNotSharedDesc: "Seeker hasn't shared exact address",
    jobDuration: "Duration",
  },
  ta: {
    title: "எனது வேலைகள்",
    subtitle: "உங்கள் நடந்து கொண்டிருக்கும் சேவைகளை நிர்வகிக்கவும்",
    activeJobs: "செயலில் உள்ள வேலைகள்",
    awaitingConfirmation: "உறுதிப்படுத்த காத்திருக்கிறது",
    viewDetails: "விவரங்களைக் காண்க",
    hideDetails: "விவரங்களை மறைக்கவும்",
    markComplete: "முடிந்ததாகக் குறிக்கவும்",
    processing: "செயலாக்குகிறது...",
    customerInfo: "வாடிக்கையாளர் தகவல்",
    serviceLocation: "சேவை இடம்",
    serviceDescription: "சேவை விளக்கம்",
    jobTimeline: "வேலை காலவரிசை",
    requested: "கோரப்பட்டது",
    accepted: "ஏற்றுக்கொள்ளப்பட்டது",
    addressShared: "முகவரி பகிரப்பட்டது",
    markedComplete: "முடிந்ததாகக் குறிக்கப்பட்டது",
    waitingForAddress: "முகவரிக்காக காத்திருக்கிறது",
    waitingForSeeker: "தேடுபவர் முகவரிக்காக காத்திருக்கிறது",
    waitingForSeekerDesc:
      "நீங்கள் சேவையைத் தொடங்குவதற்கு முன் தேடுபவர் முகவரியைப் பகிர வேண்டும்",
    waitingForConfirmation: "தேடுபவர் உறுதிப்படுத்துவதற்கு காத்திருக்கிறது",
    waitingForConfirmationDesc: "தேடுபவர் நிறைவை உறுதிப்படுத்த வேண்டும்",
    callCustomer: "வாடிக்கையாளரை அழைக்கவும்",
    contactSeeker: "தேடுபவரைத் தொடர்புகொள்ளவும்",
    openMaps: "வரைபடங்களைத் திறக்கவும்",
    openInMaps: "வரைபடங்களில் திறக்கவும்",
    noActiveJobs: "செயலில் உள்ள வேலைகள் இல்லை",
    noActiveJobsDesc:
      "நீங்கள் கோரிக்கைகளை ஏற்று, தேடுபவர்கள் முகவரிகளைப் பகிர்ந்தால், வேலைகள் இங்கே தோன்றும்",
    noConfirmationJobs: "உறுதிப்படுத்த காத்திருக்கும் வேலைகள் இல்லை",
    noConfirmationJobsDesc:
      "வேலைகளை முடிந்ததாகக் குறித்த பிறகு, தேடுபவர் உறுதிப்படுத்தும் வரை அவை இங்கே தோன்றும்",
    addressNotShared: "முகவரி இன்னும் பகிரப்படவில்லை",
    addressNotSharedDesc: "தேடுபவர் சரியான முகவரியைப் பகிரவில்லை",
    jobDuration: "கால அளவு",
  },
};

export default function JobsSection() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const t = TEXTS[lang as keyof typeof TEXTS] || TEXTS.en;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<JobStatus>("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingJob, setProcessingJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load jobs
  useEffect(() => {
    if (!user?.uid) return;

    setLoading(true);
    const q = collection(db, "serviceRequests");

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Job[] = [];

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();

          // Filter for provider's jobs
          if (data.providerId !== user.uid) return;

          // Only include accepted, in_progress, and awaiting_confirmation
          if (
            !["accepted", "in_progress", "awaiting_confirmation"].includes(
              data.status
            )
          )
            return;

          list.push({
            id: docSnap.id,
            seekerId: data.seekerId,
            seekerName: data.seekerName,
            seekerPhone: data.seekerPhone,
            serviceType: data.serviceType,
            description: data.description || "",
            district: data.district,
            block: data.block || "",
            exactAddress: data.exactAddress,
            status: data.status,
            createdAt: data.createdAt,
            acceptedAt: data.acceptedAt,
            providerName: data.providerName,
            markedCompleteAt: data.markedCompleteAt,
            addressShared: data.addressShared || false,
          });
        });

        // Sort by status and time
        list.sort((a, b) => {
          if (
            a.status === "awaiting_confirmation" &&
            b.status !== "awaiting_confirmation"
          )
            return -1;
          if (
            a.status !== "awaiting_confirmation" &&
            b.status === "awaiting_confirmation"
          )
            return 1;
          return b.acceptedAt.toMillis() - a.acceptedAt.toMillis();
        });

        setJobs(list);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading jobs:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  // Filter jobs with FIXED counts
  const filteredJobs = useMemo(() => {
    if (activeTab === "active") {
      return jobs.filter(
        (job) => job.status === "accepted" || job.status === "in_progress"
      );
    } else {
      return jobs.filter((job) => job.status === "awaiting_confirmation");
    }
  }, [jobs, activeTab]);

  // ✅ FIXED: Calculate counts correctly
  const activeJobsCount = jobs.filter(
    (j) => j.status === "accepted" || j.status === "in_progress"
  ).length;
  const awaitingConfirmationCount = jobs.filter(
    (j) => j.status === "awaiting_confirmation"
  ).length;

  // Mark job as complete
  const handleMarkComplete = async (jobId: string) => {
    if (!user?.uid) return;

    setProcessingJob(jobId);
    try {
      await updateDoc(doc(db, "serviceRequests", jobId), {
        status: "awaiting_confirmation",
        markedCompleteAt: serverTimestamp(),
      });

      // Send notification
      const job = jobs.find((j) => j.id === jobId);
      if (job) {
        await addDoc(collection(db, "notifications"), {
          userId: job.seekerId,
          title: lang === "en" ? "Service Completed!" : "சேவை முடிந்தது!",
          message:
            lang === "en"
              ? `${job.providerName} marked your service as complete. Please confirm.`
              : `${job.providerName} உங்கள் சேவையை முடிந்ததாகக் குறித்துள்ளார். உறுதிப்படுத்தவும்.`,
          type: "job_completed",
          createdAt: serverTimestamp(),
          read: false,
          requestId: jobId,
        });
      }

      setExpandedId(null);
    } catch (err) {
      console.error("Failed to mark job as complete", err);
    } finally {
      setProcessingJob(null);
    }
  };

  // Contact seeker
  const handleContactSeeker = (phone: string) => {
    if (phone) window.open(`tel:${phone}`);
  };

  // Format date
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Calculate job duration
  const calculateDuration = (acceptedAt: Timestamp) => {
    const accepted = acceptedAt.toDate();
    const now = new Date();
    const diffMs = now.getTime() - accepted.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">
              {activeJobsCount}
            </div>
            <div className="text-sm text-gray-600">{t.activeJobs}</div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">
              {awaitingConfirmationCount}
            </div>
            <div className="text-sm text-gray-600">
              {t.awaitingConfirmation}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs with FIXED counts */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === "active"
              ? "border-blue-500 text-blue-600 font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.activeJobs}
          <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
            {activeJobsCount}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("awaiting_confirmation")}
          className={`flex-1 py-3 text-center border-b-2 transition ${
            activeTab === "awaiting_confirmation"
              ? "border-amber-500 text-amber-600 font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t.awaitingConfirmation}
          <span className="ml-2 text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">
            {awaitingConfirmationCount}
          </span>
        </button>
      </div>

      {/* Jobs List */}
      <AnimatePresence mode="wait">
        {filteredJobs.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-xl border border-gray-200"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === "active" ? (
                <Truck className="w-8 h-8 text-gray-400" />
              ) : (
                <Clock className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {activeTab === "active" ? t.noActiveJobs : t.noConfirmationJobs}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {activeTab === "active"
                ? t.noActiveJobsDesc
                : t.noConfirmationJobsDesc}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="jobs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredJobs.map((job) => (
              <motion.div
                key={job.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white rounded-xl border p-4 ${
                  job.status === "awaiting_confirmation"
                    ? "border-amber-200"
                    : "border-gray-200 hover:border-blue-200"
                }`}
              >
                {/* Job Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        job.status === "awaiting_confirmation"
                          ? "bg-amber-100 text-amber-600"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      {job.status === "awaiting_confirmation" ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Truck className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {job.serviceType}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {job.seekerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.district}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        job.status === "awaiting_confirmation"
                          ? "bg-amber-100 text-amber-800"
                          : job.status === "accepted"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {job.status === "awaiting_confirmation"
                        ? t.awaitingConfirmation
                        : job.status === "accepted"
                        ? t.waitingForAddress
                        : "In Progress"}
                    </span>

                    <div className="flex items-center gap-2">
                      {/* ✅ MOVED OUTSIDE: Mark Complete button for in_progress jobs */}
                      {job.status === "in_progress" && job.exactAddress && (
                        <button
                          onClick={() => handleMarkComplete(job.id)}
                          disabled={processingJob === job.id}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:opacity-70 flex items-center gap-1"
                        >
                          {processingJob === job.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle className="w-3 h-3" />
                          )}
                          {t.markComplete}
                        </button>
                      )}

                      <button
                        onClick={() =>
                          setExpandedId(expandedId === job.id ? null : job.id)
                        }
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        {expandedId === job.id ? t.hideDetails : t.viewDetails}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Duration (for in_progress jobs) */}
                {job.status === "in_progress" && (
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">{t.jobDuration}: </span>
                    {calculateDuration(job.acceptedAt)}
                  </div>
                )}

                {/* Expanded Details */}
                <AnimatePresence>
                  {expandedId === job.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-gray-200 space-y-4"
                    >
                      {/* Customer Info */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {t.customerInfo}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="font-medium text-gray-800">
                                {job.seekerName}
                              </p>
                              {job.seekerPhone && (
                                <div className="flex items-center gap-2 mt-1">
                                  <Phone className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {job.seekerPhone}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleContactSeeker(job.seekerPhone!)
                                    }
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                  >
                                    {t.callCustomer}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service Description */}
                      {job.description && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            {t.serviceDescription}
                          </h4>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                              <p className="text-sm text-gray-700">
                                {job.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {t.serviceLocation}
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {job.district}, {job.block}
                              </p>
                              {job.exactAddress ? (
                                <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-green-800">
                                      {t.addressShared}
                                    </p>
                                    <button
                                      onClick={() => {
                                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                          job.exactAddress!
                                        )}`;
                                        window.open(mapsUrl, "_blank");
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                    >
                                      <Navigation className="w-3 h-3" />
                                      {t.openMaps}
                                    </button>
                                  </div>
                                  <p className="text-sm text-gray-700">
                                    {job.exactAddress}
                                  </p>
                                </div>
                              ) : (
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-sm font-medium text-amber-800">
                                    {t.addressNotShared}
                                  </p>
                                  <p className="text-xs text-amber-700 mt-1">
                                    {t.addressNotSharedDesc}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Job Timeline */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          {t.jobTimeline}
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">
                              {t.requested}: {formatDate(job.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-gray-600">
                              {t.accepted}: {formatDate(job.acceptedAt)}
                            </span>
                          </div>
                          {job.markedCompleteAt && (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <span className="text-gray-600">
                                {t.markedComplete}:{" "}
                                {formatDate(job.markedCompleteAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons (Inside expanded) */}
                      <div className="pt-4 border-t border-gray-200">
                        {job.status === "accepted" ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">
                                  {t.waitingForSeeker}
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                  {t.waitingForSeekerDesc}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : job.status === "in_progress" ? (
                          <div className="space-y-3">
                            {job.seekerPhone && (
                              <button
                                onClick={() =>
                                  handleContactSeeker(job.seekerPhone!)
                                }
                                className="w-full py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                              >
                                {t.contactSeeker}
                              </button>
                            )}
                            {job.exactAddress && (
                              <button
                                onClick={() => {
                                  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    job.exactAddress!
                                  )}`;
                                  window.open(mapsUrl, "_blank");
                                }}
                                className="w-full py-2 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 text-sm"
                              >
                                {t.openInMaps}
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                              <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-800">
                                  {t.waitingForConfirmation}
                                </p>
                                <p className="text-xs text-amber-700 mt-1">
                                  {t.waitingForConfirmationDesc}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
