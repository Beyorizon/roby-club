import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function Orari() {
  const [lezioni, setLezioni] = useState([]);
  const [loading, setLoading] = useState(true);
  

    useEffect(() => {
  const fetchLezioni = async () => {
    try {
      const { data, error } = await supabase
        .from("lezioni")
        .select("id, giorno, orario_inizio, orario_fine, nome_corso");

      if (error) {
        console.error("[Supabase Error]", error);
      } else {
        console.log("[Supabase Data]", data);
        setLezioni(data || []);
      }
    } catch (err) {
      console.error("[Fetch Exception]", err);
    }finally {
    setLoading(false);  // <--- qui sblocchi l'interfaccia
  }
  };

  fetchLezioni();
}, []);


    const giorniSettimana = [
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
  ];
  const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.slice(0, 5); // prende solo HH:MM
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
          {giorniSettimana.map((giorno) => {
            
            const lezioniDelGiorno = lezioni.filter(
              (lezione) =>
                lezione.giorno &&
                lezione.giorno.toLowerCase() === giorno.toLowerCase()
                
            );
            return (
              <div
                key={giorno}
                className="bg-white/10 p-4 rounded-lg shadow-md text-center"
              >
                <h3 className="text-lg font-bold text-indigo-200 mb-4">
                  {giorno}
                </h3>

                {lezioniDelGiorno.length > 0 ? (
                  lezioniDelGiorno.map((lezione) => (
                    <div
                      key={lezione.id}
                      className="mb-3 p-3 bg-indigo-600 rounded-lg text-white"
                    >
                      <h4 className="font-semibold">
                        {lezione.nome_corso || "Corso"}
                      </h4>
                      <p className="text-sm">
                        {formatTime(lezione.orario_inizio)} - {formatTime(lezione.orario_fine)}
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
