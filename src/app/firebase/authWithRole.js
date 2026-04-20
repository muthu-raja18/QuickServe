// src/firebase/authWithRole.js
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
   🔎 FIND EMAIL BY USERNAME (or phone)
====================================================== */
export const findEmailByUsername = async (username) => {
  const trimmed = username.trim().toLowerCase();
  const usersRef = collection(db, "users");

  console.log("🔍 Looking for username:", trimmed);

  const q = query(usersRef, where("username", "==", trimmed));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const email = snap.docs[0].data().email;
    console.log("✅ Found email for username:", email);
    return email;
  }

  console.log("❌ No user found with username:", trimmed);
  return null;
};

/* ======================================================
   🔎 FIND EMAIL BY PHONE NUMBER
====================================================== */
export const findEmailByPhone = async (phone) => {
  const trimmed = phone.trim();
  const usersRef = collection(db, "users");

  console.log("🔍 Looking for phone:", trimmed);

  const q = query(usersRef, where("phone", "==", trimmed));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const email = snap.docs[0].data().email;
    console.log("✅ Found email for phone:", email);
    return email;
  }

  console.log("❌ No user found with phone:", trimmed);
  return null;
};

/* ======================================================
   🔎 FIND EMAIL BY ANY IDENTIFIER (email/username/phone)
====================================================== */
export const findEmailByIdentifier = async (identifier) => {
  const trimmed = identifier.trim().toLowerCase();

  // 1. Check if it's an email format
  const isEmailFormat = /^\S+@\S+\.\S+$/.test(trimmed);
  if (isEmailFormat) {
    console.log("📧 Checking as email...");
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", trimmed));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const email = snap.docs[0].data().email;
      console.log("✅ Found email:", email);
      return email;
    }
  }

  // 2. Check as phone number (10 digits)
  const isPhoneFormat = /^\d{10}$/.test(trimmed);
  if (isPhoneFormat) {
    console.log("📱 Checking as phone...");
    const email = await findEmailByPhone(trimmed);
    if (email) return email;
  }

  // 3. Check as username (default)
  console.log("👤 Checking as username...");
  const email = await findEmailByUsername(trimmed);
  if (email) return email;

  console.log("❌ No user found for identifier:", identifier);
  return null;
};

/* ======================================================
   🔎 CHECK ACTUAL ROLE OF EMAIL
====================================================== */
export const getActualRole = async (email) => {
  const emailLower = email.toLowerCase();

  const seekerQuery = query(
    collection(db, "users"),
    where("email", "==", emailLower),
    where("role", "==", "seeker"),
  );
  const seekerSnap = await getDocs(seekerQuery);
  if (!seekerSnap.empty) return "seeker";

  const providerQuery = query(
    collection(db, "providers"),
    where("email", "==", emailLower),
  );
  const providerSnap = await getDocs(providerQuery);
  if (!providerSnap.empty) return "provider";

  return "none";
};

/* ======================================================
   🧑‍💼 REGISTER SEEKER (with username support)
====================================================== */
export const registerSeeker = async (email, password, seekerData) => {
  try {
    const emailLower = email.toLowerCase();
    const existingRole = await getActualRole(emailLower);

    if (existingRole === "provider") {
      throw new Error(
        "This email is already registered as a service provider.",
      );
    }

    if (existingRole === "seeker") {
      throw new Error("This email is already registered as a seeker.");
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailLower,
      password,
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
   🔐 LOGIN WITH ROLE (accepts username, email, or phone)
====================================================== */
export const loginWithRole = async (identifier, password, expectedRole) => {
  try {
    console.log(
      `🔐 Login attempt with: "${identifier}", role: ${expectedRole}`,
    );

    // Resolve identifier to actual email
    const email = await findEmailByIdentifier(identifier);

    if (!email) {
      return {
        success: false,
        error: "No account found. Please sign up first.",
      };
    }

    console.log(`✅ Resolved to email: ${email}`);

    const actualRole = await getActualRole(email);

    if (actualRole === "none") {
      return {
        success: false,
        error: "No account found. Please sign up first.",
      };
    }

    if (actualRole !== expectedRole) {
      return {
        success: false,
        error: `This account is registered as a ${actualRole}, not as a ${expectedRole}.`,
      };
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    if (expectedRole === "seeker") {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists() || userDoc.data().role !== "seeker") {
        await signOut(auth);
        return {
          success: false,
          error: "Seeker profile not found.",
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

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password"
    ) {
      return {
        success: false,
        error: "Invalid username or password.",
      };
    }

    return { success: false, error: error.message };
  }
};

/* ======================================================
   🧑‍🔧 REGISTER PROVIDER
====================================================== */
export const registerProvider = async (email, password, providerData) => {
  try {
    const emailLower = email.toLowerCase();
    const existingRole = await getActualRole(emailLower);

    if (existingRole === "seeker") {
      throw new Error("This email is already registered as a service seeker.");
    }

    if (existingRole === "provider") {
      throw new Error("This email is already registered as a provider.");
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailLower,
      password,
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
