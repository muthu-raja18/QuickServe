"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext"; // add this
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  Query,
} from "firebase/firestore";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  FileText,
  Mail,
  Phone,
  Calendar,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatDate, formatRelativeTime } from "../utils/dataUtils";

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
  status: string;
  createdAt: any;
}

interface ApprovalsSectionProps {
  isSuperAdmin: boolean;
  adminDistrict: string | null;
}

export default function ApprovalsSection({
  isSuperAdmin,
  adminDistrict,
}: ApprovalsSectionProps) {
  const { lang } = useLanguage();
  const { user } = useAuth(); // get user from auth
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run listener if user is logged in
    if (!user) return;

    const providersRef = collection(db, "providers");
    let q: Query;
    if (!isSuperAdmin && adminDistrict) {
      q = query(
        providersRef,
        where("status", "==", "pending"),
        where("district", "==", adminDistrict),
      );
    } else {
      q = query(providersRef, where("status", "==", "pending"));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const providers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Provider[];
      setPendingProviders(providers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isSuperAdmin, adminDistrict, user]); // user as dependency

  const handleApprove = async (providerId: string, providerName: string) => {
    if (
      !confirm(
        lang === "en"
          ? `Approve ${providerName}?`
          : `${providerName} ஐ அங்கீகரிக்கவா?`,
      )
    )
      return;
    await updateDoc(doc(db, "providers", providerId), {
      status: "approved",
      approvedAt: serverTimestamp(),
      approvedBy: "admin",
    });
    alert(
      lang === "en"
        ? `${providerName} approved!`
        : `${providerName} அங்கீகரிக்கப்பட்டார்!`,
    );
  };

  const handleReject = async (providerId: string, providerName: string) => {
    const reason = prompt(
      lang === "en" ? "Rejection reason:" : "நிராகரிப்பு காரணம்:",
    );
    if (!reason) return;
    await updateDoc(doc(db, "providers", providerId), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectionReason: reason,
      rejectedBy: "admin",
    });
    alert(
      lang === "en"
        ? `${providerName} rejected`
        : `${providerName} நிராகரிக்கப்பட்டார்`,
    );
  };

  const openViewModal = (
    type: "photo" | "document",
    url: string,
    providerName: string,
  ) => {
    window.open(url, "_blank");
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  if (pendingProviders.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
        <AlertTriangle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {lang === "en" ? "All Caught Up!" : "அனைத்தும் முடிந்தது!"}
        </h3>
        <p className="text-gray-500">
          {lang === "en"
            ? "No pending provider approvals."
            : "நிலுவையில் உள்ள வழங்குநர் அங்கீகாரங்கள் இல்லை."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingProviders.map((provider) => (
        <div
          key={provider.id}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {provider.serviceType} • {provider.district}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {formatRelativeTime(provider.createdAt, lang)}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4" /> {provider.email}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4" /> {provider.phone}
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() =>
                    openViewModal("photo", provider.photoLink, provider.name)
                  }
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <Eye className="w-4 h-4" /> Photo
                </button>
                <button
                  onClick={() =>
                    openViewModal("document", provider.proofLink, provider.name)
                  }
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <FileText className="w-4 h-4" /> Document
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Applied:{" "}
                {formatDate(provider.createdAt, lang)}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(provider.id, provider.name)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleReject(provider.id, provider.name)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
