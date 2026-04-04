"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  Query,
} from "firebase/firestore";
import { Activity, Loader2, Search, Filter } from "lucide-react";
import { formatDate } from "../utils/dataUtils"

interface Request {
  id: string;
  seekerName: string;
  providerName: string;
  serviceType: string;
  district: string;
  status: string;
  createdAt: any;
}

interface RequestsSectionProps {
  isSuperAdmin: boolean;
  adminDistrict: string | null;
}

export default function RequestsSection({
  isSuperAdmin,
  adminDistrict,
}: RequestsSectionProps) {
  const { lang } = useLanguage();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, pending, active, completed

  useEffect(() => {
    const requestsRef = collection(db, "serviceRequests");
    let q: Query;
    if (!isSuperAdmin && adminDistrict) {
      q = query(
        requestsRef,
        where("district", "==", adminDistrict),
        orderBy("createdAt", "desc"),
      );
    } else {
      q = query(requestsRef, orderBy("createdAt", "desc"));
    }
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const all = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Request[];
      setRequests(all);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [isSuperAdmin, adminDistrict]);

  const filteredRequests = requests.filter((req) => {
    if (filter === "pending") return req.status === "pending";
    if (filter === "active")
      return ["accepted", "in_progress"].includes(req.status);
    if (filter === "completed") return req.status === "completed";
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-purple-100 text-purple-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusDisplay = (status: string) => {
    const map: Record<string, { en: string; ta: string }> = {
      pending: { en: "Pending", ta: "நிலுவையில்" },
      accepted: { en: "Accepted", ta: "ஏற்றுக்கொள்ளப்பட்டது" },
      in_progress: { en: "In Progress", ta: "செயல்பாட்டில்" },
      completed: { en: "Completed", ta: "முடிந்தது" },
    };
    return map[status]?.[lang] || status;
  };

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-200">
      <div className="p-5 border-b flex flex-wrap justify-between items-center gap-3">
        <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" /> Service Requests
        </h2>
        <div className="flex gap-2">
          {["all", "pending", "active", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-sm ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700"}`}
            >
              {f === "all"
                ? lang === "en"
                  ? "All"
                  : "அனைத்தும்"
                : f === "pending"
                  ? lang === "en"
                    ? "Pending"
                    : "நிலுவை"
                  : f === "active"
                    ? lang === "en"
                      ? "Active"
                      : "செயலில்"
                    : lang === "en"
                      ? "Completed"
                      : "முடிந்தது"}
            </button>
          ))}
        </div>
      </div>
      <div className="p-5">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No requests found
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {req.seekerName} → {req.providerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {req.serviceType} • {req.district}
                  </p>
                </div>
                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${getStatusColor(req.status)}`}
                  >
                    {getStatusDisplay(req.status)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(req.createdAt, lang)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
