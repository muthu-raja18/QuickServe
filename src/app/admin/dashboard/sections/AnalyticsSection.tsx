"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext"; // add
import { db } from "../../../firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { PieChart, MapPin, Loader2 } from "lucide-react";

interface DistrictAnalytics {
  district: string;
  requestsCount: number;
  providersCount: number;
  completedRequests: number;
}

export default function AnalyticsSection() {
  const { lang } = useLanguage();
  const { user } = useAuth(); // get user
  const [districtAnalytics, setDistrictAnalytics] = useState<
    DistrictAnalytics[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is logged in
    if (!user) return;

    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const requestsSnap = await getDocs(collection(db, "serviceRequests"));
        const providersSnap = await getDocs(collection(db, "providers"));
        const districtMap = new Map<string, DistrictAnalytics>();
        requestsSnap.forEach((doc) => {
          const data = doc.data();
          const district = data.district || "Unknown";
          if (!districtMap.has(district)) {
            districtMap.set(district, {
              district,
              requestsCount: 0,
              providersCount: 0,
              completedRequests: 0,
            });
          }
          const entry = districtMap.get(district)!;
          entry.requestsCount++;
          if (data.status === "completed") entry.completedRequests++;
        });
        providersSnap.forEach((doc) => {
          const data = doc.data();
          const district = data.district || "Unknown";
          if (!districtMap.has(district)) {
            districtMap.set(district, {
              district,
              requestsCount: 0,
              providersCount: 0,
              completedRequests: 0,
            });
          }
          districtMap.get(district)!.providersCount++;
        });
        const sorted = Array.from(districtMap.values()).sort(
          (a, b) => b.requestsCount - a.requestsCount,
        );
        if (isMounted) setDistrictAnalytics(sorted);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]); // user as dependency

  if (loading)
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-white">
        <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
          <PieChart className="w-5 h-5 text-blue-600" /> District-wise Activity
        </h2>
      </div>
      <div className="p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">#</th>
              <th className="text-left py-2">District</th>
              <th className="text-right py-2">Requests</th>
              <th className="text-right py-2">Completed</th>
              <th className="text-right py-2">Providers</th>
              <th className="text-right py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {districtAnalytics.map((item, idx) => {
              const totalRequests = districtAnalytics.reduce(
                (sum, d) => sum + d.requestsCount,
                0,
              );
              const score = totalRequests
                ? (item.requestsCount / totalRequests) * 100
                : 0;
              return (
                <tr key={item.district} className="border-b hover:bg-gray-50">
                  <td className="py-2">{idx + 1}</td>
                  <td className="py-2 font-medium">{item.district}</td>
                  <td className="py-2 text-right">{item.requestsCount}</td>
                  <td className="py-2 text-right text-emerald-600">
                    {item.completedRequests}
                  </td>
                  <td className="py-2 text-right text-blue-600">
                    {item.providersCount}
                  </td>
                  <td className="py-2 text-right">{Math.round(score)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
