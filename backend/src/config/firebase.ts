import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import fs from 'fs';

// Check if FIREBASE_SERVICE_ACCOUNT is provided via env (for Render production)
let serviceAccount: any;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT env var');
  }
} else {
  // Fallback to local file
  const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = require(serviceAccountPath);
  }
}

let app;
// Initialize Firebase Admin (check to ensure it's not initialized multiple times)
if (!getApps().length && serviceAccount) {
  app = initializeApp({
    credential: cert(serviceAccount),
    storageBucket: 'eventhub-4f9fc.firebasestorage.app'
  });
} else if (!serviceAccount) {
  console.warn("Firebase service account is missing. Firebase Admin SDK not initialized.");
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
