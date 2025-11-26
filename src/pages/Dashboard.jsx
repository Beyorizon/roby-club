import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { supabase } from '../lib/supabase.js'

// Array dei mesi accademici (da AllievoDettaglio.jsx)
const MESI_ACCADEMICO = [
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto'
]

function Dashboard() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  // State per il profilo completo
  const [profile, setProfile] = useState(null)
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    data_nascita: '',
    cellulare: '',
    nome_genitore1: '',
    cellulare_genitore1: '',
    nome_genitore2: '',
    cellulare_genitore2: '',
    taglia_tshirt: '',
    taglia_pantalone: '',
    numero_scarpe: '',
    // Campi admin-only per visualizzazione
    corso_1: '',
    corso_2: '',
    corso_3: '',
    corso_4: '',
    corso_5: '',
    prezzo_corso1: '',
    prezzo_corso2: '',
    prezzo_corso3: '',
    prezzo_corso4: '',
    prezzo_corso5: ''
  })
  
  // Nuovi state per corsi e pagamenti
  const [corsi, setCorsi] = useState([])
  const [pagamenti, setPagamenti] = useState([])
  const [loadingPagamenti, setLoadingPagamenti] = useState(false)
  const [selectedAnno, setSelectedAnno] = useState(new Date().getFullYear())
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})
  const [authError, setAuthError] = useState(false)

  // Helper per convertire date
  const toISODate = (d) => {
    if (!d) return null;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
      const [dd, mm, yyyy] = d.split('/');
      return `${yyyy}-${mm}-${dd}`;
    }
    return d; // già in ISO
  };

  const fromISODate = (d) => {
    if (!d) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      const [yyyy, mm, dd] = d.split('-');
      return `${dd}/${mm}/${yyyy}`;
    }
    return d; // già in formato DD/MM/YYYY
  };
  
  // Aggiungi dopo calcolaTotale, intorno alla riga 83
  // Calcola il totale degli importi scaduti (solo quelli in rosso)
  const calcolaDaSaldare = () => {
    const pagamentiAnno = pagamenti.filter(
      p => p.anno === selectedAnno || p.anno === selectedAnno + 1 || !p.anno
    )
    return pagamentiAnno
      .filter(p => {
        const stato = getStatoMese(p.mese)
        return stato === 'scaduto' // Solo importi scaduti (in rosso)
      })
      .reduce((total, p) => total + (Number(p.importo) || 0), 0)
  }

  // Ottiene lo stato di un mese specifico per l'anno selezionato
  const getStatoMese = (mese) => {
    const pagamentiAnno = pagamenti.filter(
      p => p.anno === selectedAnno || p.anno === selectedAnno + 1 || !p.anno // Include pagamenti senza anno
    )
    const pagamento = pagamentiAnno.find(p => p.mese === mese)
    if (!pagamento) return 'non_dovuto'
    
    // Logica auto-scadenza: se oggi > 10 del mese e stato è non_pagato
    if (pagamento.stato === 'non_pagato') {
      const oggi = new Date()
      const meseIndex = MESI_ACCADEMICO.indexOf(mese)

      // Calcola l'indice accademico del mese corrente
      const monthMap = [4,5,6,7,8,9,10,11,0,1,2,3] 
      // Significa: Gen=4, Feb=5, Mar=6, Apr=7, Mag=8, Giu=9, Lug=10, Ago=11, Set=0, Ott=1, Nov=2, Dic=3
      const currentMeseIndex = monthMap[oggi.getMonth()]

      if ((currentMeseIndex === meseIndex && oggi.getDate() > 10) || currentMeseIndex > meseIndex) {
        return 'scaduto'
      }
    }
    
    return pagamento?.stato || 'non_dovuto'
  }

  // Ottiene il testo da mostrare per ogni mese per l'anno selezionato
  const getTestoMese = (mese) => {
    const pagamentiAnno = pagamenti.filter(
      p => p.anno === selectedAnno || p.anno === selectedAnno + 1 || !p.anno // Include pagamenti senza anno
    )
    const pagamento = pagamentiAnno.find(p => p.mese === mese)
    if (!pagamento) return 'Non dovuto'
    
    const stato = getStatoMese(mese)
    
    switch (stato) {
      case 'pagato': 
        return pagamento.importo ? `Pagato (€${pagamento.importo})` : 'Pagato'
      case 'scaduto':
        return pagamento.importo ? `Non pagato (€${pagamento.importo})` : 'Non pagato'
      case 'non_dovuto':
        return 'Non dovuto'
      default:
        return 'Non dovuto'
    }
  }

  // Ottiene il colore del bottone in base allo stato
  const getColoreMese = (stato) => {
    switch (stato) {
      case 'pagato': return 'bg-green-500 text-white'
      case 'non_pagato': return 'bg-yellow-500 text-white'
      case 'scaduto': return 'bg-red-500 text-white'
      case 'non_dovuto': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Funzione per ottenere corsi attivi (con nomi invece di ID)
  const getActiveCourses = () => {
    if (!profile) return [];
    const courses = [];
    for (let i = 1; i <= 5; i++) {
      const corsoId = profile[`corso_${i}`];
      const prezzo = profile[`prezzo_corso${i}`];
      if (corsoId) {
        // Trova il corso nell'array corsi
        const corso = corsi.find(c => c.id === corsoId);
        if (corso) {
          courses.push({
            numero: i,
            corso: corso.nome, // Ora mostra il nome invece dell'ID
            prezzo: prezzo ? parseFloat(prezzo).toFixed(2) : '0.00'
          });
        }
      }
    }
    return courses;
  };

  // Carica corsi disponibili
  const loadCorsi = async () => {
    try {
      const { data: corsiData, error } = await supabase
        .from('corsi')
        .select('id, nome')
        .order('nome')
      
      if (error) {
        console.error('Errore caricamento corsi:', error)
        return
      }
      
      setCorsi(corsiData || [])
    } catch (err) {
      console.error('Errore caricamento corsi:', err)
    }
  }

// Carico i pagamenti dell'utente loggato
const loadPagamenti = async () => {
  if (!user?.id || !profile?.id) return;

  try {
    setLoadingPagamenti(true);

    const { data: pagamentiRows, error: pagamentiError } = await supabase
      .from("pagamenti")
      .select("*")
      .eq("allievo_id", profile.id);

    if (pagamentiError) {
      console.error("Errore fetch pagamenti:", pagamentiError);
      return;
    }

    const pagamentiNormalizzati = (pagamentiRows || []).map((p) => ({
      ...p,
      anno: p.anno || new Date().getFullYear(),
    }));

    setPagamenti(pagamentiNormalizzati);
  } finally {
    setLoadingPagamenti(false);
  }
};





  // Carica i dati del profilo utente
  useEffect(() => {
    let isMounted = true

    const loadUserData = async () => {
      try {
        setLoading(true)
        setAuthError(false)

        if (!user?.id) {
          setMessage({ type: 'error', text: 'Utente non autenticato' })
          return
        }

        const { data: profileData, error } = await supabase
          .from('utenti')
          .select(`
            id, auth_id, ruolo, email,
            nome, cognome, data_iscrizione, data_nascita, cellulare,
            nome_genitore1, cellulare_genitore1,
            nome_genitore2, cellulare_genitore2,
            taglia_tshirt, taglia_pantalone, numero_scarpe,
            corso_1, corso_2, corso_3, corso_4, corso_5,
            prezzo_corso1, prezzo_corso2, prezzo_corso3, prezzo_corso4, prezzo_corso5
          `)
          .eq('auth_id', user.id)
          .single()

        if (error) {
          console.error('[supabase] profilo fetch error:', error?.message || error?.code || 'unknown')
          if (error.code === 'PGRST301' || error.code === 'PGRST116' ||
              error.message?.includes('403') || error.message?.includes('406')) {
            if (!isMounted) return
            setAuthError(true)
            setMessage({ type: 'error', text: 'Non autorizzato / dati non disponibili' })
          } else {
            if (!isMounted) return
            setMessage({ type: 'error', text: 'Errore nel caricamento del profilo' })
          }
          return
        }

        if (!isMounted) return
        if (profileData) {
          setProfile(profileData)
          setFormData({
            nome: profileData.nome || '',
            cognome: profileData.cognome || '',
            data_nascita: profileData.data_nascita ? fromISODate(profileData.data_nascita) : '',
            cellulare: profileData.cellulare || '',
            nome_genitore1: profileData.nome_genitore1 || '',
            cellulare_genitore1: profileData.cellulare_genitore1 || '',
            nome_genitore2: profileData.nome_genitore2 || '',
            cellulare_genitore2: profileData.cellulare_genitore2 || '',
            taglia_tshirt: profileData.taglia_tshirt || '',
            taglia_pantalone: profileData.taglia_pantalone || '',
            numero_scarpe: profileData.numero_scarpe || '',
            corso_1: profileData.corso_1 || '',
            corso_2: profileData.corso_2 || '',
            corso_3: profileData.corso_3 || '',
            corso_4: profileData.corso_4 || '',
            corso_5: profileData.corso_5 || '',
            prezzo_corso1: profileData.prezzo_corso1 || '',
            prezzo_corso2: profileData.prezzo_corso2 || '',
            prezzo_corso3: profileData.prezzo_corso3 || '',
            prezzo_corso4: profileData.prezzo_corso4 || '',
            prezzo_corso5: profileData.prezzo_corso5 || ''
          })
        }
      } catch (err) {
        console.error('[dashboard] load error:', err?.message || 'unknown')
        if (isMounted) setMessage({ type: 'error', text: 'Errore nel caricamento dei dati' })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUserData()
    return () => { isMounted = false }
  }, [user?.id])

 // Carica corsi quando l’utente cambia
useEffect(() => {
  if (profile?.id) {
    loadCorsi();
    loadPagamenti();
  }
}, [profile?.id, selectedAnno]);

useEffect(() => {
  if (!profile?.id) return;
  const interval = setInterval(() => {
    loadPagamenti();
  }, 10000);
  return () => clearInterval(interval);
}, [profile?.id]);


// Ricarica pagamenti quando la finestra torna in focus
useEffect(() => {
  const handleFocus = () => {
    if (profile?.id) {
      loadPagamenti();
    }
  };
  window.addEventListener("focus", handleFocus);
  return () => window.removeEventListener("focus", handleFocus);
}, [profile?.id]);


  // Funzione handleSubmit per il salvataggio profilo
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      setErrors({})
      
      // Validazione campi obbligatori
      const newErrors = {}
      if (!formData.nome || (typeof formData.nome === 'string' && !formData.nome.trim())) {
        newErrors.nome = 'Nome obbligatorio'
      }
      if (!formData.cognome || (typeof formData.cognome === 'string' && !formData.cognome.trim())) {
        newErrors.cognome = 'Cognome obbligatorio'
      }
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setSaving(false)
        return
      }
      
      // Helper function per pulire i valori in modo sicuro
      const cleanValue = (value, fieldType = 'string') => {
        if (value === null || value === undefined) return null
        
        if (fieldType === 'number') {
          // Per campi numerici
          if (typeof value === 'number') return value
          if (typeof value === 'string') {
            const trimmed = value.trim()
            return trimmed && !isNaN(trimmed) ? parseFloat(trimmed) : null
          }
          return null
        }
        
        if (fieldType === 'integer') {
          // Per campi interi
          if (typeof value === 'number') return Math.floor(value)
          if (typeof value === 'string') {
            const trimmed = value.trim()
            return trimmed && !isNaN(trimmed) ? parseInt(trimmed, 10) : null
          }
          return null
        }
        
        // Per campi stringa
        if (typeof value === 'string') {
          const trimmed = value.trim()
          return trimmed || null
        }
        
        return value
      }
      
      const updateData = {
        nome: cleanValue(formData.nome) || null,
        cognome: cleanValue(formData.cognome) || null,
        data_nascita: formData.data_nascita ? toISODate(formData.data_nascita) : null,
        cellulare: cleanValue(formData.cellulare) || null,
        nome_genitore1: cleanValue(formData.nome_genitore1) || null,
        cellulare_genitore1: cleanValue(formData.cellulare_genitore1) || null,
        nome_genitore2: cleanValue(formData.nome_genitore2) || null,
        cellulare_genitore2: cleanValue(formData.cellulare_genitore2) || null,
        taglia_tshirt: cleanValue(formData.taglia_tshirt) || null,
        taglia_pantalone: cleanValue(formData.taglia_pantalone) || null,
        numero_scarpe: cleanValue(formData.numero_scarpe, 'integer') || null,
        // Campi corso (solo admin)
        ...(isAdmin && {
          corso_1: cleanValue(formData.corso_1) || null,
          corso_2: cleanValue(formData.corso_2) || null,
          corso_3: cleanValue(formData.corso_3) || null,
          corso_4: cleanValue(formData.corso_4) || null,
          corso_5: cleanValue(formData.corso_5) || null,
          prezzo_corso1: cleanValue(formData.prezzo_corso1, 'number') || null,
          prezzo_corso2: cleanValue(formData.prezzo_corso2, 'number') || null,
          prezzo_corso3: cleanValue(formData.prezzo_corso3, 'number') || null,
          prezzo_corso4: cleanValue(formData.prezzo_corso4, 'number') || null,
          prezzo_corso5: cleanValue(formData.prezzo_corso5, 'number') || null
        })
      }
      
      const { error } = await supabase
        .from('utenti')
        .update(updateData)
        .eq('auth_id', user.id)
      
      if (error) {
        console.error('[supabase] update error:', error)
        setMessage({ type: 'error', text: 'Errore nel salvataggio del profilo' })
        return
      }
      
      setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' })
      
      // Ricarica i dati aggiornati
      const { data: updatedProfile } = await supabase
        .from('utenti')
        .select('*')
        .eq('auth_id', user.id)
        .single()
      
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
      
    } catch (err) {
      console.error('[dashboard] save error:', err)
      setMessage({ type: 'error', text: 'Errore nel salvataggio del profilo' })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Rimuovi errore se l'utente inizia a digitare
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  // Banner errore autorizzazione
  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Accesso Negato</h2>
          <p>Non autorizzato / dati non disponibili</p>
        </div>
      </div>
    )
  }

  const activeCourses = getActiveCourses()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Benvenuto, {profile?.nome && profile?.cognome ? `${profile.nome} ${profile.cognome}` : 'Utente'}!
          </h1>
          <p className="text-white/80">
            {profile?.ruolo ? `Ruolo: ${profile.ruolo.charAt(0).toUpperCase() + profile.ruolo.slice(1)}` : 'Gestisci il tuo profilo e visualizza i tuoi corsi'}
          </p>
        </div>

        {/* Sezione Pagamenti - Nuova implementazione */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">
            Pagamenti {selectedAnno}/{selectedAnno + 1}
          </h2>
          
          <div className="mb-4">
            <p className="text-white text-lg">
              Da saldare: <span className="text-red-400 font-bold">€{calcolaDaSaldare().toFixed(2)}</span>
            </p>
          </div>
          
          {/* Rimuovi il commento JSX errato dalle righe 486-496 */}
          
          {/* Filtro anni */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {[2025, 2026].map(a => (
              <button
                key={a}
                onClick={() => setSelectedAnno(a)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedAnno === a 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {a}/{a+1}
              </button>
            ))}
          </div>
          
          {loadingPagamenti ? (
            <div className="text-white text-center">Caricamento pagamenti...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MESI_ACCADEMICO.map((mese, index) => {
                const stato = getStatoMese(mese)
                const testoMese = getTestoMese(mese)
                
                return (
                  <div
                    key={mese}
                    className={`px-4 py-3 rounded-xl font-medium ${
                      getColoreMese(stato)
                    }`}
                  >
                    <div className="text-sm">{mese}</div>
                    <div className="text-xs mt-1">{testoMese}</div>
                  </div>
                )
              })}
            </div>
          )}
          
          {/* Legenda */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-white">Pagato</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-white">Non pagato / Scaduto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-white">Non dovuto</span>
            </div>
          </div>
        </div>

        {/* Card Il mio profilo */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Il mio profilo</h2>
          
          {message.text && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dati personali */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Dati personali</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleInputChange}
                    disabled={isAdmin === false ? false : false}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.nome ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Inserisci il tuo nome"
                  />
                  {errors.nome && <p className="text-red-400 text-sm mt-1">{errors.nome}</p>}
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Cognome *
                  </label>
                  <input
                    type="text"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.cognome ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Inserisci il tuo cognome"
                  />
                  {errors.cognome && <p className="text-red-400 text-sm mt-1">{errors.cognome}</p>}
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email (sola lettura)
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Data iscrizione (sola lettura)
                  </label>
                  <input
                    type="text"
                    value={profile?.data_iscrizione ? fromISODate(profile.data_iscrizione) : ''}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 cursor-not-allowed"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Data di nascita (DD/MM/YYYY)
                  </label>
                  <input
                    type="text"
                    name="data_nascita"
                    value={formData.data_nascita}
                    onChange={handleInputChange}
                    placeholder="18/04/1994"
                    pattern="\d{2}/\d{2}/\d{4}"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Cellulare
                  </label>
                  <input
                    type="tel"
                    name="cellulare"
                    value={formData.cellulare}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Inserisci il tuo cellulare"
                  />
                </div>
              </div>
            </div>

            {/* Dati genitori */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Dati genitori</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Nome genitore 1
                  </label>
                  <input
                    type="text"
                    name="nome_genitore1"
                    value={formData.nome_genitore1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nome del primo genitore"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Cellulare genitore 1
                  </label>
                  <input
                    type="tel"
                    name="cellulare_genitore1"
                    value={formData.cellulare_genitore1}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Cellulare del primo genitore"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Nome genitore 2
                  </label>
                  <input
                    type="text"
                    name="nome_genitore2"
                    value={formData.nome_genitore2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nome del secondo genitore"
                  />
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Cellulare genitore 2
                  </label>
                  <input
                    type="tel"
                    name="cellulare_genitore2"
                    value={formData.cellulare_genitore2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Cellulare del secondo genitore"
                  />
                </div>
              </div>
            </div>

            {/* Taglie */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Taglie</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Taglia T-shirt
                  </label>
                  <select
                    name="taglia_tshirt"
                    value={formData.taglia_tshirt}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Seleziona taglia</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>
                
                <div> 
                  <label className="block text-white/80 text-sm font-medium mb-2"> 
                  Taglia pantalone 
                  </label> 
                <select 
                name="taglia_pantalone" 
                value={formData.taglia_pantalone} 
                onChange={handleInputChange} 
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" > 
                <option value="">
                  Seleziona taglia
                  </option> 
                <option value="XS">XS</option> 
                <option value="S">S</option> 
                <option value="M">M</option> 
                <option value="L">L</option> 
                <option value="XL">XL</option> 
                <option value="XXL">XXL</option> 
                </select> 
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Numero scarpe
                  </label>
                  <input
                    type="number"
                    name="numero_scarpe"
                    value={formData.numero_scarpe}
                    onChange={handleInputChange}
                    min="20"
                    max="50"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="es. 42"
                  />
                </div>
              </div>
            </div>

            {/* Sezione corsi (admin-only per editing) */}
            {isAdmin && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Gestione corsi (Admin)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="space-y-2">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Corso {i}
                        </label>
                        <input
                          type="text"
                          name={`corso_${i}`}
                          value={formData[`corso_${i}`]}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder={`Nome corso ${i}`}
                        />
                      </div>
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Prezzo corso {i} (€)
                        </label>
                        <input
                          type="number"
                          name={`prezzo_corso${i}`}
                          value={formData[`prezzo_corso${i}`]}
                          onChange={handleInputChange}
                          step="0.01"
                          min="0"
                          pattern="^\d+(\.\d{1,2})?$"
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Salvando...' : 'Salva modifiche'}
            </button>
          </form>
        </div>

        {/* Sezione Corsi attivi (visualizzazione dinamica) */}
        {activeCourses.length > 0 && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">I miei corsi</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCourses.map((course) => (
                <div key={course.numero} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {course.corso}
                  </h3>
                  <p className="text-indigo-400 font-medium">
                    Prezzo: €{course.prezzo}/mese
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
