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

  // Check seekers (users collection)
  const seekerQuery = query(
    collection(db, "users"),
    where("email", "==", emailLower)
  );
  const seekerSnap = await getDocs(seekerQuery);
  if (!seekerSnap.empty) return "seeker";

  // Check providers
  const providerQuery = query(
    collection(db, "providers"),
    where("email", "==", emailLower)
  );
  const providerSnap = await getDocs(providerQuery);
  if (!providerSnap.empty) return "provider";

  return "none";
};

/* ======================================================
   🧑‍🔧 REGISTER PROVIDER (EMAIL + PASSWORD ONLY)
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

    await setDoc(doc(db, "providers", user.uid), {
      uid: user.uid,
      email: emailLower,
      role: "provider",
      ...providerData,
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
   🧑‍💼 REGISTER SEEKER (EMAIL + PASSWORD)
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
   🔐 LOGIN WITH ROLE VALIDATION
====================================================== */
export const loginWithRole = async (email, password, expectedRole) => {
  try {
    const emailLower = email.toLowerCase();
    console.log(`🔐 ${expectedRole} login attempt:`, emailLower);

    // Firebase Auth login
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailLower,
      password
    );
    const user = userCredential.user;

    // Check role-specific collection
    const collectionName = expectedRole === "provider" ? "providers" : "users";
    const userDoc = await getDoc(doc(db, collectionName, user.uid));

    if (!userDoc.exists()) {
      await signOut(auth);
      throw new Error(
        `This email is not registered as a ${expectedRole}. Please login with the correct role.`
      );
    }

    return { success: true, user: userDoc.data() };
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

    const collectionName = role === "provider" ? "providers" : "users";
    const userDoc = await getDoc(doc(db, collectionName, user.uid));

    if (!userDoc.exists()) return null;

    return {
      uid: user.uid,
      email: user.email,
      role,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return null;
  }
};

/* ======================================================
   🔁 EXPORT ROLE CHECKER
====================================================== */
export { getActualRole };
