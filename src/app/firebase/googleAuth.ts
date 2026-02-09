"use client";

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./config";

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogleSeeker = async () => {
  try {
    console.log("Starting Google sign-in for seeker...");

    // 1️⃣ Google Auth
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    console.log("Google user authenticated:", user.email);

    if (!user.email) {
      throw new Error("No email found in Google account");
    }

    const email = user.email.toLowerCase();

    // 2️⃣ BLOCK if email exists as PROVIDER
    const providerQuery = query(
      collection(db, "providers"),
      where("email", "==", email)
    );
    const providerSnap = await getDocs(providerQuery);

    if (!providerSnap.empty) {
      console.log("Email exists as provider, blocking...");
      throw new Error("This email is already registered as a Provider");
    }

    // 3️⃣ Check seeker document
    const seekerRef = doc(db, "users", user.uid);
    const seekerSnap = await getDoc(seekerRef);

    // 4️⃣ Create or update seeker document
    if (!seekerSnap.exists()) {
      console.log("Creating new seeker document...");
      await setDoc(seekerRef, {
        uid: user.uid,
        name: user.displayName || email.split("@")[0],
        email,
        phone: "",
        role: "seeker",
        authProvider: "google",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      console.log("Updating existing seeker document...");
      // Ensure role is set to seeker
      await setDoc(
        seekerRef,
        {
          role: "seeker",
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 5️⃣ ✅ CRITICAL: Store role in localStorage BEFORE auth state change
    localStorage.setItem("userRole", "seeker");
    console.log("Role stored in localStorage: seeker");

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        role: "seeker",
      },
    };
  } catch (error: any) {
    console.error("Google auth error:", error);
    return {
      success: false,
      message: error.message || "Google login failed",
    };
  }
};

// ✅ NEW: Function to trigger AuthContext refresh
export const triggerAuthRefresh = () => {
  // Dispatch custom event to notify AuthContext
  window.dispatchEvent(new Event("authStateChanged"));
};
