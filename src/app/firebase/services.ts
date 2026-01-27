import {
  collection,
  query,
  where,
  getDocs,
  getCountFromServer,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  increment,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Get counts of pending and accepted requests for a seeker
 */
export const getPendingAndAcceptedRequestsCount = async (
  seekerId: string
): Promise<{
  pending: number;
  accepted: number;
  inProgress: number;
  awaitingConfirmation: number;
}> => {
  try {
    const requestsRef = collection(db, "serviceRequests");

    const pendingQuery = query(
      requestsRef,
      where("seekerId", "==", seekerId),
      where("status", "==", "pending")
    );
    const pendingSnapshot = await getCountFromServer(pendingQuery);

    const acceptedQuery = query(
      requestsRef,
      where("seekerId", "==", seekerId),
      where("status", "in", [
        "accepted",
        "in_progress",
        "awaiting_confirmation",
      ])
    );
    const acceptedSnapshot = await getCountFromServer(acceptedQuery);

    const acceptedDocs = await getDocs(acceptedQuery);
    const counts = {
      accepted: 0,
      inProgress: 0,
      awaitingConfirmation: 0,
    };

    acceptedDocs.docs.forEach((doc) => {
      const data = doc.data();
      switch (data.status) {
        case "accepted":
          counts.accepted++;
          break;
        case "in_progress":
          counts.inProgress++;
          break;
        case "awaiting_confirmation":
          counts.awaitingConfirmation++;
          break;
      }
    });

    return {
      pending: pendingSnapshot.data().count,
      accepted: counts.accepted,
      inProgress: counts.inProgress,
      awaitingConfirmation: counts.awaitingConfirmation,
    };
  } catch (error) {
    console.error("Error fetching request counts:", error);
    return { pending: 0, accepted: 0, inProgress: 0, awaitingConfirmation: 0 };
  }
};

/**
 * Listen to real-time updates for request counts
 */
export const listenToRequestCounts = (
  seekerId: string,
  callback: (counts: {
    pending: number;
    accepted: number;
    inProgress: number;
    awaitingConfirmation: number;
    totalActive: number;
  }) => void
) => {
  const requestsRef = collection(db, "serviceRequests");
  const q = query(requestsRef, where("seekerId", "==", seekerId));

  return onSnapshot(q, (snapshot) => {
    const counts = {
      pending: 0,
      accepted: 0,
      inProgress: 0,
      awaitingConfirmation: 0,
      totalActive: 0,
    };

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      switch (data.status) {
        case "pending":
          counts.pending++;
          break;
        case "accepted":
          counts.accepted++;
          counts.totalActive++;
          break;
        case "in_progress":
          counts.inProgress++;
          counts.totalActive++;
          break;
        case "awaiting_confirmation":
          counts.awaitingConfirmation++;
          counts.totalActive++;
          break;
      }
    });

    callback(counts);
  });
};

/**
 * ============ RATING FUNCTIONS - COMPLETELY RE-WRITTEN ============
 */

/**
 * Get current rating data from provider - FIXED VERSION
 */
