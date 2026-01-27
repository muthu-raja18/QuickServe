"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../firebase/config";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  Timestamp,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import {
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Share2,
  User,
  Calendar,
  Star,
  Loader2,
  Edit2,
  Save,
  X,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

// Types
interface ServiceRequest {
  id: string;
  providerName: string;
  serviceType: string;
  description: string;
  district: string;
  status:
    | "pending"
    | "accepted"
    | "in_progress"
    | "awaiting_confirmation"
    | "completed"
    | "expired"
    | "cancelled";
  urgency: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  providerPhone?: string;
  exactAddress?: string;
  addressShared?: boolean;
  acceptedAt?: Timestamp;
  seekerRating?: number;
  seekerReview?: string;
  seekerId: string;
  providerId?: string;
}

// Bilingual keywords for reviews
const REVIEW_KEYWORDS = {
  en: [
    "Punctual",
    "Friendly",
    "Cost Effective",
    "Professional",
    "Skilled",
    "Clean Work",
    "Good Communication",
    "Trustworthy",
    "Helpful",
    "Excellent Service",
  ],
  ta: [
    "நேரம் தவறாமல்",
    "நட்புடன்",
    "செலவு குறைந்த",
    "தொழில்முறை",
    "திறமையான",
    "சுத்தமான வேலை",
    "நல்ல தொடர்பு",
    "நம்பகமான",
    "உதவிகரமான",
    "சிறந்த சேவை",
  ],
};

export default function MyRequestsSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressModalRequest, setAddressModalRequest] =
    useState<ServiceRequest | null>(null);
  const [ratingModalRequest, setRatingModalRequest] =
    useState<ServiceRequest | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState("");
  const [userAddress, setUserAddress] = useState("");
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [editAddressMode, setEditAddressMode] = useState(false);
  const [customAddress, setCustomAddress] = useState("");

  // Load user profile data
  useEffect(() => {
    if (!user?.uid) return;

    const loadProfileData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserPhone(data.phone || "");

          // Build address string from profile
          const address = data.address || {};
          const addressParts = [
            address.houseNo,
            address.street,
            address.landmark,
            address.city,
            address.district,
            address.pincode,
          ].filter(Boolean);
          const profileAddress = addressParts.join(", ");
          setUserAddress(profileAddress);
          setCustomAddress(profileAddress); // Set as default for custom address
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfileData();
  }, [user]);

  // Load requests with providerId
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const requestsRef = collection(db, "serviceRequests");
    const q = query(requestsRef, where("seekerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const userRequests = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ServiceRequest[];

        // Sort by createdAt desc
        userRequests.sort(
          (a, b) =>
            (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
        );

        setRequests(userRequests);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading requests:", error);
        loadRequestsFallback();
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Fallback loading method
  const loadRequestsFallback = async () => {
    if (!user?.uid) return;

    try {
      const requestsRef = collection(db, "serviceRequests");
      const snapshot = await getDocs(requestsRef);

      const allRequests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ServiceRequest[];

      // Filter by seekerId on client side
      const userRequests = allRequests.filter(
        (req) => req.seekerId === user.uid
      );

      // Sort by createdAt desc
      userRequests.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0)
      );

      setRequests(userRequests);
    } catch (error) {
      console.error("Fallback loading failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter requests by status
  const pendingRequests = requests.filter((req) => req.status === "pending");
  const activeRequests = requests.filter((req) =>
    ["accepted", "in_progress", "awaiting_confirmation"].includes(req.status)
  );

  // Format date
  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate();
    return date.toLocaleDateString(lang === "ta" ? "ta-IN" : "en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get time remaining
  const getTimeRemaining = (expiresAt: Timestamp) => {
    if (!expiresAt)
      return {
        expired: true,
        text: lang === "en" ? "Expired" : "காலாவதியானது",
      };

    const now = Date.now();
    const expiryTime = expiresAt.toMillis();
    const diff = expiryTime - now;

    if (diff <= 0) {
      return {
        expired: true,
        text: lang === "en" ? "Expired" : "காலாவதியானது",
      };
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return {
        expired: false,
        text: `${hours}h ${minutes}m ${lang === "en" ? "left" : "மீதி"}`,
        isUrgent: hours === 0 && minutes < 30,
      };
    } else {
      return {
        expired: false,
        text: `${minutes}m ${lang === "en" ? "left" : "மீதி"}`,
        isUrgent: true,
      };
    }
  };

  // Cancel request
  const handleCancelRequest = async (id: string) => {
    if (!confirm(lang === "en" ? "Cancel this request?" : "ரத்து செய்யவா?"))
      return;

    setLoadingAction(`cancel-${id}`);
    try {
      await updateDoc(doc(db, "serviceRequests", id), {
        status: "cancelled",
        cancelledAt: Timestamp.now(),
      });
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert(
        lang === "en" ? "Failed to cancel request" : "ரத்து செய்ய முடியவில்லை"
      );
    } finally {
      setLoadingAction(null);
    }
  };

  // Share address
  const handleShareAddress = async () => {
    if (!addressModalRequest) return;

    const phoneToUse = userPhone || "Not provided";
    const addressToUse = editAddressMode ? customAddress : userAddress;

    if (!addressToUse.trim()) {
      alert(
        lang === "en"
          ? "Please enter an address"
          : "தயவுசெய்து ஒரு முகவரியை உள்ளிடவும்"
      );
      return;
    }

    setIsSharing(true);
    try {
      await updateDoc(doc(db, "serviceRequests", addressModalRequest.id), {
        exactAddress: addressToUse,
        seekerPhone: phoneToUse,
        addressShared: true,
        status: "in_progress",
        addressSharedAt: serverTimestamp(),
      });

      setAddressModalRequest(null);
      setEditAddressMode(false);
      alert(
        lang === "en"
          ? "Address shared successfully"
          : "முகவரி வெற்றிகரமாக பகிரப்பட்டது"
      );
    } catch (error) {
      console.error("Error sharing address:", error);
      alert(
        lang === "en"
          ? "Failed to share address"
          : "முகவரியைப் பகிர முடியவில்லை"
      );
    } finally {
      setIsSharing(false);
    }
  };

  // Submit rating with comment - UPDATED VERSION WITHOUT RELOAD
  const handleSubmitRating = async () => {
    if (!ratingModalRequest || rating === 0) return;

    setLoadingAction(`rate-${ratingModalRequest.id}`);
    try {
      // Get the provider ID from the service request
      const requestDoc = await getDoc(
        doc(db, "serviceRequests", ratingModalRequest.id)
      );

      if (!requestDoc.exists()) {
        alert(lang === "en" ? "Request not found" : "கோரிக்கை கிடைக்கவில்லை");
        return;
      }

      const requestData = requestDoc.data();
      const providerId = requestData.providerId;

      if (!providerId) {
        alert(
          lang === "en"
            ? "Provider ID not found"
            : "வழங்குநர் ஐடி கிடைக்கவில்லை"
        );
        return;
      }

      // Update the service request with rating and review
      await updateDoc(doc(db, "serviceRequests", ratingModalRequest.id), {
        status: "completed",
        seekerRating: rating,
        seekerReview: reviewComment.trim() || null,
        seekerConfirmedAt: serverTimestamp(),
      });

      // Update the provider's rating
      const providerRef = doc(db, "providers", providerId);
      const providerDoc = await getDoc(providerRef);

      if (providerDoc.exists()) {
        const providerData = providerDoc.data();

        // Get current rating values
        let currentRating = 0;
        let currentReviews = 0;
        let currentJobs = 0;

        if (providerData.rating && typeof providerData.rating === "object") {
          currentRating = providerData.rating.average || 0;
          currentReviews = providerData.rating.totalReviews || 0;
        } else if (providerData.averageRating !== undefined) {
          currentRating = providerData.averageRating || 0;
          currentReviews =
            providerData.totalReviews || providerData.completedJobs || 0;
        } else {
          currentRating = providerData.rating || 0;
          currentReviews =
            providerData.totalReviews || providerData.completedJobs || 0;
        }

        currentJobs = providerData.completedJobs || currentReviews;

        // Calculate new values
        const newReviews = currentReviews + 1;
        const newJobs = currentJobs + 1;
        const newRating =
          currentReviews === 0
            ? rating
            : (currentRating * currentReviews + rating) / newReviews;

        // Update provider with new rating
        await updateDoc(providerRef, {
          rating: {
            average: parseFloat(newRating.toFixed(1)),
            totalReviews: newReviews,
            lastUpdated: serverTimestamp(),
          },
          averageRating: parseFloat(newRating.toFixed(1)),
          completedJobs: newJobs,
          updatedAt: serverTimestamp(),
        });
      }

      // Update local state to reflect changes without reloading
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === ratingModalRequest.id
            ? {
                ...req,
                status: "completed" as const,
                seekerRating: rating,
                  seekerReview: reviewComment.trim() || undefined,
              }
            : req
        )
      );

      // Show success message
      setRatingModalRequest(null);
      setRating(0);
      setReviewComment("");
      alert(
        lang === "en"
          ? "Thank you for your rating! Service completed."
          : "மதிப்பீட்டிற்கு நன்றி! சேவை முடிந்தது."
      );
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert(
        lang === "en"
          ? "Failed to submit rating"
          : "மதிப்பீடு சமர்ப்பிக்க முடியவில்லை"
      );
    } finally {
      setLoadingAction(null);
    }
  };

  // Contact provider
  const handleContactProvider = (phone?: string) => {
    if (phone && phone.length >= 10) {
      window.open(`tel:${phone}`);
    } else {
      alert(
        lang === "en"
          ? "Phone number not available"
          : "தொலைபேசி எண் கிடைக்கவில்லை"
      );
    }
  };

  // Add keyword to review
  const addKeywordToReview = (keyword: string) => {
    if (reviewComment.includes(keyword)) return;

    const separator = reviewComment ? ", " : "";
    setReviewComment((prev) => prev + separator + keyword);
  };

  // Reset address modal
  const resetAddressModal = () => {
    setAddressModalRequest(null);
    setEditAddressMode(false);
    setCustomAddress(userAddress);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">
            {lang === "en"
              ? "Loading requests..."
              : "கோரிக்கைகளை ஏற்றுகிறது..."}
          </p>
        </div>
      </div>
    );
  }

  // Total current requests
  const totalCurrentRequests = pendingRequests.length + activeRequests.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {lang === "en" ? "My Service Requests" : "என் சேவை கோரிக்கைகள்"}
        </h1>
        <p className="text-gray-600 text-sm">
          {lang === "en"
            ? "Manage your pending and active requests"
            : "உங்கள் நிலுவை மற்றும் செயலில் உள்ள கோரிக்கைகளை நிர்வகிக்கவும்"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-700 mb-1">
            {lang === "en" ? "Pending" : "நிலுவையில்"}
          </p>
          <p className="text-xl font-bold text-gray-800">
            {pendingRequests.length}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            {lang === "en"
              ? "Waiting for response"
              : "பதிலுக்காக காத்திருக்கிறது"}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700 mb-1">
            {lang === "en" ? "Active" : "செயலில்"}
          </p>
          <p className="text-xl font-bold text-gray-800">
            {activeRequests.length}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {lang === "en"
              ? "Ongoing services"
              : "நடந்து கொண்டிருக்கும் சேவைகள்"}
          </p>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {lang === "en"
                ? "⏳ Pending Requests"
                : "⏳ நிலுவையில் உள்ள கோரிக்கைகள்"}
            </h2>
            <span className="text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded">
              {pendingRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request) => {
              const time = getTimeRemaining(request.expiresAt);

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.providerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.serviceType}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        time.expired
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {time.text}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{request.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone className="w-4 h-4" />
                      <span>
                        {lang === "en"
                          ? "Phone: Hidden"
                          : "தொலைபேசி: மறைக்கப்பட்டது"}
                      </span>
                    </div>
                  </div>

                  {request.description && (
                    <p className="mt-3 text-sm text-gray-700 border-t pt-3">
                      {request.description}
                    </p>
                  )}

                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    disabled={loadingAction === `cancel-${request.id}`}
                    className="mt-4 w-full py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 text-sm flex items-center justify-center gap-2"
                  >
                    {loadingAction === `cancel-${request.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {lang === "en" ? "Cancel Request" : "கோரிக்கையை ரத்து செய்"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {lang === "en"
                ? "✅ Active Requests"
                : "✅ செயலில் உள்ள கோரிக்கைகள்"}
            </h2>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {activeRequests.length}
            </span>
          </div>
          <div className="space-y-3">
            {activeRequests.map((request) => {
              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {request.providerName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.serviceType}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {request.status === "accepted"
                        ? lang === "en"
                          ? "Accepted"
                          : "ஏற்றுக்கொள்ளப்பட்டது"
                        : request.status === "in_progress"
                        ? lang === "en"
                          ? "In Progress"
                          : "நடைபெறுகிறது"
                        : lang === "en"
                        ? "Awaiting Confirmation"
                        : "உறுதிப்படுத்தல் காத்திருக்கிறது"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{request.district}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {request.acceptedAt
                          ? `${
                              lang === "en"
                                ? "Accepted"
                                : "ஏற்றுக்கொள்ளப்பட்டது"
                            }: ${formatDate(request.acceptedAt)}`
                          : formatDate(request.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>
                        {request.providerPhone ? (
                          <span className="text-green-600 font-medium">
                            {request.providerPhone}
                          </span>
                        ) : (
                          <span className="text-gray-500">
                            {lang === "en"
                              ? "Phone: Hidden"
                              : "தொலைபேசி: மறைக்கப்பட்டது"}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {request.status === "accepted" &&
                      !request.addressShared && (
                        <button
                          onClick={() => setAddressModalRequest(request)}
                          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                        >
                          <Share2 className="w-4 h-4" />
                          {lang === "en"
                            ? "Share Address"
                            : "முகவரியைப் பகிரவும்"}
                        </button>
                      )}

                    {request.status === "awaiting_confirmation" && (
                      <button
                        onClick={() => setRatingModalRequest(request)}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {lang === "en"
                          ? "Confirm & Rate"
                          : "உறுதிப்படுத்து & மதிப்பிடு"}
                      </button>
                    )}

                    {request.providerPhone && (
                      <button
                        onClick={() =>
                          handleContactProvider(request.providerPhone)
                        }
                        className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" />
                        {lang === "en"
                          ? "Contact Provider"
                          : "வழங்குநரைத் தொடர்பு கொள்ளுங்கள்"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No requests */}
      {totalCurrentRequests === 0 && !loading && (
        <div className="text-center py-10 bg-white rounded-lg border">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {lang === "en"
              ? "No active requests"
              : "செயலில் உள்ள கோரிக்கைகள் இல்லை"}
          </h3>
          <p className="text-gray-600 mb-4">
            {lang === "en"
              ? "Find and request services from providers"
              : "வழங்குநர்களிடமிருந்து சேவைகளைக் கண்டறிந்து கோரிக்கை செய்யுங்கள்"}
          </p>
          <button
            onClick={() =>
              (window.location.href = "/seeker/dashboard?section=home")
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            {lang === "en" ? "Find Services" : "சேவைகளைக் கண்டறியவும்"}
          </button>
        </div>
      )}

      {/* Address Sharing Modal */}
      {addressModalRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === "en" ? "Share Address" : "முகவரியைப் பகிரவும்"}
                </h3>
                <button
                  onClick={resetAddressModal}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-6 space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {lang === "en" ? "Provider" : "வழங்குநர்"}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {addressModalRequest.providerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {addressModalRequest.serviceType}
                  </p>
                </div>

                {/* Phone Display */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Your Phone" : "உங்கள் தொலைபேசி"}
                  </p>
                  <div className="bg-gray-50 p-3 rounded border text-sm">
                    {userPhone || (
                      <span className="text-red-600">
                        {lang === "en"
                          ? "No phone set in profile"
                          : "சுயவிவரத்தில் தொலைபேசி அமைக்கப்படவில்லை"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-700">
                      {lang === "en" ? "Your Address" : "உங்கள் முகவரி"}
                    </p>
                    {!editAddressMode && (
                      <button
                        onClick={() => setEditAddressMode(true)}
                        className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        {lang === "en" ? "Edit" : "திருத்து"}
                      </button>
                    )}
                  </div>

                  {editAddressMode ? (
                    <div className="space-y-3">
                      <textarea
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder={
                          lang === "en"
                            ? "Enter your exact address here..."
                            : "உங்கள் சரியான முகவரியை இங்கே உள்ளிடவும்..."
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[100px]"
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditAddressMode(false);
                            setCustomAddress(userAddress);
                          }}
                          className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          {lang === "en" ? "Cancel" : "ரத்து செய்"}
                        </button>
                        <button
                          onClick={() => {
                            setUserAddress(customAddress);
                            setEditAddressMode(false);
                          }}
                          className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2"
                        >
                          <Save className="w-3 h-3" />
                          {lang === "en" ? "Save" : "சேமிக்கவும்"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-gray-50 p-3 rounded border text-sm">
                        {userAddress || (
                          <span className="text-red-600">
                            {lang === "en"
                              ? "No address set in profile"
                              : "சுயவிவரத்தில் முகவரி அமைக்கப்படவில்லை"}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditAddressMode(true);
                          setCustomAddress(userAddress);
                        }}
                        className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        {lang === "en" ? "Edit Address" : "முகவரியைத் திருத்து"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={resetAddressModal}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {lang === "en" ? "Cancel" : "ரத்து செய்"}
                </button>
                <button
                  onClick={handleShareAddress}
                  disabled={isSharing || !userAddress.trim()}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSharing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {lang === "en" ? "Share Address" : "முகவரியைப் பகிர்"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {ratingModalRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">
                  {lang === "en" ? "Rate Service" : "சேவையை மதிப்பிடு"}
                </h3>
                <button
                  onClick={() => {
                    setRatingModalRequest(null);
                    setRating(0);
                    setReviewComment("");
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="font-semibold text-gray-900">
                    {ratingModalRequest.providerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {ratingModalRequest.serviceType}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lang === "en"
                      ? "Service completed. Please rate your experience."
                      : "சேவை முடிந்தது. தயவுசெய்து உங்கள் அனுபவத்தை மதிப்பிடவும்."}
                  </p>
                </div>

                {/* Star Rating */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                    {lang === "en"
                      ? "How would you rate this service?"
                      : "இந்த சேவையை எவ்வாறு மதிப்பிடுவீர்கள்?"}
                  </p>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-3xl hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-10 h-10 ${
                            star <= rating
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {rating > 0 && (
                    <p className="text-center text-gray-700 font-medium">
                      {rating === 1 && (lang === "en" ? "Poor" : "மோசமான")}
                      {rating === 2 && (lang === "en" ? "Fair" : "நேர்மையான")}
                      {rating === 3 && (lang === "en" ? "Good" : "நல்ல")}
                      {rating === 4 &&
                        (lang === "en" ? "Very Good" : "மிகவும் நல்ல")}
                      {rating === 5 && (lang === "en" ? "Excellent" : "சிறந்த")}
                    </p>
                  )}
                </div>

                {/* Review Comment */}
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {lang === "en"
                      ? "Add a comment (optional)"
                      : "கருத்தைச் சேர்க்கவும் (விருப்பத்தேர்வு)"}
                  </p>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={
                      lang === "en"
                        ? "Tell others about your experience..."
                        : "மற்றவர்களுக்கு உங்கள் அனுபவத்தைப் பற்றி சொல்லுங்கள்..."
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-h-[80px]"
                    rows={3}
                  />
                </div>

                {/* Suggested Keywords */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Suggestions" : "பரிந்துரைகள்"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {REVIEW_KEYWORDS[lang].map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => addKeywordToReview(keyword)}
                        className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setRatingModalRequest(null);
                    setRating(0);
                    setReviewComment("");
                  }}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  {lang === "en" ? "Cancel" : "ரத்து செய்"}
                </button>
                <button
                  onClick={handleSubmitRating}
                  disabled={
                    rating === 0 ||
                    loadingAction === `rate-${ratingModalRequest.id}`
                  }
                  className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingAction === `rate-${ratingModalRequest.id}` && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {lang === "en"
                    ? "Submit Rating"
                    : "மதிப்பீட்டைச் சமர்ப்பிக்கவும்"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
