import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

if (import.meta.env.DEV) {
  console.log("[Firebase] projectId:", firebaseConfig.projectId);
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
window.__auth = auth;
export const db = getFirestore(app);

// Configura persistenza
setPersistence(auth, browserLocalPersistence)
  .catch((error) => {
    console.warn("Firebase persistence error ignored:", error);
  });

// Global debug helper
onAuthStateChanged(auth, (u) => { 
  if (import.meta.env.DEV) {
    window.__uid = u?.uid ?? null; 
    window.__email = u?.email ?? null; 
    console.log("[AUTH] state:", { uid: window.__uid, email: window.__email }); 
  }
});
