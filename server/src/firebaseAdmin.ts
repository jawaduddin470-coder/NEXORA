import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root and server
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let app: admin.app.App | null = null;
let isConfigured = false;

if (projectId && clientEmail && privateKey) {
  try {
    if (!admin.apps.length) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`,
      });
    } else {
      app = admin.apps[0]!;
    }
    isConfigured = true;
    console.log('✅ Firebase Admin SDK successfully initialized.');
  } catch (err: any) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
  }
} else {
  console.warn(
    '⚠️ Firebase Admin credentials incomplete in environment. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env'
  );
}

export const adminAuth = isConfigured ? admin.auth() : null;
export const adminDb = isConfigured ? admin.firestore() : null;
export const adminStorage = isConfigured ? admin.storage() : null;
export { isConfigured };
