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
  setPersistence,
  browserLocalPersistence,
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
  initialized: boolean;
  login: (
    email: string,
    password: string,
    role: "provider" | "seeker"
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  manualSetUser: (userData: Partial<AuthUser>) => void; // ✅ NEW
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
  const [initialized, setInitialized] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0); // ✅ NEW: Force refresh counter

  /* ---------- Setup Firebase Persistence ---------- */
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log("Firebase persistence set to local storage");
      } catch (error) {
        console.error("Error setting persistence:", error);
      }
    };
    setupPersistence();
  }, []);

  /* ---------- Enhanced fetchUserData ---------- */
  const fetchUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      // 1. FIRST: Check localStorage for quick role access
      const storedRole = localStorage.getItem("userRole") as
        | "provider"
        | "seeker"
        | null;

      console.log("Auth Debug - Stored role from localStorage:", storedRole);

      // ✅ NEW: If stored role exists, verify it's correct
      if (storedRole) {
        // Quick return with stored role, then verify in background
        const immediateUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: storedRole,
          isApproved: false,
        };

        // Background verification
        setTimeout(async () => {
          try {
            const verifiedUser = await fetchFullUserData(firebaseUser);
            if (auth.currentUser?.uid === firebaseUser.uid) {
              // Only update if role changed
              if (verifiedUser.role !== storedRole) {
                console.log("Role mismatch detected, updating...");
                setUser(verifiedUser);
                setUserData(
                  verifiedUser.seekerData || verifiedUser.providerData || null
                );
              }
            }
          } catch (error) {
            console.error("Background verification error:", error);
          }
        }, 100);

        return immediateUser;
      }

      // 2. No stored role - fetch from Firestore
      return await fetchFullUserData(firebaseUser);
    } catch (error) {
      console.error("Error in fetchUserData:", error);
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

  /* ---------- Helper: Fetch Complete User Data ---------- */
  const fetchFullUserData = async (firebaseUser: User): Promise<AuthUser> => {
    try {
      const [seekerSnap, providerSnap] = await Promise.all([
        getDoc(doc(db, "users", firebaseUser.uid)),
        getDoc(doc(db, "providers", firebaseUser.uid)),
      ]);

      const hasSeekerData = seekerSnap.exists();
      const hasProviderData = providerSnap.exists();

      console.log("Firestore data check:", {
        uid: firebaseUser.uid,
        hasSeekerData,
        hasProviderData,
      });

      let role: "provider" | "seeker" | null = null;
      let providerStatus: "pending" | "approved" | "rejected" | null = null;

      // Determine role based on Firestore data
      if (hasSeekerData && !hasProviderData) {
        role = "seeker";
      } else if (hasProviderData && !hasSeekerData) {
        role = "provider";
        const providerData = providerSnap.data() as ProviderData;
        providerStatus = providerData.status;
      } else if (hasSeekerData && hasProviderData) {
        // Dual account - check which one is primary
        const providerData = providerSnap.data() as ProviderData;
        if (providerData.status === "approved") {
          role = "provider";
          providerStatus = "approved";
        } else {
          role = "seeker";
        }
      }

      // Store role in localStorage
      if (role) {
        localStorage.setItem("userRole", role);
        console.log("Role stored in localStorage:", role);
      }

      // Build complete user object
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

      // No role determined
      console.warn("No role determined from Firestore");
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        role: null,
      };
    } catch (error) {
      console.error("Error in fetchFullUserData:", error);
      throw error;
    }
  };

  /* ---------- FIXED: Enhanced Auth State Listener ---------- */
  useEffect(() => {
    console.log("🔄 AuthProvider mounted - Setting up listeners");

    let providerUnsub: Unsubscribe | null = null;
    let isMounted = true;
    let cleanupCalled = false;

    const handleAuthStateChange = async (firebaseUser: User | null) => {
      if (!isMounted || cleanupCalled) {
        return;
      }

      console.log(
        "🔥 Auth state changed - Firebase user:",
        firebaseUser?.email
      );

      // Set loading only if not initialized yet
      if (!initialized) {
        setLoading(true);
      }

      try {
        if (firebaseUser) {
          console.log("🔥 Fetching user data for:", firebaseUser.email);

          // ✅ CRITICAL FIX: Check localStorage FIRST for Google login
          const storedRole = localStorage.getItem("userRole") as
            | "provider"
            | "seeker"
            | null;

          // If we have stored role from Google login, use it immediately
          if (storedRole) {
            const immediateUser: AuthUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              role: storedRole,
              isApproved: false,
            };

            setUser(immediateUser);

            // Fetch full data in background
            setTimeout(async () => {
              try {
                const fullUserData = await fetchFullUserData(firebaseUser);
                if (
                  isMounted &&
                  !cleanupCalled &&
                  auth.currentUser?.uid === firebaseUser.uid
                ) {
                  setUser(fullUserData);
                  setUserData(
                    fullUserData.seekerData || fullUserData.providerData || null
                  );
                }
              } catch (error) {
                console.error("Background data fetch error:", error);
              }
            }, 0);
          } else {
            // Normal flow for email/password login
            const authUser = await fetchUserData(firebaseUser);
            setUser(authUser);
            setUserData(authUser.seekerData || authUser.providerData || null);
          }

          // Set up real-time listener for provider status
          if (firebaseUser) {
            if (providerUnsub) {
              providerUnsub();
            }

            providerUnsub = onSnapshot(
              doc(db, "providers", firebaseUser.uid),
              (snap) => {
                if (!isMounted || cleanupCalled) return;

                if (snap.exists()) {
                  const providerData = snap.data() as ProviderData;
                  console.log("Provider status updated:", providerData.status);

                  setUser((prev) => {
                    if (!prev || prev.uid !== firebaseUser.uid) return prev;

                    return {
                      ...prev,
                      providerData,
                      isApproved: providerData.status === "approved",
                    };
                  });
                  setUserData(providerData);
                }
              },
              (error) => {
                console.error("Provider snapshot error:", error);
              }
            );
          }
        } else {
          console.log("🔥 No Firebase user - clearing state");
          setUser(null);
          setUserData(null);
          localStorage.removeItem("userRole");

          if (providerUnsub) {
            providerUnsub();
            providerUnsub = null;
          }
        }
      } catch (error) {
        console.error("🔥 Auth error in listener:", error);
        if (!isMounted || cleanupCalled) return;

        setUser(null);
        setUserData(null);
      } finally {
        if (!isMounted || cleanupCalled) return;

        setLoading(false);
        if (!initialized) {
          setInitialized(true);
          console.log("✅ Auth initialization complete");
        }
      }
    };

    // Main auth listener
    const authUnsub = onAuthStateChanged(auth, handleAuthStateChange);

    // ✅ NEW: Listen for manual auth refresh events (from Google login)
    const handleManualRefresh = () => {
      console.log("🔄 Manual auth refresh triggered");
      if (auth.currentUser) {
        handleAuthStateChange(auth.currentUser);
      }
    };

    window.addEventListener("authStateChanged", handleManualRefresh);

    // Cleanup function
    return () => {
      console.log("🔄 AuthProvider cleanup - Removing listeners");
      cleanupCalled = true;
      isMounted = false;

      authUnsub();
      window.removeEventListener("authStateChanged", handleManualRefresh);

      if (providerUnsub) {
        providerUnsub();
      }
    };
  }, [forceRefresh]); // Add forceRefresh as dependency

  /* ---------- Login ---------- */
  const login = async (
    email: string,
    password: string,
    role: "provider" | "seeker"
  ) => {
    try {
      console.log("Login attempt for:", email, "role:", role);
      const result = await loginWithRole(email, password, role);

      if (result.success) {
        localStorage.setItem("userRole", role);
        console.log("Role stored during login:", role);

        // Force AuthContext refresh
        setForceRefresh((prev) => prev + 1);
      }

      return result;
    } catch (err: any) {
      console.error("Login error:", err);
      return { success: false, error: err.message };
    }
  };

  /* ---------- NEW: Manual User Setter ---------- */
  const manualSetUser = (userData: Partial<AuthUser>) => {
    if (user) {
      setUser({ ...user, ...userData });
    } else if (auth.currentUser) {
      const newUser: AuthUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        role: userData.role || null,
        ...userData,
      };
      setUser(newUser);
    }
  };

  /* ---------- Logout ---------- */
  const signOut = async () => {
    console.log("Signing out - clearing localStorage");
    localStorage.removeItem("userRole");
    await firebaseSignOut(auth);
    console.log("Sign out complete");
  };

  /* ---------- Refresh User ---------- */
  const refreshUser = async () => {
    if (auth.currentUser) {
      console.log("Refreshing user data");
      const updated = await fetchFullUserData(auth.currentUser);
      setUser(updated);
      setUserData(updated.seekerData || updated.providerData || null);
    }
  };

  /* ---------- Context Value ---------- */
  const contextValue: AuthContextType = {
    user,
    userData,
    loading,
    initialized,
    login,
    signOut,
    refreshUser,
    manualSetUser, // ✅ NEW
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
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
