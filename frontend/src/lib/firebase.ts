import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDr7qINdl3EyzCqkeTMZhqZqgoIehUW13k",
  authDomain: "eventhub-4f9fc.firebaseapp.com",
  projectId: "eventhub-4f9fc",
  storageBucket: "eventhub-4f9fc.firebasestorage.app",
  messagingSenderId: "216277227839",
  appId: "1:216277227839:web:4bf09eccda6d9062af9b8a",
  measurementId: "G-74Z31MQNJG"
};

// Initialize Firebase (check if already initialized to prevent Next.js hot-reload issues)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize analytics only on the client side
let analytics;
if (typeof window !== "undefined") {
  analytics = getAnalytics(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { app, analytics, db };
