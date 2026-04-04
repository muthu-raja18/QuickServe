import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Query,
} from "firebase/firestore";
import { db } from "../../../firebase/config";

interface Stats {
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

export const useRealtimeStats = (
  isSuperAdmin: boolean,
  adminDistrict: string | null,
) => {
  const [stats, setStats] = useState<Stats>({
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

  useEffect(() => {
    // Providers listener
    const providersRef = collection(db, "providers");
    let providersQuery: Query;
    if (!isSuperAdmin && adminDistrict) {
      providersQuery = query(
        providersRef,
        where("district", "==", adminDistrict),
      );
    } else {
      providersQuery = query(providersRef);
    }
    const unsubscribeProviders = onSnapshot(providersQuery, (snapshot) => {
      let total = 0,
        pending = 0,
        approved = 0,
        rejected = 0;
      let totalRating = 0,
        ratedCount = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total++;
        if (data.status === "pending") pending++;
        else if (data.status === "approved") approved++;
        else if (data.status === "rejected") rejected++;
        if (data.rating?.average) {
          totalRating += data.rating.average;
          ratedCount++;
        }
      });
      const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;
      setStats((prev) => ({
        ...prev,
        totalProviders: total,
        pendingProviders: pending,
        approvedProviders: approved,
        rejectedProviders: rejected,
        avgRating: parseFloat(avgRating.toFixed(1)),
      }));
    });

    // Requests listener
    const requestsRef = collection(db, "serviceRequests");
    let requestsQuery: Query;
    if (!isSuperAdmin && adminDistrict) {
      requestsQuery = query(
        requestsRef,
        where("district", "==", adminDistrict),
      );
    } else {
      requestsQuery = query(requestsRef);
    }
    const unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
      let total = 0,
        pending = 0,
        active = 0,
        completed = 0;
      snapshot.forEach((doc) => {
        const status = doc.data().status;
        total++;
        if (status === "pending") pending++;
        else if (status === "accepted" || status === "in_progress") active++;
        else if (status === "completed") completed++;
      });
      setStats((prev) => ({
        ...prev,
        totalRequests: total,
        pendingRequests: pending,
        activeRequests: active,
        completedRequests: completed,
      }));
    });

    return () => {
      unsubscribeProviders();
      unsubscribeRequests();
    };
  }, [isSuperAdmin, adminDistrict]);

  return stats;
};
