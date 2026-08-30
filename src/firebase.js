import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

// Firebase Configuration from Environment Variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
    firebaseConfig.projectId
  );
};

// Initialize Firebase App Singleton
let app = null;
let auth = null;

export const getFirebaseAuth = () => {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  }
  return auth;
};

// Setup Invisible Google reCAPTCHA
export const setupRecaptcha = (containerId = "recaptcha-container") => {
  const authInstance = getFirebaseAuth();
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(authInstance, containerId, {
      size: "invisible",
      callback: (response) => {
        // reCAPTCHA solved
      },
      "expired-callback": () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      }
    });
  }
  return window.recaptchaVerifier;
};

// Send Real SMS OTP via Firebase Phone Auth
export const sendFirebaseOtp = async (mobileNumber, containerId = "recaptcha-container") => {
  if (!isFirebaseConfigured()) {
    // If Firebase is not yet configured, return simulated confirmation result
    return {
      isSimulation: true,
      confirm: async (code) => {
        if (code === "123456" || code.length === 6) {
          return { user: { phoneNumber: "+91" + mobileNumber, uid: "demo-user-" + mobileNumber } };
        }
        throw new Error("Invalid OTP code. For demo mode, enter 123456.");
      }
    };
  }

  const authInstance = getFirebaseAuth();
  const appVerifier = setupRecaptcha(containerId);
  const formattedPhone = mobileNumber.startsWith("+") ? mobileNumber : `+91${mobileNumber.replace(/\\D/g, "")}`;
  
  const confirmationResult = await signInWithPhoneNumber(authInstance, formattedPhone, appVerifier);
  return confirmationResult;
};
