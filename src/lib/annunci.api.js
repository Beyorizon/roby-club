import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from 'firebase/firestore';

const COLLECTION_NAME = 'announcements';

export const listAnnunci = async (onlyPublished = false) => {
  console.log(`[announcements] fetching from collection '${COLLECTION_NAME}'... onlyPublished=${onlyPublished}`);
  let querySnapshot;
  
  try {
    // Primary query: try createdAt (new standard)
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    querySnapshot = await getDocs(q);
  } catch (err) {
    console.warn("[announcements] orderBy 'createdAt' failed, trying fallback to 'created_at'", err);
    try {
      // Fallback query: try created_at (legacy standard)
      const qFallback = query(collection(db, COLLECTION_NAME), orderBy('created_at', 'desc'));
      querySnapshot = await getDocs(qFallback);
    } catch (err2) {
      console.warn("[announcements] orderBy 'created_at' failed too, fetching without sort", err2);
      // Last resort: no sort
      const qFinal = query(collection(db, COLLECTION_NAME));
      querySnapshot = await getDocs(qFinal);
    }
  }

  console.log("[announcements] raw size:", querySnapshot.size);
  if (querySnapshot.size > 0) {
    console.log("[announcements] first doc ID:", querySnapshot.docs[0].id);
    console.log("[announcements] first doc data:", querySnapshot.docs[0].data());
  } else {
    console.log("[announcements] No documents found in collection.");
  }
  
  let docs = querySnapshot.docs.map(doc => {
      const d = doc.data();
      
      // 5) Mapping campi compatibile con dati vecchi
      const title = d.title ?? d.titolo ?? d.nome ?? "";
      const body = d.body ?? d.contenuto ?? d.text ?? "";
      const subtitle = d.subtitle ?? d.sottotitolo ?? "";
      
      // Date normalization
      let dateObj = null;
      // Try Timestamp objects first
      if (d.createdAt?.toDate) dateObj = d.createdAt.toDate();
      else if (d.created_at?.toDate) dateObj = d.created_at.toDate();
      // Try strings
      else if (typeof d.createdAt === 'string') dateObj = new Date(d.createdAt);
      else if (typeof d.created_at === 'string') dateObj = new Date(d.created_at);
      // Legacy 'data' field
      else if (d.data) dateObj = new Date(d.data);

      // 4) Fix del filtro pubblicazione
      // Default true unless explicitly false or hidden
      const isPublished = d.published !== false && d.isPublished !== false && d.visibility !== "hidden" && d.attivo !== false;
      
      return {
        id: doc.id,
        ...d,
        title,
        body,
        subtitle,
        published: isPublished,
        created_at: dateObj ? dateObj.toISOString() : null
      };
  });

  if (onlyPublished) {
    const totalBefore = docs.length;
    docs = docs.filter(d => d.published);
    console.log(`[announcements] Filtered published: ${docs.length}/${totalBefore}`);
  }
  
  return docs;
};

export const createAnnuncio = async (data) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    created_at: serverTimestamp() // Use serverTimestamp for new items
  });
  const newDoc = await getDoc(docRef);
  return { 
    id: docRef.id, 
    ...newDoc.data(),
    created_at: newDoc.data().created_at?.toDate ? newDoc.data().created_at.toDate().toISOString() : new Date().toISOString()
  };
};

export const updateAnnuncio = async (id, patch) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, patch);
};

export const deleteAnnuncio = async (id) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