const getCurrentProviderRating = (providerData: any) => {
  // ✅ FIRST: Check for rating breakdown object (this is what you have)
  if (providerData?.rating?.breakdown) {
    const breakdown = providerData.rating.breakdown;
    const totalReviews =
      (breakdown[1] || 0) +
      (breakdown[2] || 0) +
      (breakdown[3] || 0) +
      (breakdown[4] || 0) +
      (breakdown[5] || 0);

    const totalScore =
      (breakdown[1] || 0) * 1 +
      (breakdown[2] || 0) * 2 +
      (breakdown[3] || 0) * 3 +
      (breakdown[4] || 0) * 4 +
      (breakdown[5] || 0) * 5;

    const average = totalReviews > 0 ? totalScore / totalReviews : 0;

    return {
      average: parseFloat(average.toFixed(1)),
      totalReviews: totalReviews,
      completedJobs: providerData.completedJobs || totalReviews,
    };
  }

  // ✅ SECOND: Check for rating object with average
  if (providerData?.rating && typeof providerData.rating === "object") {
    return {
      average: Number(providerData.rating.average) || 0,
      totalReviews: Number(providerData.rating.totalReviews) || 0,
      completedJobs: Number(providerData.completedJobs) || 0,
    };
  }

  // ✅ THIRD: Check averageRating field
  if (providerData?.averageRating !== undefined) {
    return {
      average: Number(providerData.averageRating) || 0,
      totalReviews: Number(providerData.completedJobs) || 0,
      completedJobs: Number(providerData.completedJobs) || 0,
    };
  }

  // ✅ FOURTH: Direct rating field
  if (typeof providerData?.rating === "number") {
    return {
      average: Number(providerData.rating) || 0,
      totalReviews: Number(providerData.completedJobs) || 0,
      completedJobs: Number(providerData.completedJobs) || 0,
    };
  }

  return {
    average: 0,
    totalReviews: 0,
    completedJobs: 0,
  };
};

/**
 * Update provider rating - COMPLETELY RE-WRITTEN to update breakdown
 */
export const updateProviderRating = async (
  providerId: string,
  newRating: number
): Promise<boolean> => {
  try {
    console.log(`🔄 Updating provider ${providerId} with rating: ${newRating}`);

    if (!providerId || newRating < 1 || newRating > 5) {
      console.error("Invalid rating data");
      return false;
    }

    const providerRef = doc(db, "providers", providerId);
    const providerDoc = await getDoc(providerRef);

    if (!providerDoc.exists()) {
      console.error("Provider not found:", providerId);
      return false;
    }

    const providerData = providerDoc.data();

    // Get CURRENT rating
    const current = getCurrentProviderRating(providerData);

    console.log("📊 CURRENT rating stats:", current);

    // Calculate NEW values
    const newTotalReviews = current.totalReviews + 1;
    const newCompletedJobs = (providerData.completedJobs || 0) + 1;

    // Calculate new average
    let newAverage = 0;
    if (current.totalReviews === 0) {
      newAverage = newRating;
    } else {
      const totalScore = current.average * current.totalReviews;
      newAverage = (totalScore + newRating) / newTotalReviews;
    }

    const roundedAverage = parseFloat(newAverage.toFixed(1));

    // ✅ CRITICAL: Update breakdown object
    const currentBreakdown = providerData.rating?.breakdown || {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    const newBreakdown = {
      ...currentBreakdown,
      [newRating]: (currentBreakdown[newRating] || 0) + 1,
    };

    console.log("📈 NEW rating calculation:", {
      currentAverage: current.average,
      newAverage: roundedAverage,
      newTotalReviews,
      newCompletedJobs,
      newBreakdown,
    });

    // ✅ Update provider document with ALL fields
    const updateData = {
      rating: {
        average: roundedAverage,
        totalReviews: newTotalReviews,
        breakdown: newBreakdown,
        lastUpdated: serverTimestamp(),
      },
      averageRating: roundedAverage,
      completedJobs: newCompletedJobs,
      updatedAt: serverTimestamp(),
    };

    console.log("💾 Saving to provider:", updateData);
    await updateDoc(providerRef, updateData);

    console.log(`✅ Provider ${providerId} updated successfully`);

    // ✅ Trigger UI refresh
    window.dispatchEvent(
      new CustomEvent("rating-updated", {
        detail: {
          providerId: providerId,
          newRating: roundedAverage,
          newTotalReviews,
          timestamp: Date.now(),
        },
      })
    );

    return true;
  } catch (error: any) {
    console.error("❌ ERROR updating provider rating:", error);
    return false;
  }
};

/**
 * Get provider rating data
 */
export const getProviderRating = async (providerId: string) => {
  try {
    const providerRef = doc(db, "providers", providerId);
    const providerDoc = await getDoc(providerRef);

    if (!providerDoc.exists()) {
      return { average: 0, totalReviews: 0, completedJobs: 0 };
    }

    return getCurrentProviderRating(providerDoc.data());
  } catch (error) {
    console.error("Error getting provider rating:", error);
    return { average: 0, totalReviews: 0, completedJobs: 0 };
  }
};

/**
 * Submit a rating for a service request - FIXED VERSION
 */
export const submitServiceRating = async (
  requestId: string,
  rating: number,
  review?: string
): Promise<boolean> => {
  try {
    console.log("🎯 SUBMITTING RATING - Starting process...");

    if (rating < 1 || rating > 5) {
      console.error("Rating must be between 1-5");
      return false;
    }

    const requestRef = doc(db, "serviceRequests", requestId);
    const requestDoc = await getDoc(requestRef);

    if (!requestDoc.exists()) {
      console.error("Service request not found:", requestId);
      return false;
    }

    const requestData = requestDoc.data();
    const providerId = requestData.providerId;

    if (!providerId) {
      console.error("No providerId found in request");
      return false;
    }

    console.log("📋 Request details:", {
      requestId,
      providerId,
      providerName: requestData.providerName,
      seekerRating: rating,
    });

    // STEP 1: Update service request
    console.log("1️⃣ Updating service request...");
    await updateDoc(requestRef, {
      seekerRating: rating,
      seekerReview: review || null,
      ratedAt: serverTimestamp(),
      status: "completed",
      seekerConfirmedAt: serverTimestamp(),
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log("✅ Service request updated");

    // STEP 2: Update provider rating with breakdown
    console.log("2️⃣ Updating provider rating with breakdown...");
    const success = await updateProviderRating(providerId, rating);

    if (!success) {
      console.error("Failed to update provider rating");
      return false;
    }

    console.log("✅ Provider rating updated with breakdown");

    console.log(`🎉 RATING PROCESS COMPLETE!`);
    console.log(`   Request: ${requestId}`);
    console.log(`   Provider: ${providerId}`);
    console.log(`   Rating: ${rating} stars`);

    return true;
  } catch (error: any) {
    console.error("❌ FATAL ERROR in submitServiceRating:", error);
    console.error("Full error:", error.message);
    return false;
  }
};

/**
 * Get all ratings for a provider
 */
export const getProviderRatings = async (providerId: string) => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("seekerRating", ">", 0)
    );

    const snapshot = await getDocs(q);
    const ratings = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        rating: data.seekerRating || 0,
        review: data.seekerReview || "",
        seekerName: data.seekerName || "Anonymous",
        createdAt: data.ratedAt || data.seekerConfirmedAt || null,
        serviceType: data.serviceType || "",
      };
    });

    return ratings;
  } catch (error) {
    console.error("Error getting provider ratings:", error);
    return [];
  }
};

