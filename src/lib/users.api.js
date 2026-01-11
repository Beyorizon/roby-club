import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'users';

export const listUsers = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    auth_id: doc.id, // In Firestore user ID is usually the auth ID
    ...doc.data()
  }));
};

export const getUser = async (id) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, auth_id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

export const updateUser = async (id, patch) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...patch,
    updatedAt: serverTimestamp()
  });
};

// Used for creating children or manual users, NOT for Auth users which use upsertUserProfile
export const createUser = async (data) => {
  const { addDoc } = await import('firebase/firestore');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp()
  });
  return { id: docRef.id, ...data };
};

export const upsertUserProfile = async (uid, data) => {
  const docRef = doc(db, COLLECTION_NAME, uid);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

/**
 * Recupera TUTTI gli utenti per il pannello admin.
 * Legge SOLO da 'users' e normalizza i dati.
 */
export const getAllUsersForAdmin = async () => {
  if (import.meta.env.DEV) console.log('[users] Fetching all users...');
  
  try {
    const usersSnap = await getDocs(collection(db, COLLECTION_NAME));
    
    const allUsers = usersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        auth_id: doc.id,
        ...data,
        nome: data.nome ?? data.firstName ?? "",
        cognome: data.cognome ?? data.lastName ?? "",
        email: data.email ?? "",
        ruolo: (data.role ?? data.ruolo ?? "allievo").toLowerCase(),
        telefono: data.telefono ?? "",
        indirizzo: data.indirizzo ?? "",
        source: 'users'
      };
    });

    if (import.meta.env.DEV) console.log(`[users] Fetched: ${allUsers.length} users`);

    // Sort by Cognome + Nome
    return allUsers.sort((a, b) => {
      const cA = (a.cognome || '').toLowerCase();
      const cB = (b.cognome || '').toLowerCase();
      if (cA !== cB) return cA.localeCompare(cB);
      return (a.nome || '').toLowerCase().localeCompare((b.nome || '').toLowerCase());
    });

  } catch (err) {
    console.error('[getAllUsersForAdmin] Error:', err);
    return []; // Graceful degradation
  }
};

export const getUserForAdminById = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const d = docSnap.data();
      return {
        id: docSnap.id,
        auth_id: docSnap.id,
        source: 'users',
        ...d,
        nome: d.nome ?? d.firstName ?? "",
        cognome: d.cognome ?? d.lastName ?? "",
        email: d.email ?? "",
        ruolo: (d.role ?? d.ruolo ?? "allievo").toLowerCase(),
        telefono: d.telefono ?? "",
        indirizzo: d.indirizzo ?? ""
      };
    }

    return null;
  } catch (err) {
    console.error('[getUserForAdminById] Error:', err);
    return null;
  }
};

export const listChildren = async (parentId) => {
  const q = query(collection(db, COLLECTION_NAME), where('genitore_id', '==', parentId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    auth_id: doc.id,
    ...doc.data()
  }));
};
