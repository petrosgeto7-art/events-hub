import admin from 'firebase-admin';
import path from 'path';

// Path to your service account key file
const serviceAccountPath = path.resolve(__dirname, '../../firebase-service-account.json');

// Initialize Firebase Admin (check to ensure it's not initialized multiple times)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
    storageBucket: 'eventhub-4f9fc.firebasestorage.app'
  });
}

const db = admin.firestore();
const auth = admin.auth();
const storage = admin.storage();

export { admin, db, auth, storage };
