import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, Functions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

// Firebase configuration
// These values are safe to expose in client-side code
// Make sure you have a .env.local file with the proper values
// See .env.local.example for the template
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app: FirebaseApp = initializeApp(firebaseConfig);

// Initialize Firestore
export const db: Firestore = getFirestore(app);

// Initialize Functions with explicit region
export const functions: Functions = getFunctions(app, 'us-central1');

// Initialize Auth
export const auth: Auth = getAuth(app);

// Connect to emulators if in development mode
// This allows the app to work without real Firebase credentials
if (import.meta.env.DEV) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('✅ Connected to Firebase Emulators');
    console.log('  - Auth: http://localhost:9099');
    console.log('  - Firestore: localhost:8080');
    console.log('  - Functions: localhost:5001');
    console.log('  - Functions instance:', functions);
  } catch (error) {
    console.error('⚠️ Failed to connect to Firebase Emulators:', error);
  }
}
