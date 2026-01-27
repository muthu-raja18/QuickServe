// src/firebase/config.ts
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArI-kCQDObOaH0z9TMxwPLNQI0wOonuBI",
  authDomain: "quickserve-d3ba6.firebaseapp.com",
  projectId: "quickserve-d3ba6",
  storageBucket: "quickserve-d3ba6.appspot.com", // ✅ FIXED
  messagingSenderId: "444652076033",
  appId: "1:444652076033:web:903ac88d16e5e7f0065400",
  measurementId: "G-H3V1Q0KLGC",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { app, auth, googleProvider, db };
