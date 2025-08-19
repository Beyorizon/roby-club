import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import NewsFeed from '../components/NewsFeed';
import supabase from '../lib/supabase';

// Array locale per i saggi YouTube (TODO: spostare su Supabase in futuro)
const SAGGI_YOUTUBE = [
  {
    id: 1,
    titolo: "Saggio di Fine Anno 2024",
    url: "https://www.youtube.com/watch?v=J7OaakdqXmk",
    thumbnail: "https://img.youtube.com/vi/J7OaakdqXmk/maxresdefault.jpg"
  },
  {
    id: 2,
    titolo: "Saggio di Fine Anno 2023",
    url: "https://www.youtube.com/watch?v=jTdRIJmdh5o",
    thumbnail: "https://img.youtube.com/vi/jTdRIJmdh5o/maxresdefault.jpg"
  },
  {
    id: 3,
    titolo: "Saggio di Fine Anno 2022",
    url: "https://www.youtube.com/watch?v=DsXZXQHYeyk",
    thumbnail: "https://img.youtube.com/vi/DsXZXQHYeyk/maxresdefault.jpg"
  },
];

// Funzione per il giorno corrente in italiano
const getToday = () => {
  const giorni = [
    "Domenica",
    "Lunedì",
    "Martedì",
    "Mercoledì",
    "Giovedì",
    "Venerdì",
    "Sabato",
  ];
  const oggi = new Date().getDay();
  return giorni[oggi];
};

// Funzione per formattare l'orario (toglie i secondi)
const formatTime = (timeString) => {
  if (!timeString) return "";
  return timeString.slice(0, 5);
};

// Funzione per formattare la data
const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }
  return date.toLocaleDateString('it-IT', options)
}

