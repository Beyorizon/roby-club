import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "./firebase";
import { auth } from "./firebase";
import { getApp } from "firebase/app";

const COL = "lessons";

export async function listLessons() {
  const app = getApp();
  console.log("[listLessons] START");
  console.log("[listLessons] projectId", app.options.projectId);
  console.log("[listLessons] user", auth.currentUser?.uid);

  // Use a query to order results
  // Note: If you see "The query requires an index" in console, follow the link provided by Firebase.
  const q = query(collection(db, COL), orderBy("orarioInizio", "asc"));

  const snap = await getDocs(q);

  console.log("[listLessons] raw count", snap.size);

  const lessons = snap.docs.map((d) => {
    const data = d.data();
    
    // Normalize day
    // "lunedì" -> "lunedi", handle case and spaces
    let dayKey = (data.giorno || "").toLowerCase().trim();
    // Remove accents
    dayKey = dayKey.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Map to label
    const labels = {
      lunedi: "Lunedì",
      martedi: "Martedì",
      mercoledi: "Mercoledì",
      giovedi: "Giovedì",
      venerdi: "Venerdì",
      sabato: "Sabato",
      domenica: "Domenica"
    };
    const dayLabel = labels[dayKey] || (data.giorno || "N/A");

    // Course Name Fallback
    const courseName = data.nomeCorso || data.corso || data.nome || "";

    // Time Fallback
    let startTime = data.orarioInizio || "";
    let endTime = data.orarioFine || "";
    
    if (!startTime && data.orario) {
      // Try to parse "HH:MM / HH:MM" or "HH:MM-HH:MM"
      const parts = data.orario.split(/[\/\-]/);
      if (parts.length > 0) startTime = parts[0].trim();
      if (parts.length > 1) endTime = parts[1].trim();
    }

    return {
      id: d.id,
      dayKey,
      dayLabel,
      courseName,
      startTime,
      endTime
    };
  });

  console.log("[listLessons] normalized", lessons);

  return lessons;
}
