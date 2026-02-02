"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, Unsubscribe } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { getActualRole, loginWithRole } from "../firebase/authWithRole";

/* ===================== TYPES ===================== */

export interface ProviderData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  district: string;
  block: string;
  photoLink: string;
  proofLink: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  status: "pending" | "approved" | "rejected";
  address?: {
    fullAddress: string;
    district?: string;
    block?: string;
  };
  createdAt: any;
  updatedAt: any;
  rating?: {
    average: number;
    totalReviews: number;
  };
  availability?: boolean;
}

export interface SeekerData {
  uid: string;
  name: string;
  email: string;
  phone: string;
  role: "seeker";
  address?: {
    fullAddress: string;
    district?: string;
    block?: string;
  };
  createdAt: any;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  role: "provider" | "seeker" | null;
  providerData?: ProviderData;
  seekerData?: SeekerData;
  isApproved?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  userData: SeekerData | ProviderData | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
    role: "provider" | "seeker"
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/* ===================== CONTEXT ===================== */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ===================== PROVIDER ===================== */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<SeekerData | ProviderData | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  /* ---------- Fetch Firestore user data ---------- */
  const fetchUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      // Get stored role from localStorage as fallback
      const storedRole = localStorage.getItem("userRole") as
        | "provider"
        | "seeker"
        | null;

      // Fetch both collections in parallel (FASTER)
      const [seekerSnap, providerSnap] = await Promise.all([
        getDoc(doc(db, "users", firebaseUser.uid)),
        getDoc(doc(db, "providers", firebaseUser.uid)),
      ]);

      const hasSeekerData = seekerSnap.exists();
      const hasProviderData = providerSnap.exists();

      console.log("Auth Debug:", {
        uid: firebaseUser.uid,
        hasSeekerData,
        hasProviderData,
        storedRole,
      });

      // DECISION LOGIC: Prioritize Firestore data over stored role
      let role: "provider" | "seeker" | null = null;

      // Case 1: User has BOTH seeker and provider data (dual account)
      if (hasSeekerData && hasProviderData) {
        console.log("User has both seeker and provider data");

        // Try to get role from Firestore function
        const firebaseRole = await getActualRole(firebaseUser.email || "");
        console.log("Firebase role result:", firebaseRole);

        // If Firebase returns a valid role, use it
        if (firebaseRole === "provider" || firebaseRole === "seeker") {
          role = firebaseRole;
        }
        // If Firebase returns "none", check if provider is approved
        else if (firebaseRole === "none") {
          const providerData = providerSnap.data() as ProviderData;
          // If provider is approved, default to provider, else seeker
          role = providerData.status === "approved" ? "provider" : "seeker";
        }

        // Store the determined role
        if (role) {
          localStorage.setItem("userRole", role);
        }
      }
      // Case 2: User has ONLY provider data
      else if (hasProviderData && !hasSeekerData) {
        role = "provider";
        localStorage.setItem("userRole", "provider");
      }
      // Case 3: User has ONLY seeker data
      else if (hasSeekerData && !hasProviderData) {
        role = "seeker";
        localStorage.setItem("userRole", "seeker");
      }
      // Case 4: User has NO data in Firestore (shouldn't happen, but fallback)
      else {
        console.log("No Firestore data found, using stored role:", storedRole);
        role = storedRole; // Use stored role as last resort
      }

      console.log("Final determined role:", role);

      // Build user object based on determined role
      if (role === "provider" && hasProviderData) {
        const providerData = providerSnap.data() as ProviderData;
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: "provider",
          providerData,
          isApproved: providerData.status === "approved",
        };
      }

      if (role === "seeker" && hasSeekerData) {
        const seekerData = seekerSnap.data() as SeekerData;
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: "seeker",
          seekerData,
        };
      }

      // If we still don't have a role, return null (will redirect to role selection)
      console.warn(
        "Could not determine user role, redirecting to role selection"
      );
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: null,
      };
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      // On error, try to use stored role
      const storedRole = localStorage.getItem("userRole") as
        | "provider"
        | "seeker"
        | null;
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: storedRole,
      };
    }
  };

  /* ---------- Auth state listener ---------- */
  useEffect(() => {
    let providerUnsub: Unsubscribe | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Auth state changed, user:", firebaseUser?.email);
      setLoading(true);

      try {
        if (firebaseUser) {
          const authUser = await fetchUserData(firebaseUser);
          console.log("🔥 User data fetched:", authUser);
          setUser(authUser);
          setUserData(authUser.seekerData || authUser.providerData || null);

          // realtime provider approval update
          if (authUser.role === "provider") {
            providerUnsub = onSnapshot(
              doc(db, "providers", firebaseUser.uid),
              (snap) => {
                if (snap.exists()) {
                  const providerData = snap.data() as ProviderData;
                  setUser((prev) =>
                    prev
                      ? {
                          ...prev,
                          providerData,
                          isApproved: providerData.status === "approved",
                        }
                      : prev
                  );
                  setUserData(providerData);
                }
              }
            );
          }
        } else {
          console.log("🔥 No Firebase user, clearing state");
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("🔥 Auth error:", error);
        setUser(null);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (providerUnsub) providerUnsub();
    };
  }, []);

  /* ---------- Login ---------- */
  const login = async (
    email: string,
    password: string,
    role: "provider" | "seeker"
  ) => {
    try {
      const result = await loginWithRole(email, password, role);

      // Store role in localStorage on successful login
      if (result.success) {
        localStorage.setItem("userRole", role);
        console.log("Stored role in localStorage:", role);
      }

      return result;
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  /* ---------- Logout ---------- */
  const signOut = async () => {
    // Clear localStorage
    localStorage.removeItem("userRole");
    console.log("Cleared role from localStorage");

    await firebaseSignOut(auth);
    setUser(null);
    setUserData(null);
  };

  /* ---------- Refresh ---------- */
  const refreshUser = async () => {
    if (auth.currentUser) {
      const updated = await fetchUserData(auth.currentUser);
      setUser(updated);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        login,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ===================== HOOK ===================== */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
