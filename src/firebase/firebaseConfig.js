// ⚠️  REPLACE these placeholder values with your actual Firebase project config.
// Go to: Firebase Console → Project Settings → Your Apps → SDK setup and configuration

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9YiRUjz5ybDVuCmZsAtBMDHfULc4orWA",
  authDomain: "fuel-flux-5c912.firebaseapp.com",
  projectId: "fuel-flux-5c912",
  storageBucket: "fuel-flux-5c912.firebasestorage.app",
  messagingSenderId: "260699805203",
  appId: "1:260699805203:web:d4e7bf408b08b3a1efd1e6",
  measurementId: "G-ESLV8SV0J0"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