/**
 * Calculate average rating from multiple ratings
 */
export const calculateAverageRating = (ratings: number[]): number => {
  if (ratings.length === 0) return 0;

  const sum = ratings.reduce((total, rating) => total + rating, 0);
  const average = sum / ratings.length;
  return parseFloat(average.toFixed(1));
};

/**
 * Check if a request can be rated
 */
export const canRateRequest = (requestData: any): boolean => {
  if (!requestData) return false;

  if (requestData.status !== "awaiting_confirmation") {
    return false;
  }

  if (requestData.seekerRating && requestData.seekerRating > 0) {
    return false;
  }

  if (!requestData.markedCompleteAt) {
    return false;
  }

  return true;
};

/**
 * ============ FIX FUNCTIONS ============
 */

/**
 * Fix a single provider's rating structure
 */
export const fixProviderRatingStructure = async (
  providerId: string
): Promise<void> => {
  try {
    console.log(`🔧 Fixing provider ${providerId} rating structure...`);

    const providerRef = doc(db, "providers", providerId);
    const providerDoc = await getDoc(providerRef);

    if (!providerDoc.exists()) {
      console.error("Provider not found");
      return;
    }

    const providerData = providerDoc.data();

    // Get all completed jobs with ratings for this provider
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "==", "completed")
    );

    const snapshot = await getDocs(q);
    const ratings: number[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.seekerRating && data.seekerRating > 0) {
        ratings.push(data.seekerRating);
      }
    });

    // Calculate breakdown
    const breakdown = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    ratings.forEach((rating) => {
      if (rating >= 1 && rating <= 5) {
        breakdown[rating as 1 | 2 | 3 | 4 | 5]++;
      }
    });

    const totalReviews = ratings.length;
    const average =
      totalReviews > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews
        : 0;

    const updateData = {
      rating: {
        average: parseFloat(average.toFixed(1)),
        totalReviews: totalReviews,
        breakdown: breakdown,
        lastUpdated: serverTimestamp(),
      },
      averageRating: parseFloat(average.toFixed(1)),
      completedJobs: snapshot.size,
      updatedAt: serverTimestamp(),
    };

    console.log("📊 Fixed rating data:", updateData);
    await updateDoc(providerRef, updateData);

    console.log(`✅ Provider ${providerId} rating structure fixed`);
  } catch (error) {
    console.error("Error fixing provider rating:", error);
  }
};

