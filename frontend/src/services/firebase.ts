/**
 * ONCOGENIX AI - Firebase Client Integration
 * Configured with official project credentials.
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAF3MjhSvTWjjebhVY-j_DRFaEDEAloS0w",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "oncogenix-ai-aab38.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "oncogenix-ai-aab38",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "oncogenix-ai-aab38.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "178152879328",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:178152879328:web:fb2462f4faecedac160c85",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-HX44QV6635"
};

// Initialize Firebase safely
export const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseStorage = getStorage(firebaseApp);

export default firebaseApp;
