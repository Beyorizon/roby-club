import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

function Orari() {
  const [corsi, setCorsi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCorsi = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("corsi")
          .select("*")
          .order("orario", { ascending: true });

        if (error) {
          throw error;
        }

        setCorsi(data || []);
      } catch (err) {
        console.error('Errore nel caricamento degli orari:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCorsi();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin border-2 border-t-transparent border-indigo-400 w-8 h-8 rounded-full mx-auto mb-4"></div>
          <p className="text-white">Caricamento orari...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">Errore nel caricamento degli orari</p>
          <p className="text-red-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Titolo */}
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Orari dei corsi
        </h1>

        {/* Grid dei corsi */}
        {corsi.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {corsi.map((corso) => (
              <div
                key={corso.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300"
              >
                {/* Nome del corso */}
                <h3 className="text-lg font-bold text-white mb-2">
                  {corso.nome}
                </h3>
                
                {/* Giorni */}
                {corso.giorno && (
                  <p className="text-sm text-indigo-200 mb-1">
                    <span className="font-medium">Giorno:</span> {corso.giorno}
                  </p>
                )}
                
                {/* Orario */}
                {corso.orario && (
                  <p className="text-sm text-gray-300">
                    <span className="font-medium">Orario:</span> {corso.orario}
                  </p>
                )}
                
                {/* Informazioni aggiuntive se presenti */}
                {corso.descrizione && (
                  <p className="text-sm text-white/70 mt-2">
                    {corso.descrizione}
                  </p>
                )}
                
                {corso.istruttore && (
                  <p className="text-sm text-indigo-300 mt-1">
                    <span className="font-medium">Istruttore:</span> {corso.istruttore}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-white/70 py-8">
            <p>Nessun corso disponibile al momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Orari;