/**
 * Recalculate ALL provider ratings from service requests
 */
export const recalculateAllProviderRatings = async (): Promise<void> => {
  try {
    console.log(
      "🧮 Recalculating ALL provider ratings from service requests..."
    );

    const providersRef = collection(db, "providers");
    const providersSnapshot = await getDocs(providersRef);

    const requestsRef = collection(db, "serviceRequests");
    const allRequestsSnapshot = await getDocs(requestsRef);

    // Group requests by provider
    const providerRequests: Record<string, any[]> = {};

    allRequestsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.providerId && data.status === "completed") {
        if (!providerRequests[data.providerId]) {
          providerRequests[data.providerId] = [];
        }
        providerRequests[data.providerId].push(data);
      }
    });

    // Update each provider
    for (const providerDoc of providersSnapshot.docs) {
      const providerId = providerDoc.id;
      const requests = providerRequests[providerId] || [];

      const ratings = requests
        .filter((req) => req.seekerRating && req.seekerRating > 0)
        .map((req) => req.seekerRating);

      const breakdown = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      };

      ratings.forEach((rating) => {
        if (rating >= 1 && rating <= 5) {
          breakdown[rating as 1 | 2 | 3 | 4 | 5]++;
        }
      });

      const totalReviews = ratings.length;
      const average =
        totalReviews > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews
          : 0;

      const updateData = {
        rating: {
          average: parseFloat(average.toFixed(1)),
          totalReviews: totalReviews,
          breakdown: breakdown,
          lastUpdated: serverTimestamp(),
        },
        averageRating: parseFloat(average.toFixed(1)),
        completedJobs: requests.length,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(providerDoc.ref, updateData);

      console.log(
        `✅ Recalculated: ${providerId} - ${average.toFixed(
          1
        )} stars (${totalReviews} reviews)`
      );
    }

    console.log(`🎉 Recalculated ${providersSnapshot.size} providers`);
  } catch (error) {
    console.error("Error recalculating ratings:", error);
  }
};

/**
 * Get accurate provider rating by calculating from service requests
 */
export const getAccurateProviderRating = async (providerId: string) => {
  try {
    const requestsRef = collection(db, "serviceRequests");
    const q = query(
      requestsRef,
      where("providerId", "==", providerId),
      where("status", "==", "completed")
    );

    const snapshot = await getDocs(q);
    const ratings: number[] = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.seekerRating && data.seekerRating > 0) {
        ratings.push(data.seekerRating);
      }
    });

    const totalReviews = ratings.length;
    const average =
      totalReviews > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / totalReviews
        : 0;

    return {
      average: parseFloat(average.toFixed(1)),
      totalReviews: totalReviews,
      completedJobs: snapshot.size,
      accurate: true,
    };
  } catch (error) {
    console.error("Error getting accurate rating:", error);
    return { average: 0, totalReviews: 0, completedJobs: 0, accurate: false };
  }
};
