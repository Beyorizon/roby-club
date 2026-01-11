import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function sendLog(context, message, data = {}) {
  try {
    // Clean data to remove undefined values
    const cleanData = JSON.parse(JSON.stringify(data));
    
    const logEntry = {
      context,
      message,
      data: cleanData,
      created_at: serverTimestamp()
    };

    if (auth.currentUser) {
        logEntry.userId = auth.currentUser.uid;
        logEntry.userEmail = auth.currentUser.email;
    }

    await addDoc(collection(db, "logs"), logEntry);
  } catch (error) {
    // Ignore permission errors or other failures to avoid breaking the app flow
    console.warn("[Logger] Errore inserimento log (IGNORATO):", error);
  }
}