import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

const COLLECTION_NAME = 'payments';

export const listPayments = async (filters = {}) => {
  // Firestore filtering is limited. We can filter by one range and equalities.
  // For complex filtering like in Riepilogo, it might be easier to fetch by year (which is indexed)
  // and filter the rest in memory.
  
  let constraints = [];
  
  if (filters.anno) {
    constraints.push(where('anno', '==', filters.anno));
  }
  
  if (filters.mese) {
    constraints.push(where('mese', '==', filters.mese));
  }
  
  if (filters.corso_id) {
    constraints.push(where('corso_id', '==', parseInt(filters.corso_id))); // Assuming corso_id is number
  }

  if (filters.allievo_id) {
     constraints.push(where('allievo_id', '==', filters.allievo_id));
  }

  const q = query(collection(db, COLLECTION_NAME), ...constraints);
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const listPaymentsForUser = async (userId) => {
  const q = query(collection(db, COLLECTION_NAME), where('allievo_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const createPayment = async (data) => {
  const { addDoc, serverTimestamp } = await import('firebase/firestore');
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    created_at: serverTimestamp()
  });
  return { id: docRef.id, ...data };
};

export const recordPayment = async (data) => {
  // Alias for createPayment to match usage
  return createPayment(data);
};

export const updatePayment = async (id, patch) => {
  const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...patch,
    updated_at: serverTimestamp()
  });
};

export const upsertMonthlyPayment = async (data) => {
  // Logic specifically for monthly payments which need to be unique by allievo_id, mese, anno
  const { allievo_id, mese, anno } = data;
  
  // Try to find existing payment
  const q = query(
    collection(db, COLLECTION_NAME), 
    where('allievo_id', '==', allievo_id),
    where('mese', '==', mese),
    where('anno', '==', anno),
    where('categoria', '==', 'mensile')
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    // Update existing
    const docId = querySnapshot.docs[0].id;
    const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
    await updateDoc(doc(db, COLLECTION_NAME, docId), {
      ...data,
      updated_at: serverTimestamp()
    });
    return { id: docId, ...data };
  } else {
    // Create new
    const { addDoc, serverTimestamp } = await import('firebase/firestore');
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      created_at: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }
};

