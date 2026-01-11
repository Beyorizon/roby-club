import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { serverTimestamp } from "firebase/firestore";
import { auth } from "../lib/firebase";
import { sendLog } from "../lib/logger";
import { getUser, upsertUserProfile } from "../lib/users.api";

/**
 * Struttura "users/{uid}" consigliata:
 * {
 *   email: string,
 *   role: "admin" | "allievo" | "genitore" | "insegnante",
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 */

const AuthContext = createContext({
  user: null, // Firebase user
  loading: true,
  isAdmin: false,
  userProfile: null, // Firestore doc users/{uid}
  signIn: async (email, password) => {},
  signOut: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Se vuoi “bootstrap” admin via email (solo DEV), metti qui le email admin:
const ADMIN_EMAILS = new Set([
  // "tuoadmin@gmail.com",
]);

function roleFromProfile(profile) {
  const role = profile?.role || profile?.ruolo; // Support both naming conventions
  if (!role) return null;
  return String(role).toLowerCase();
}

export async function logout() {
  try {
    if (import.meta.env.DEV) console.log("[logout] start");
    await firebaseSignOut(auth);
    if (import.meta.env.DEV) console.log("[logout] signOut done");

    // hard cleanup per evitare sessioni “fantasma”
    localStorage.removeItem("firebase:authUser:" + auth.app.options.apiKey + ":[DEFAULT]");
    sessionStorage.clear();

    // opzionale: clear indexedDB (firebase persistence)
    if (window.indexedDB?.databases) {
      try {
        const dbs = await window.indexedDB.databases();
        for (const db of dbs) {
          if (db.name && db.name.toLowerCase().includes("firebase")) {
            window.indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (err) {
        console.warn("[logout] indexedDB cleanup error", err);
      }
    }

    // porta sempre al login
    window.location.href = "/login";
  } catch (e) {
    console.error("[logout] error", e);
    // fallback: forziamo comunque la navigazione
    window.location.href = "/login";
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // evita loop in StrictMode
  const [readyOnce, setReadyOnce] = useState(false);

  useEffect(() => {
    let unsub = null;

    (async () => {
      try {
        // Persistenza login in browser (utile per PWA)
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        // non bloccare
        console.warn("[AuthProvider] setPersistence failed:", e);
      }

      unsub = onAuthStateChanged(auth, async (fbUser) => {
        try {
          // Non impostare loading a true qui se vogliamo evitare sfarfallii eccessivi,
          // ma per sicurezza lo facciamo per gestire il cambio stato
          setLoading(true);
          setUser(fbUser);

          if (!fbUser) {
            setUserProfile(null);
            setLoading(false);
            return;
          }

          // Leggo profilo da Firestore
          try {
            // 1. Try to get existing profile
            let profile = await getUser(fbUser.uid);

            // 2. If not found, create default profile
            if (!profile) {
                console.log('[AuthProvider] Profile not found for', fbUser.uid, '- creating default...');
                
                // Default fallback
                const bootstrapRole = ADMIN_EMAILS.has(fbUser.email?.toLowerCase())
                   ? "admin"
                   : "allievo"; // Default to allievo, user can be updated by admin later
                
                console.log('[AuthProvider] Creating new default profile:', bootstrapRole);
                
                const newProfile = {
                   email: fbUser.email || null,
                   role: bootstrapRole,
                   createdAt: serverTimestamp(),
                   updatedAt: serverTimestamp(),
                };
                
                await upsertUserProfile(fbUser.uid, newProfile);
                profile = { 
                    id: fbUser.uid, 
                    ...newProfile,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
            }
            
            setUserProfile(profile);
            
          } catch (err) {
            console.error("[AuthProvider] Error processing user profile:", err);
          }
        } finally {
          setLoading(false);
        }
      });
    })();

    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Calcola isAdmin in base al ruolo
  const isAdmin = useMemo(() => {
      const r = roleFromProfile(userProfile);
      return r === "admin";
  }, [userProfile]);

  const value = {
    user,
    userProfile,
    isAdmin,
    loading,
    signIn: signInWithEmailAndPassword,
    signOut: firebaseSignOut,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
