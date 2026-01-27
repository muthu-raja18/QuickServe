"use client";

import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
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
    // 1️⃣ Google Auth
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

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
      await signOut(auth);
      throw new Error("Email already registered as Provider");
    }

    // 3️⃣ Check seeker document
    const seekerRef = doc(db, "users", user.uid);
    const seekerSnap = await getDoc(seekerRef);

    // 4️⃣ Create seeker if new
    if (!seekerSnap.exists()) {
      const nameFromEmail = email.split("@")[0];

      await setDoc(seekerRef, {
        uid: user.uid,
        name: user.displayName || nameFromEmail,
        email,
        role: "seeker",
        authProvider: "google",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Google login failed",
    };
  }
};