function Home() {
  const { session } = useAuth();
  const [lezioniOggi, setLezioniOggi] = useState([]);
  const [loadingLezioni, setLoadingLezioni] = useState(true);
  const [ultimeNotizie, setUltimeNotizie] = useState([]);
  const [loadingNotizie, setLoadingNotizie] = useState(true);

  // Carica lezioni del giorno corrente da Supabase
  useEffect(() => {
    const loadLezioniOggi = async () => {
      try {
        const giornoCorrente = getToday();
        const { data, error } = await supabase
          .from('lezioni')
          .select('id, giorno, orario_inizio, orario_fine, nome_corso')
          .eq('giorno', giornoCorrente)
          .order('orario_inizio');

        if (error) {
          console.error('Errore caricamento lezioni:', error);
          return;
        }

        setLezioniOggi(data || []);
      } catch (err) {
        console.error('Errore caricamento lezioni:', err);
      } finally {
        setLoadingLezioni(false);
      }
    };

    loadLezioniOggi();
  }, []);

  // Carica ultime 3 notizie pubblicate da Supabase
  useEffect(() => {
    const loadUltimeNotizie = async () => {
      try {
        const { data, error } = await supabase
          .from('annunci')
          .select('id, titolo, contenuto, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3)
        if (error) throw error
        setUltimeNotizie(data || [])
      } catch (err) {
        console.error('Errore caricamento notizie:', err)
      } finally {
        setLoadingNotizie(false)
      }
    }
    loadUltimeNotizie()
  }, [])

  const [orariCorsi, setOrariCorsi] = useState([]);
  const [loadingOrari, setLoadingOrari] = useState(true);

  // Carica orari corsi da Supabase
  useEffect(() => {
    const loadOrariCorsi = async () => {
      try {
        // TODO: Assumo che la tabella corsi abbia campi nome, giorno, orario
        // Se la struttura è diversa, adattare la query
        const { data, error } = await supabase
          .from('corsi')
          .select('nome, giorno, orario')
          .order('giorno')
          .order('orario');

        if (error) {
          console.error('Errore caricamento orari:', error);
          return;
        }

        setOrariCorsi(data || []);
      } catch (err) {
        console.error('Errore caricamento orari:', err);
      } finally {
        setLoadingOrari(false);
      }
    };

    loadOrariCorsi();
  }, []);

  // Scroll automatico alle sezioni se c'è un hash nell'URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.getElementById(hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Roby Club
          </h1>
          
          {!session && (
            <div className="mt-8">
              <Link
                to="/login"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
              >
                Accedi al tuo account
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-16 pb-24">
        
        {/* Sezione Ultime Novità */}
        <section id="novita" className="scroll-mt-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Ultime novità</h2>
          
          {loadingNotizie ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p className="text-white/70">Caricamento notizie...</p>
            </div>
          ) : ultimeNotizie.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center">
              <p className="text-white/70">Nessuna notizia disponibile al momento.</p>
            </div>
          ) : (
            <>
              {/* Slider delle notizie */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {ultimeNotizie.map((notizia) => (
                  <div 
                    key={notizia.id}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                      {notizia.titolo}
                    </h3>
                    <p className="text-indigo-300 text-sm mb-3">
                      {formatDate(notizia.created_at)}
                    </p>
                    <p className="text-white/80 text-sm line-clamp-3">
                      {notizia.contenuto}
                    </p>
                  </div>
                ))}
              </div>
              
              {/* Pulsante Vedi tutte */}
              <div className="text-center">
                <Link 
                  to="/notizie"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
                >
                  📌 Vedi tutte le notizie
                </Link>
              </div>
            </>
          )}
        </section>

        {/* Sezione Saggi YouTube */}
        <section id="saggi" className="scroll-mt-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">I nostri saggi</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {SAGGI_YOUTUBE.map((saggio) => (
              <a
                key={saggio.id}
                href={saggio.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white/10 backdrop-blur-md rounded-xl overflow-hidden border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                <div className="aspect-video bg-gray-800 relative overflow-hidden">
                  <img
                    src={saggio.thumbnail}
                    alt={saggio.titolo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                    <svg className="w-12 h-12 text-white/80 group-hover:text-white group-hover:scale-110 transition-all" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white text-center font-semibold text-sm line-clamp-2 group-hover:text-indigo-300 transition-colors">
                    {saggio.titolo}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Sezione Le lezioni di oggi */}
        <section id="lezioni-oggi" className="scroll-mt-8">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Le lezioni di oggi</h2>
          
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
            <h3 className="text-4xl font-semibold text-white mb-6 text-center">{getToday()}</h3>
            
            {loadingLezioni ? (
              <div className="text-center text-white/70">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <p className="mt-2">Caricamento...</p>
              </div>
            ) : lezioniOggi.length === 0 ? (
              <p className="text-center text-white/70 py-4">Nessuna lezione per oggi</p>
            ) : (
              <div className="space-y-3">
                {lezioniOggi.map((lezione) => (
                  <div
  key={lezione.id}
  className="flex flex-col items-center text-center py-4 px-6 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
>
  <span className="text-white font-medium text-lg">{lezione.nome_corso}</span>
  <span className="text-indigo-300 font-semibold mt-1">
    {formatTime(lezione.orario_inizio)} - {formatTime(lezione.orario_fine)}
  </span>
</div>

                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-md border-t border-white/20 py-8 pb-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            
            {/* Contatti */}
            <div>
              <h4 className="text-white font-semibold mb-4">Contatti</h4>
              <div className="space-y-2 text-white/70">
                <p>
                  <a href="mailto:info@robyclub.it" className="hover:text-white transition-colors">
                    info@robyclub.it
                  </a>
                </p>
                <p>
                  <a href="tel:+393331234567" className="hover:text-white transition-colors">
                    +39 333 123 4567
                  </a>
                </p>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-semibold mb-4">Seguici</h4>
              <div className="flex justify-center md:justify-start space-x-4">
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/70 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Informazioni</h4>
              <div className="space-y-2">
                <a href="#" className="block text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="block text-white/70 hover:text-white transition-colors">
                  Termini di Servizio
                </a>
                <a href="#" className="block text-white/70 hover:text-white transition-colors">
                  Cookie Policy
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2024 Roby Club. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;