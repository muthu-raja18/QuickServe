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
    const role = await getActualRole(firebaseUser.email || "");

    // Check if user has data in both collections
    const seekerSnap = await getDoc(doc(db, "users", firebaseUser.uid));
    const providerSnap = await getDoc(doc(db, "providers", firebaseUser.uid));

    const hasSeekerData = seekerSnap.exists();
    const hasProviderData = providerSnap.exists();

    // If user has data in both collections, allow access to both roles
    if (hasSeekerData && hasProviderData) {
      const seekerData = seekerSnap.data() as SeekerData;
      const providerData = providerSnap.data() as ProviderData;
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: (role === "none" ? null : role) || "seeker", // Default to seeker if role is ambiguous
        seekerData,
        providerData,
        isApproved: providerData.status === "approved",
      };
    }

    // Original logic for single role users
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

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: null,
    };
  };

  /* ---------- Auth state listener ---------- */
  useEffect(() => {
    let providerUnsub: Unsubscribe | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        const authUser = await fetchUserData(firebaseUser);
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
        setUser(null);
        setUserData(null);
      }

      setLoading(false);
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
      return await loginWithRole(email, password, role);
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  /* ---------- Logout ---------- */
  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
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
