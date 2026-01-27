"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import {
  Zap,
  Clock,
  Calendar,
  Bell,
  MapPin,
  Sun,
  Moon,
  CheckCircle,
  XCircle,
  Settings,
} from "lucide-react";

import { db } from "../../../firebase/config";
import { doc, updateDoc, getDoc } from "firebase/firestore";

interface AvailabilityData {
  isAvailable: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  breakTime: {
    start: string;
    end: string;
  };
  serviceRadius: number; // in km
  instantBooking: boolean;
  advanceNotice: number; // in hours
  maxJobsPerDay: number;
}

export default function AvailabilitySection({
  isAvailable,
  setIsAvailable,
}: {
  isAvailable: boolean;
  setIsAvailable: (available: boolean) => Promise<void>;
}) {
  const { lang } = useLanguage();
  const { user } = useAuth();

  const [availability, setAvailability] = useState<AvailabilityData>({
    isAvailable: true,
    workingHours: {
      start: "09:00",
      end: "18:00",
    },
    workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    breakTime: {
      start: "13:00",
      end: "14:00",
    },
    serviceRadius: 10,
    instantBooking: true,
    advanceNotice: 2,
    maxJobsPerDay: 3,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load availability settings
  useEffect(() => {
    if (!user?.uid) return;

    const loadAvailability = async () => {
      try {
        setLoading(true);
        const providerDoc = await getDoc(doc(db, "providers", user.uid));

        if (providerDoc.exists()) {
          const data = providerDoc.data();
          if (data.availabilitySettings) {
            setAvailability(data.availabilitySettings);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading availability:", err);
        setError(
          lang === "en"
            ? "Failed to load availability settings"
            : "கிடைக்கும் அமைப்புகளை ஏற்ற முடியவில்லை"
        );
        setLoading(false);
      }
    };

    loadAvailability();
  }, [user, lang]);

  // Save availability settings
  const handleSaveSettings = async () => {
    if (!user?.uid) return;

    try {
      setSaving(true);
      setError(null);

      const providerRef = doc(db, "providers", user.uid);
      await updateDoc(providerRef, {
        availabilitySettings: availability,
        updatedAt: new Date(),
      });

      setSuccess(
        lang === "en"
          ? "Availability settings saved successfully!"
          : "கிடைக்கும் அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டன!"
      );

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving availability:", err);
      setError(
        lang === "en"
          ? "Failed to save availability settings"
          : "கிடைக்கும் அமைப்புகளை சேமிக்க முடியவில்லை"
      );
    } finally {
      setSaving(false);
    }
  };

  // Handle online status toggle
  const handleToggleAvailable = async () => {
    await setIsAvailable(!availability.isAvailable);
    setAvailability((prev) => ({ ...prev, isAvailable: !prev.isAvailable }));
  };

  // Working days options
  const dayOptions = [
    { value: "Mon", label: lang === "en" ? "Monday" : "திங்கள்" },
    { value: "Tue", label: lang === "en" ? "Tuesday" : "செவ்வாய்" },
    { value: "Wed", label: lang === "en" ? "Wednesday" : "புதன்" },
    { value: "Thu", label: lang === "en" ? "Thursday" : "வியாழன்" },
    { value: "Fri", label: lang === "en" ? "Friday" : "வெள்ளி" },
    { value: "Sat", label: lang === "en" ? "Saturday" : "சனி" },
    { value: "Sun", label: lang === "en" ? "Sunday" : "ஞாயிறு" },
  ];

  // Advance notice options
  const noticeOptions = [
    { value: 1, label: lang === "en" ? "1 hour" : "1 மணி நேரம்" },
    { value: 2, label: lang === "en" ? "2 hours" : "2 மணி நேரம்" },
    { value: 4, label: lang === "en" ? "4 hours" : "4 மணி நேரம்" },
    { value: 8, label: lang === "en" ? "8 hours" : "8 மணி நேரம்" },
    { value: 24, label: lang === "en" ? "1 day" : "1 நாள்" },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {lang === "en"
              ? "Availability Settings"
              : "கிடைக்கும் நிலை அமைப்புகள்"}
          </h2>
          <p className="text-gray-600 mt-1">
            {lang === "en"
              ? "Set your working hours, availability, and service preferences"
              : "உங்கள் பணி நேரங்கள், கிடைக்கும் தன்மை மற்றும் சேவை விருப்பங்களை அமைக்கவும்"}
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <p className="text-green-800">{success}</p>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-xl p-4"
        >
          <p className="text-red-800">{error}</p>
        </motion.div>
      )}

      {/* Availability Status Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isAvailable ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {isAvailable ? (
                <Zap className="w-6 h-6 text-green-600" />
              ) : (
                <Clock className="w-6 h-6 text-gray-600" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">
                {isAvailable
                  ? lang === "en"
                    ? "You're Available for Jobs"
                    : "நீங்கள் வேலைகளுக்கு கிடைக்கும்"
                  : lang === "en"
                  ? "You're Currently Busy"
                  : "நீங்கள் தற்போது பிஸியாக இருக்கிறீர்கள்"}
              </h3>
              <p className="text-gray-600 mt-1">
                {isAvailable
                  ? lang === "en"
                    ? "Seekers can send you service requests"
                    : "தேடுபவர்கள் உங்களுக்கு சேவை கோரிக்கைகளை அனுப்பலாம்"
                  : lang === "en"
                  ? "You won't receive new requests until available"
                  : "கிடைக்கும் வரை புதிய கோரிக்கைகள் உங்களுக்கு கிடைக்காது"}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleAvailable}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              isAvailable
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            {isAvailable
              ? lang === "en"
                ? "Go Busy"
                : "பிஸியாக செல்"
              : lang === "en"
              ? "Go Available"
              : "கிடைக்கும் செல்"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              {lang === "en" ? "Working Hours" : "பணி நேரங்கள்"}
            </p>
            <p className="font-bold text-gray-800 mt-1">
              {availability.workingHours.start} -{" "}
              {availability.workingHours.end}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              {lang === "en" ? "Service Radius" : "சேவை ஆரம்"}
            </p>
            <p className="font-bold text-gray-800 mt-1">
              {availability.serviceRadius} km
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              {lang === "en" ? "Max Jobs/Day" : "அதிகபட்ச வேலைகள்/நாள்"}
            </p>
            <p className="font-bold text-gray-800 mt-1">
              {availability.maxJobsPerDay}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              {lang === "en" ? "Advance Notice" : "முன்னறிவிப்பு"}
            </p>
            <p className="font-bold text-gray-800 mt-1">
              {availability.advanceNotice}h
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Working Hours */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" />
            {lang === "en" ? "Working Hours" : "பணி நேரங்கள்"}
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Start Time" : "தொடக்க நேரம்"}
              </label>
              <input
                type="time"
                value={availability.workingHours.start}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    workingHours: {
                      ...availability.workingHours,
                      start: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "End Time" : "முடிவு நேரம்"}
              </label>
              <input
                type="time"
                value={availability.workingHours.end}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    workingHours: {
                      ...availability.workingHours,
                      end: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Break Time */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 mb-4">
            <Sun className="w-5 h-5" />
            {lang === "en" ? "Break Time" : "இடைவேளை நேரம்"}
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Break Start" : "இடைவேளை தொடக்கம்"}
              </label>
              <input
                type="time"
                value={availability.breakTime.start}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    breakTime: {
                      ...availability.breakTime,
                      start: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Break End" : "இடைவேளை முடிவு"}
              </label>
              <input
                type="time"
                value={availability.breakTime.end}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    breakTime: {
                      ...availability.breakTime,
                      end: e.target.value,
                    },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5" />
            {lang === "en" ? "Working Days" : "பணி நாட்கள்"}
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dayOptions.map((day) => (
              <button
                key={day.value}
                onClick={() => {
                  const isSelected = availability.workingDays.includes(
                    day.value
                  );
                  setAvailability({
                    ...availability,
                    workingDays: isSelected
                      ? availability.workingDays.filter((d) => d !== day.value)
                      : [...availability.workingDays, day.value],
                  });
                }}
                className={`p-3 rounded-lg border text-center transition ${
                  availability.workingDays.includes(day.value)
                    ? "bg-teal-50 border-teal-300 text-teal-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Service Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            {lang === "en" ? "Service Preferences" : "சேவை விருப்பங்கள்"}
          </h4>

          <div className="space-y-4">
            {/* Service Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en" ? "Service Radius (km)" : "சேவை ஆரம் (கி.மீ)"}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={availability.serviceRadius}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      serviceRadius: parseInt(e.target.value),
                    })
                  }
                  className="flex-1"
                />
                <span className="w-16 text-center font-medium">
                  {availability.serviceRadius} km
                </span>
              </div>
            </div>

            {/* Max Jobs Per Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en"
                  ? "Maximum Jobs Per Day"
                  : "ஒரு நாளைக்கு அதிகபட்ச வேலைகள்"}
              </label>
              <select
                value={availability.maxJobsPerDay}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    maxJobsPerDay: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} {lang === "en" ? "jobs" : "வேலைகள்"}
                  </option>
                ))}
              </select>
            </div>

            {/* Advance Notice */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {lang === "en"
                  ? "Minimum Advance Notice"
                  : "குறைந்தபட்ச முன்னறிவிப்பு"}
              </label>
              <select
                value={availability.advanceNotice}
                onChange={(e) =>
                  setAvailability({
                    ...availability,
                    advanceNotice: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {noticeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Instant Booking Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  {lang === "en" ? "Instant Booking" : "உடனடி பதிவு"}
                </p>
                <p className="text-sm text-gray-600">
                  {lang === "en"
                    ? "Allow seekers to book without confirmation"
                    : "உறுதிப்படுத்தாமல் தேடுபவர்கள் பதிவு செய்ய அனுமதிக்கவும்"}
                </p>
              </div>
              <button
                onClick={() =>
                  setAvailability({
                    ...availability,
                    instantBooking: !availability.instantBooking,
                  })
                }
                className={`w-12 h-6 rounded-full transition ${
                  availability.instantBooking ? "bg-teal-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transform transition ${
                    availability.instantBooking
                      ? "translate-x-7"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition flex items-center gap-2 disabled:opacity-50"
        >
          <Settings className="w-5 h-5" />
          {saving
            ? lang === "en"
              ? "Saving..."
              : "சேமிக்கிறது..."
            : lang === "en"
            ? "Save All Settings"
            : "அனைத்து அமைப்புகளையும் சேமிக்கவும்"}
        </button>
      </div>
    </div>
  );
}
