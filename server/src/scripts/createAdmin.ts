import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase Admin SDK credentials in .env file.');
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment variables.');
  console.error('Usage: ADMIN_EMAIL=admin@nexora.com ADMIN_PASSWORD=Password123 npm run admin:create');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const auth = admin.auth();
const db = admin.firestore();

async function runAdminSetup() {
  console.log(`⏳ Provisioning Admin User for ${adminEmail}...`);
  let uid: string;

  try {
    const existingUser = await auth.getUserByEmail(adminEmail!);
    uid = existingUser.uid;
    await auth.updateUser(uid, {
      password: adminPassword,
      displayName: 'System Admin',
    });
    console.log(`ℹ️ Existing Auth user found (${uid}). Password updated.`);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      const newUser = await auth.createUser({
        email: adminEmail,
        password: adminPassword,
        displayName: 'System Admin',
        emailVerified: true,
      });
      uid = newUser.uid;
      console.log(`✅ New Auth user created (${uid}).`);
    } else {
      throw error;
    }
  }

  // Set custom user claims for admin token verification
  await auth.setCustomUserClaims(uid, { role: 'admin', admin: true });

  // Set Firestore user profile with IMMUTABLE role == 'admin'
  await db.collection('users').doc(uid).set(
    {
      userId: uid,
      name: 'System Admin',
      email: adminEmail,
      role: 'admin',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    { merge: true }
  );

  console.log('🎉 ADMIN PROVISIONING COMPLETE!');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   UID: ${uid}`);
  console.log('   Role: admin (Enforced in Auth Custom Claims, Firestore & Security Rules)');
  process.exit(0);
}

runAdminSetup().catch((err) => {
  console.error('❌ Admin setup failed:', err);
  process.exit(1);
});
