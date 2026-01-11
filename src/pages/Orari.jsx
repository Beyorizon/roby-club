import { useState, useEffect } from 'react';
import { listLessons } from "../lib/lessons.api.js";

// STEP 5: Orari.jsx deve: NON usare useAuth se non serve.
// Rimuovo useAuth per rendere la pagina indipendente dallo stato di auth locale.

export default function Orari() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLezioni = async () => {
      try {
        const data = await listLessons();
        setLezioni(data || []);
      } catch (err) {
        console.error("[Firestore Error]", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchLezioni();
  }, []); 

  // Chiavi normalizzate per i 5 giorni richiesti
  const dayKeys = ["lunedi", "martedi", "mercoledi", "giovedi", "venerdi"];
  
  // Mappa label di fallback se non ci sono lezioni
  const defaultLabels = {
    lunedi: "Lunedì",
    martedi: "Martedì",
    mercoledi: "Mercoledì",
    giovedi: "Giovedì",
    venerdi: "Venerdì"
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    // Se è già formato HH:MM lo teniamo, altrimenti lo mostriamo raw
    return timeString.includes(":") ? timeString.slice(0, 5) : timeString;
  };

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-6 text-white">Orario delle lezioni</h2>

      {loading ? (
        <p className="text-white">Caricamento...</p>
      ) : lezioni.length === 0 ? (
        <p className="text-white">Nessun orario disponibile.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {dayKeys.map((key) => {
            // Filtra per chiave normalizzata
            const lezioniDelGiorno = lezioni
              .filter(l => l.dayKey === key)
              .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
            
            // Usa la label dalla prima lezione trovata, o fallback
            const label = lezioniDelGiorno.length > 0 
              ? lezioniDelGiorno[0].dayLabel 
              : defaultLabels[key];

            return (
              <div
                key={key}
                className="bg-white/10 p-4 rounded-lg shadow-md text-center"
              >
                <h3 className="text-lg font-bold text-indigo-200 mb-4">
                  {label}
                </h3>

                {lezioniDelGiorno.length > 0 ? (
                  lezioniDelGiorno.map((lezione) => (
                    <div
                      key={lezione.id}
                      className="mb-3 p-3 bg-indigo-600 rounded-lg text-white"
                    >
                      <h4 className="font-semibold">
                        {lezione.courseName || "Corso"}
                      </h4>
                      <p className="text-sm">
                        {formatTime(lezione.startTime)}
                        {lezione.endTime ? ` - ${formatTime(lezione.endTime)}` : ""}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-300">Nessuna lezione</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
