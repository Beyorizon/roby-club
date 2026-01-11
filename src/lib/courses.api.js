import { db } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';

const COLLECTION_NAME = 'courses';
const ENROLLMENTS_COLLECTION = 'enrollments';

export const listCourses = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getCourse = async (id) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

export const createCourse = async (data) => {
  const docRef = await addDoc(collection(db, COLLECTION_NAME), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const updateCourse = async (id, patch) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, {
    ...patch,
    updatedAt: serverTimestamp()
  });
};

export const removeCourse = async (id) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const getUserEnrollments = async (userId) => {
  const q = query(collection(db, ENROLLMENTS_COLLECTION), where('auth_id', '==', userId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().corso_id);
};

export const enrollUser = async (userId, courseId) => {
  await addDoc(collection(db, ENROLLMENTS_COLLECTION), {
    auth_id: userId,
    corso_id: courseId,
    created_at: serverTimestamp()
  });
};

export const unenrollUser = async (userId, courseId) => {
  const q = query(
    collection(db, ENROLLMENTS_COLLECTION), 
    where('auth_id', '==', userId),
    where('corso_id', '==', courseId)
  );
  const querySnapshot = await getDocs(q);
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

