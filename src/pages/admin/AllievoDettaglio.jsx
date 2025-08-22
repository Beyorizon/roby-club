import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { supabase } from '../../lib/supabase.js'
import PaymentGrid from '../../components/PaymentGrid'

// Costante per il costo mensile
// const COSTO_MENSILE = 30 // RIMUOVI QUESTA RIGA

// Array dei mesi per il 2025
const MESI_ACCADEMICO = [
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto'
]

function AllievoDettaglio() {
  const { id } = useParams()
  const { isAdmin } = useAuth()
  
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
    // Campi admin-only per visualizzazione - ora salvano ID corso
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
  const [defaultImporto, setDefaultImporto] = useState(30)
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

  // Funzione per ottenere corsi attivi (non null)
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
            corso: `${corso.nome}`,
            prezzo: prezzo ? parseFloat(prezzo).toFixed(2) : '0.00'
          });
        }
      }
    }
    return courses;
  };

  // Carica i corsi da Supabase
  const loadCorsi = async () => {
    try {
      const { data, error } = await supabase
        .from('corsi')
        .select('*')
        .order('nome')
      
      if (error) {
        console.error('Errore caricamento corsi:', error)
        return
      }
      
      setCorsi(data || [])
    } catch (err) {
      console.error('Errore caricamento corsi:', err)
    }
  }

  // Carica i pagamenti mensili dell'allievo
  const loadPagamenti = async () => {
    if (!profile?.id) return
    
    try {
      setLoadingPagamenti(true)
      const { data, error } = await supabase
        .from('pagamenti')
        .select('*')
        .eq('allievo_id', profile.id)
        // RIMOSSO: .eq('tipo', 'mensile') - questo filtro non esiste nella Dashboard
      
      if (error) {
        console.error('Errore caricamento pagamenti:', error)
        return
      }
      
      // Assegna anno di default ai pagamenti che non ce l'hanno
      const pagamentiConAnno = (data || []).map(p => ({
        ...p,
        anno: p.anno || 2025 // Anno di default
      }))
      
      setPagamenti(pagamentiConAnno)
    } catch (err) {
      console.error('Errore caricamento pagamenti:', err)
    } finally {
      setLoadingPagamenti(false)
    }
  }

  // Gestisce il click sui bottoni dei mesi - CICLO A TRE STATI
  const handleMeseClick = async (mese) => {
    try {
      // Cerca pagamento per mese E anno selezionato
      const pagamento = pagamenti.find(p => p.mese === mese && (p.anno === selectedAnno || p.anno === selectedAnno + 1))
      let nuovoStato
      let nuovoImporto
      
      // CICLO A TRE STATI: non_dovuto -> scaduto -> pagato -> non_dovuto
      if (!pagamento || pagamento.stato === 'non_dovuto') {
        // Da grigio (non_dovuto) a rosso (scaduto)
        nuovoStato = 'scaduto'
        nuovoImporto = defaultImporto // Usa importo di default
      } else if (pagamento.stato === 'scaduto' || pagamento.stato === 'non_pagato') {
        // Da rosso (scaduto) a verde (pagato)
        nuovoStato = 'pagato'
        nuovoImporto = pagamento?.importo || defaultImporto // Mantiene importo esistente o usa default
      } else if (pagamento.stato === 'pagato') {
        // Da verde (pagato) a grigio (non_dovuto)
        nuovoStato = 'non_dovuto'
        nuovoImporto = null // Nessun importo per non_dovuto
      }
      
      if (pagamento) {
        // Update esistente
        const { error } = await supabase
          .from("pagamenti")
          .update({
            stato: nuovoStato,
            importo: nuovoImporto,
            anno: selectedAnno // AGGIUNTO: passa l'anno anche nell'update
          })
          .eq("id", pagamento.id)
        
        if (error) throw error
      }
      else {
        // Insert nuovo - INCLUDE ANNO
        const { error } = await supabase
          .from("pagamenti")
          .insert({
            allievo_id: id,
            mese: mese,
            anno: selectedAnno,
            stato: nuovoStato,
            importo: nuovoImporto,
          })
        
        if (error) throw error
      }
      
      // Aggiorna stato locale
      setPagamenti(prev => {
        const index = prev.findIndex(p => p.mese === mese && (p.anno === selectedAnno || p.anno === selectedAnno + 1))
        const nuovoPagamento = { 
          id: pagamento?.id, 
          allievo_id: id, 
          mese, 
          anno: selectedAnno, // AGGIUNTO CAMPO ANNO
          stato: nuovoStato, 
          importo: nuovoImporto 
        }
        
        if (index >= 0) {
          return prev.map((p, i) => i === index ? nuovoPagamento : p)
        } else {
          return [...prev, nuovoPagamento]
        }
      })
    } catch (err) {
      console.error('Errore gestione pagamento:', err)
    }
  }

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
      case 'pagato': return 'bg-green-500 hover:bg-green-600 text-white'
      case 'non_pagato': return 'bg-yellow-500 hover:bg-yellow-600 text-white'
      case 'scaduto': return 'bg-red-500 hover:bg-red-600 text-white'
      case 'non_dovuto': return 'bg-gray-500 hover:bg-gray-600 text-white'
      default: return 'bg-gray-500 hover:bg-gray-600 text-white'
    }
  }
  // Carica i dati del profilo utente tramite id
  useEffect(() => {
    let isMounted = true

    const loadUserData = async () => {
      try {
        setLoading(true)
        setAuthError(false)

        if (!id) {
          setMessage({ type: 'error', text: 'ID allievo non specificato' })
          return
        }

        console.log('[DEBUG] Caricamento dati allievo con id:', id)

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
          .eq('id', id)
          .single()

        if (error) {
          console.error('[DEBUG] Errore fetch allievo:', error?.message || error?.code || 'unknown')
          if (error.code === 'PGRST301' || error.code === 'PGRST116' ||
              error.message?.includes('403') || error.message?.includes('406')) {
            if (!isMounted) return
            setAuthError(true)
            setMessage({ type: 'error', text: 'Non autorizzato / allievo non trovato' })
          } else {
            if (!isMounted) return
            setMessage({ type: 'error', text: 'Errore nel caricamento del profilo allievo' })
          }
          return
        }

        if (!isMounted) return
        if (profileData) {
          console.log('[DEBUG] Allievo caricato:', profileData)
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
        console.error('[DEBUG] Errore caricamento:', err?.message || 'unknown')
        if (isMounted) setMessage({ type: 'error', text: 'Errore nel caricamento dei dati' })
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUserData()
    return () => { isMounted = false }
  }, [id])

  // Carica corsi all'avvio
  useEffect(() => {
    loadCorsi()
  }, [])

  // Carica pagamenti quando il profilo è disponibile
  useEffect(() => {
    if (profile?.id) {
      loadPagamenti()
    }
  }, [profile?.id])

  // Gestione input con rimozione errori
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Rimuovi l'errore per questo campo se esiste
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  // Funzione handleSubmit per il salvataggio profilo
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      
      // Prepara i dati da aggiornare
      const updateData = {
  // stringhe
  nome: formData.nome || null,
  cognome: formData.cognome || null,
  data_nascita: toISODate(formData.data_nascita) || null,
  cellulare: formData.cellulare || null,
  nome_genitore1: formData.nome_genitore1 || null,
  cellulare_genitore1: formData.cellulare_genitore1 || null,
  nome_genitore2: formData.nome_genitore2 || null,
  cellulare_genitore2: formData.cellulare_genitore2 || null,
  taglia_tshirt: formData.taglia_tshirt || null,
  taglia_pantalone: formData.taglia_pantalone || null,

  // numeri interi
  numero_scarpe: formData.numero_scarpe
    ? parseInt(formData.numero_scarpe, 10)
    : null,

  // corsi (se in DB sono int / uuid → qui resta stringa o null)
  corso_1: formData.corso_1 || null,
  corso_2: formData.corso_2 || null,
  corso_3: formData.corso_3 || null,
  corso_4: formData.corso_4 || null,
  corso_5: formData.corso_5 || null,

  // prezzi corsi (numerici, possono avere decimali)
  prezzo_corso1: formData.prezzo_corso1
    ? parseFloat(formData.prezzo_corso1)
    : null,
  prezzo_corso2: formData.prezzo_corso2
    ? parseFloat(formData.prezzo_corso2)
    : null,
  prezzo_corso3: formData.prezzo_corso3
    ? parseFloat(formData.prezzo_corso3)
    : null,
  prezzo_corso4: formData.prezzo_corso4
    ? parseFloat(formData.prezzo_corso4)
    : null,
  prezzo_corso5: formData.prezzo_corso5
    ? parseFloat(formData.prezzo_corso5)
    : null,
};

      
      // Aggiorna la tabella utenti su Supabase
      const { error } = await supabase
        .from('utenti')
        .update(updateData)
        .eq('id', id)
      
      if (error) {
        console.error('Errore aggiornamento:', error)
        alert('Errore durante il salvataggio.')
        return
      }
      
      // Successo
      alert('Dati salvati con successo!')
      
      // Ricarica i dati aggiornati
      const { data: updatedProfile } = await supabase
        .from('utenti')
        .select('*')
        .eq('id', id)
        .single()
      
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
      
    } catch (err) {
      console.error('Errore durante il salvataggio:', err)
      alert('Errore durante il salvataggio.')
    } finally {
      setSaving(false)
    }
  }

  const activeCourses = getActiveCourses()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Accesso negato</h1>
          <p className="text-white/80 mb-6">Non hai i permessi per visualizzare questo allievo</p>
          <Link to="/admin/allievi" className="text-indigo-400 hover:text-indigo-300">
            ← Torna alla lista allievi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {profile?.nome} {profile?.cognome}
            </h1>
            <Link to="/admin/allievi" className="text-indigo-400 hover:text-indigo-300">
              ← Torna alla lista allievi
            </Link>
          </div>
        </div>

        {/* Sezione Pagamenti con filtro anno */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Pagamenti {selectedAnno}/{selectedAnno + 1}</h2>
            <div className="mb-4">
            <p className="text-white text-lg">
              Da saldare: <span className="text-red-400 font-bold">€{calcolaDaSaldare().toFixed(2)}</span>
            </p>
          </div>
          </div>

          
          {/* Filtri anno scolastico */}
          <div className="flex gap-2 mb-4">
            {[2025, 2026].map(a => (
              <button
                key={a}
                onClick={() => setSelectedAnno(a)}
                className={`px-3 py-1 rounded ${
                  selectedAnno === a ? "bg-green-600 text-white" : "bg-gray-200 text-black"
                }`}
              >
                {a}/{a+1}
              </button>
            ))}
          </div>
          
          {/* Input per importo mensile di default */}
          <div className="mb-4">
            <label className="mr-2">L'allievo paga al mese:</label>
            <input
              type="number"
              value={defaultImporto}
              min="0"
              step="0.01"
              onChange={(e) => setDefaultImporto(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24 text-black"
            />
            €
          </div>
          
          {loadingPagamenti ? (
            <div className="text-white text-center">Caricamento pagamenti...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {MESI_ACCADEMICO.map((mese, index) => {
                const stato = getStatoMese(mese)
                const testoMese = getTestoMese(mese)
                
                return (
                  <button
                    key={mese}
                    onClick={() => handleMeseClick(mese)}
                    className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                      getColoreMese(stato)
                    }`}
                  >
                    <div className="text-sm">{mese}</div>
                    <div className="text-xs mt-1">{testoMese}</div>
                  </button>
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

        {/* Form profilo */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Profilo allievo</h2>
          
          {/* Messaggi */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl ${
              message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
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
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.nome ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Nome"
                  />
                  {errors.nome && (
                    <p className="mt-1 text-sm text-red-400">{errors.nome}</p>
                  )}
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
                    placeholder="Cognome"
                  />
                  {errors.cognome && (
                    <p className="mt-1 text-sm text-red-400">{errors.cognome}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    Email
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
                    Data iscrizione
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
                    Data di nascita
                  </label>
                  <input
                    type="text"
                    name="data_nascita"
                    value={formData.data_nascita}
                    onChange={handleInputChange}
                    placeholder="DD/MM/YYYY"
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
                    placeholder="Numero di cellulare"
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
                    Nome genitore 2 (facoltativo)
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
                    Cellulare genitore 2 (facoltativo)
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
                        <select
                          name={`corso_${i}`}
                          value={formData[`corso_${i}`]}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Seleziona corso</option>
                          {corsi.map(corso => (
                            <option key={corso.id} value={corso.id}>
                              {corso.nome}
                            </option>
                          ))}
                        </select>
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
            <h2 className="text-2xl font-semibold text-white mb-6">Corsi dell'allievo</h2>
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

export default AllievoDettaglio