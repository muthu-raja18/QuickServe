// src/app/firebase/authWithRole.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "./config";

/* ======================================================
   🔎 CHECK ACTUAL ROLE OF EMAIL (SEEKER / PROVIDER / NONE)
====================================================== */
const getActualRole = async (email) => {
  const emailLower = email.toLowerCase();

  // Check seekers (users collection with role='seeker')
  const seekerQuery = query(
    collection(db, "users"),
    where("email", "==", emailLower),
    where("role", "==", "seeker")
  );
  const seekerSnap = await getDocs(seekerQuery);
  if (!seekerSnap.empty) return "seeker";

  // Check providers (providers collection OR users collection with role='provider')
  const providerQuery1 = query(
    collection(db, "providers"),
    where("email", "==", emailLower)
  );
  const providerSnap1 = await getDocs(providerQuery1);
  if (!providerSnap1.empty) return "provider";

  // Also check users collection with role='provider'
  const providerQuery2 = query(
    collection(db, "users"),
    where("email", "==", emailLower),
    where("role", "==", "provider")
  );
  const providerSnap2 = await getDocs(providerQuery2);
  if (!providerSnap2.empty) return "provider";

  return "none";
};

/* ======================================================
   🧑‍🔧 REGISTER PROVIDER (WITH PROPER ROLE SEPARATION)
====================================================== */
export const registerProvider = async (email, password, providerData) => {
  try {
    const emailLower = email.toLowerCase();
    const existingRole = await getActualRole(emailLower);

    if (existingRole === "seeker") {
      throw new Error(
        "This email is already registered as a service seeker. Please use a different email."
      );
    }

    if (existingRole === "provider") {
      throw new Error(
        "This email is already registered as a provider. Please login instead."
      );
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailLower,
      password
    );
    const user = userCredential.user;

    // Create provider document in providers collection
    await setDoc(doc(db, "providers", user.uid), {
      uid: user.uid,
      email: emailLower,
      role: "provider",
      ...providerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // ALSO create a user document with role='provider' for auth consistency
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: emailLower,
      role: "provider",
      name: providerData.name || "",
      phone: providerData.phone || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, user };
  } catch (error) {
    console.error("Provider registration error:", error);
    return { success: false, error: error.message };
  }
};

/* ======================================================
   🧑‍💼 REGISTER SEEKER (ONLY IN USERS COLLECTION)
====================================================== */
export const registerSeeker = async (email, password, seekerData) => {
  try {
    const emailLower = email.toLowerCase();
    const existingRole = await getActualRole(emailLower);

    if (existingRole === "provider") {
      throw new Error(
        "This email is already registered as a service provider. Please use a different email."
      );
    }

    if (existingRole === "seeker") {
      throw new Error(
        "This email is already registered as a seeker. Please login instead."
      );
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailLower,
      password
    );
    const user = userCredential.user;

    // Create seeker document ONLY in users collection
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: emailLower,
      role: "seeker",
      ...seekerData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return { success: true, user };
  } catch (error) {
    console.error("Seeker registration error:", error);
    return { success: false, error: error.message };
  }
};

/* ======================================================
   🔐 LOGIN WITH STRICT ROLE VALIDATION (FIXED)
====================================================== */
export const loginWithRole = async (email, password, expectedRole) => {
  try {
    const emailLower = email.toLowerCase();
    console.log(`🔐 ${expectedRole} login attempt:`, emailLower);

    // First check if email exists with expected role BEFORE auth
    const actualRole = await getActualRole(emailLower);

    if (actualRole === "none") {
      return {
        success: false,
        error: "No account found with this email. Please sign up first.",
      };
    }

    if (actualRole !== expectedRole) {
      return {
        success: false,
        error: `This email is registered as a ${actualRole}, not as a ${expectedRole}. Please login with the correct role.`,
      };
    }

    // Firebase Auth login
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailLower,
      password
    );
    const user = userCredential.user;

    // For providers, check both collections
    if (expectedRole === "provider") {
      // First check providers collection
      const providerDoc = await getDoc(doc(db, "providers", user.uid));

      if (!providerDoc.exists()) {
        // Fallback: check users collection with role='provider'
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists() || userDoc.data().role !== "provider") {
          await signOut(auth);
          return {
            success: false,
            error: "Provider profile not found. Please sign up as a provider.",
          };
        }

        return {
          success: true,
          user: { ...userDoc.data(), uid: user.uid, email: user.email },
        };
      }

      return {
        success: true,
        user: { ...providerDoc.data(), uid: user.uid, email: user.email },
      };
    }
    // For seekers, only check users collection with role='seeker'
    else if (expectedRole === "seeker") {
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists() || userDoc.data().role !== "seeker") {
        await signOut(auth);
        return {
          success: false,
          error: "Seeker profile not found. Please sign up as a seeker.",
        };
      }

      return {
        success: true,
        user: { ...userDoc.data(), uid: user.uid, email: user.email },
      };
    }

    return { success: false, error: "Invalid role specified." };
  } catch (error) {
    console.error("Login error:", error);

    if (error.code === "auth/user-not-found") {
      return {
        success: false,
        error: "No account found with this email.",
      };
    }
    if (error.code === "auth/wrong-password") {
      return {
        success: false,
        error: "Incorrect password. Please try again.",
      };
    }
    if (error.code === "auth/invalid-email") {
      return {
        success: false,
        error: "Invalid email address.",
      };
    }
    if (error.code === "auth/invalid-credential") {
      return {
        success: false,
        error: "Invalid email or password.",
      };
    }

    return { success: false, error: error.message };
  }
};

/* ======================================================
   👤 GET CURRENT USER WITH ROLE
====================================================== */
export const getCurrentUserWithRole = async () => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) return null;

    const role = await getActualRole(user.email);
    if (role === "none") return null;

    if (role === "provider") {
      // Check providers collection first
      const providerDoc = await getDoc(doc(db, "providers", user.uid));
      if (providerDoc.exists()) {
        return {
          uid: user.uid,
          email: user.email,
          role,
          ...providerDoc.data(),
        };
      }
      // Fallback to users collection
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "provider") {
        return {
          uid: user.uid,
          email: user.email,
          role,
          ...userDoc.data(),
        };
      }
    } else if (role === "seeker") {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().role === "seeker") {
        return {
          uid: user.uid,
          email: user.email,
          role,
          ...userDoc.data(),
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

/* ======================================================
   🔁 EXPORT ROLE CHECKER
====================================================== */
export { getActualRole };
