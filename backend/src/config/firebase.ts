import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

// Check if FIREBASE_SERVICE_ACCOUNT is provided via env (for Render production)
let serviceAccount;
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

// Initialize Firebase Admin (check to ensure it's not initialized multiple times)
if (!admin.apps.length && serviceAccount) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'eventhub-4f9fc.firebasestorage.app'
  });
} else if (!serviceAccount) {
  console.warn("Firebase service account is missing. Firebase Admin SDK not initialized.");
}


const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };
