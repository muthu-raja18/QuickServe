"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Home,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Shield,
  Info,
} from "lucide-react";

import { db } from "../../../../app/firebase/config";
import { doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";

// Tamil Nadu districts
const TAMIL_NADU_DISTRICTS = [
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Trichy",
  "Salem",
  "Tirunelveli",
  "Tiruppur",
  "Erode",
  "Vellore",
  "Thoothukudi",
  "Dindigul",
  "Thanjavur",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Namakkal",
  "Theni",
  "Tiruvallur",
  "Tiruvannamalai",
];

interface SeekerProfile {
  name: string;
  email: string;
  phone: string;
  address: {
    houseNo: string;
    street: string;
    landmark: string;
    city: string;
    district: string;
    pincode: string;
    block: string;
  };
}

export default function ProfileSection() {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [profile, setProfile] = useState<SeekerProfile>({
    name: "",
    email: "",
    phone: "",
    address: {
      houseNo: "",
      street: "",
      landmark: "",
      city: "",
      district: "",
      pincode: "",
      block: "",
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load profile data
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          const address = data.address || {};

          setProfile({
            name: data.name || user.displayName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            address: {
              houseNo: address.houseNo || "",
              street: address.street || "",
              landmark: address.landmark || "",
              city: address.city || "",
              district: address.district || "",
              pincode: address.pincode || "",
              block: address.block || "",
            },
          });
        } else {
          // First time user - only name/email from auth
          setProfile({
            name: user.displayName || "",
            email: user.email || "",
            phone: "",
            address: {
              houseNo: "",
              street: "",
              landmark: "",
              city: "",
              district: "",
              pincode: "",
              block: "",
            },
          });
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Check if address is complete
  const hasCompleteAddress = () => {
    const addr = profile.address;
    return addr.district.trim() !== "" && addr.block.trim() !== "";
  };

  // Check if phone is set
  const hasPhone = () => {
    return profile.phone.trim().length === 10;
  };

  // Check if profile is complete (ready for requests)
  const isProfileComplete = () => {
    return hasCompleteAddress() && hasPhone();
  };

  // Save profile changes
  const handleSave = async () => {
    if (!user?.uid) return;

    // Validate phone
    if (!hasPhone()) {
      setError(
        lang === "en"
          ? "Please enter a valid 10-digit phone number"
          : "சரியான 10 இலக்க தொலைபேசி எண்ணை உள்ளிடவும்"
      );
      return;
    }

    // Validate address
    if (!hasCompleteAddress()) {
      setError(
        lang === "en"
          ? "District and Block are required for service requests"
          : "சேவை கோரிக்கைகளுக்கு மாவட்டம் மற்றும் பிளாக் தேவை"
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        address: profile.address,
        updatedAt: serverTimestamp(),
      });

      setSuccess(
        lang === "en"
          ? "Profile updated successfully!"
          : "சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!"
      );
      setEditing(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(
        lang === "en"
          ? "Failed to save changes. Please try again."
          : "மாற்றங்களை சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்."
      );
    } finally {
      setSaving(false);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setEditing(false);
    // Reload original data
    if (user?.uid) {
      const reloadProfile = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const address = data.address || {};

            setProfile({
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              address: {
                houseNo: address.houseNo || "",
                street: address.street || "",
                landmark: address.landmark || "",
                city: address.city || "",
                district: address.district || "",
                pincode: address.pincode || "",
                block: address.block || "",
              },
            });
          }
        } catch (err) {
          console.error("Error reloading data:", err);
        }
      };
      reloadProfile();
    }
  };

  // Build display address
  const buildDisplayAddress = () => {
    const addr = profile.address;
    if (!hasCompleteAddress()) return "";

    const parts = [
      addr.houseNo &&
        `${lang === "en" ? "House No" : "வீட்டு எண்"}: ${addr.houseNo}`,
      addr.street && `${lang === "en" ? "Street" : "தெரு"}: ${addr.street}`,
      addr.landmark &&
        `${lang === "en" ? "Near" : "அருகில்"}: ${addr.landmark}`,
      addr.city,
      addr.district,
      addr.pincode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {lang === "en" ? "Profile" : "சுயவிவரம்"}
              </h1>
              <p className="text-sm text-gray-600">
                {lang === "en"
                  ? "Manage your contact information"
                  : "உங்கள் தொடர்பு தகவல்களை நிர்வகிக்கவும்"}
              </p>
            </div>
          </div>

          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {lang === "en" ? "Edit Profile" : "சுயவிவரத்தைத் திருத்து"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                {lang === "en" ? "Cancel" : "ரத்து செய்"}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving
                  ? lang === "en"
                    ? "Saving..."
                    : "சேமிக்கிறது..."
                  : lang === "en"
                  ? "Save Changes"
                  : "மாற்றங்களை சேமிக்கவும்"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Banner */}
      {!isProfileComplete() && !editing && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">
                {lang === "en"
                  ? "Profile Incomplete"
                  : "சுயவிவரம் முழுமையடையவில்லை"}
              </p>
              <p className="text-sm text-amber-700 mt-1">
                {lang === "en"
                  ? "Please add your phone number and address to request services"
                  : "சேவைகளைக் கோர உங்கள் தொலைபேசி எண் மற்றும் முகவரியைச் சேர்க்கவும்"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {success}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        {/* Profile Status */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
          <div
            className={`p-2 rounded ${
              isProfileComplete() ? "bg-green-100" : "bg-amber-100"
            }`}
          >
            {isProfileComplete() ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <Info className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {isProfileComplete()
                ? lang === "en"
                  ? "Profile Complete"
                  : "சுயவிவரம் முழுமையானது"
                : lang === "en"
                ? "Complete Your Profile"
                : "உங்கள் சுயவிவரத்தை முடிக்கவும்"}
            </p>
            <p className="text-sm text-gray-600">
              {isProfileComplete()
                ? lang === "en"
                  ? "Ready to request services"
                  : "சேவைகளைக் கோர தயார்"
                : lang === "en"
                ? "Add phone and address to continue"
                : "தொடர தொலைபேசி மற்றும் முகவரியைச் சேர்க்கவும்"}
            </p>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-4 pb-2 border-b">
            {lang === "en" ? "Personal Information" : "தனிப்பட்ட தகவல்"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Full Name" : "முழு பெயர்"}
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <User className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{profile.name || "-"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lang === "en"
                  ? "Set during signup"
                  : "பதிவு செய்யும் போது அமைக்கப்பட்டது"}
              </p>
            </div>

            {/* Email - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Email Address" : "மின்னஞ்சல் முகவரி"}
              </label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <Mail className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{profile.email || "-"}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {lang === "en"
                  ? "Set during signup"
                  : "பதிவு செய்யும் போது அமைக்கப்பட்டது"}
              </p>
            </div>

            {/* Phone - Editable */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Phone Number" : "தொலைபேசி எண்"} *
                {hasPhone() && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    ✓ {lang === "en" ? "Added" : "சேர்க்கப்பட்டது"}
                  </span>
                )}
              </label>
              {editing ? (
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span
                    className={
                      profile.phone ? "font-medium" : "text-gray-400 italic"
                    }
                  >
                    {profile.phone ||
                      (lang === "en"
                        ? "Not added yet"
                        : "இதுவரை சேர்க்கப்படவில்லை")}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {lang === "en"
                  ? "* Required for providers to contact you"
                  : "* வழங்குநர்கள் உங்களைத் தொடர்புகொள்ள தேவை"}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h3 className="font-semibold text-gray-900">
              {lang === "en" ? "Address Information" : "முகவரி தகவல்"}
            </h3>
            {hasCompleteAddress() && !editing && (
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full">
                ✓ {lang === "en" ? "Complete" : "முழுமையானது"}
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* District - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "District" : "மாவட்டம்"} *
                {profile.address.district && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    ✓ {lang === "en" ? "Added" : "சேர்க்கப்பட்டது"}
                  </span>
                )}
              </label>
              {editing ? (
                <select
                  value={profile.address.district}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      address: { ...profile.address, district: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">
                    {lang === "en"
                      ? "Select your district"
                      : "உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்"}
                  </option>
                  {TAMIL_NADU_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span
                    className={
                      profile.address.district
                        ? "font-medium"
                        : "text-gray-400 italic"
                    }
                  >
                    {profile.address.district ||
                      (lang === "en"
                        ? "Select district"
                        : "மாவட்டத்தைத் தேர்ந்தெடுக்கவும்")}
                  </span>
                </div>
              )}
            </div>

            {/* Block/Area - Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Block/Area" : "பிளாக்/பகுதி"} *
                {profile.address.block && (
                  <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                    ✓ {lang === "en" ? "Added" : "சேர்க்கப்பட்டது"}
                  </span>
                )}
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profile.address.block}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      address: { ...profile.address, block: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    lang === "en"
                      ? "Eg: Anna Nagar, T.Nagar"
                      : "எ.கா: அண்ணா நகர், டி.நகர்"
                  }
                  required
                />
              ) : (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                  <Home className="w-5 h-5 text-gray-500" />
                  <span
                    className={
                      profile.address.block
                        ? "font-medium"
                        : "text-gray-400 italic"
                    }
                  >
                    {profile.address.block ||
                      (lang === "en"
                        ? "Enter block/area"
                        : "பிளாக்/பகுதியை உள்ளிடவும்")}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                {lang === "en"
                  ? "Your locality, area, or neighborhood name"
                  : "உங்கள் இடம், பகுதி அல்லது அருகில் உள்ள பகுதி பெயர்"}
              </p>
            </div>

            {/* Additional Address Fields (Show only when editing or if filled) */}
            {(editing ||
              profile.address.houseNo ||
              profile.address.street ||
              profile.address.landmark ||
              profile.address.city ||
              profile.address.pincode) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                {/* House No */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "House No" : "வீட்டு எண்"}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.address.houseNo}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            houseNo: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="123"
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span
                        className={
                          profile.address.houseNo ? "" : "text-gray-400 italic"
                        }
                      >
                        {profile.address.houseNo || "-"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Street */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Street" : "தெரு"}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.address.street}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            street: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={lang === "en" ? "Main Road" : "மெயின் ரோடு"}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span
                        className={
                          profile.address.street ? "" : "text-gray-400 italic"
                        }
                      >
                        {profile.address.street || "-"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Landmark */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Landmark" : "குறிப்பிடத்தக்க இடம்"}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.address.landmark}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            landmark: e.target.value,
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        lang === "en" ? "Near Hospital" : "மருத்துவமனை அருகில்"
                      }
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span
                        className={
                          profile.address.landmark ? "" : "text-gray-400 italic"
                        }
                      >
                        {profile.address.landmark || "-"}
                      </span>
                    </div>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "City" : "நகரம்"}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.address.city}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: { ...profile.address, city: e.target.value },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={
                        lang === "en" ? "Eg: Chennai" : "எ.கா: சென்னை"
                      }
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span
                        className={
                          profile.address.city ? "" : "text-gray-400 italic"
                        }
                      >
                        {profile.address.city || "-"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {lang === "en" ? "Pincode" : "அஞ்சல் குறியீடு"}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.address.pincode}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          address: {
                            ...profile.address,
                            pincode: e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6),
                          },
                        })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="600001"
                      maxLength={6}
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span
                        className={
                          profile.address.pincode ? "" : "text-gray-400 italic"
                        }
                      >
                        {profile.address.pincode || "-"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Address Summary (Display when not editing and address is complete) */}
          {!editing && hasCompleteAddress() && buildDisplayAddress() && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">
                {lang === "en" ? "Your Service Address" : "உங்கள் சேவை முகவரி"}
              </h4>
              <p className="text-gray-800">{buildDisplayAddress()}</p>
            </div>
          )}
        </div>

        {/* Privacy Note */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 mb-2">
                {lang === "en" ? "Privacy Protection" : "தனியுரிமை பாதுகாப்பு"}
              </p>
              <p className="text-sm text-gray-700">
                {lang === "en"
                  ? "Your phone number and exact address are shared with providers only after they accept your request. Until then, they see only your district and block for service matching."
                  : "வழங்குநர்கள் உங்கள் கோரிக்கையை ஏற்றுக்கொண்ட பிறகு மட்டுமே உங்கள் தொலைபேசி எண் மற்றும் சரியான முகவரி பகிரப்படும். அதுவரை, சேவை பொருத்தத்திற்காக அவர்கள் உங்கள் மாவட்டம் மற்றும் பிளாக் பகுதியை மட்டுமே பார்க்கிறார்கள்."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
