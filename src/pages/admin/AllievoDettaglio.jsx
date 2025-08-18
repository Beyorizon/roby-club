import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthProvider'
import { supabase } from '../../lib/supabase.js'
import PaymentGrid from '../../components/PaymentGrid'

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
      const corso = profile[`corso_${i}`];
      const prezzo = profile[`prezzo_corso${i}`];
      if (corso) {
        courses.push({
          numero: i,
          corso,
          prezzo: prezzo ? parseFloat(prezzo).toFixed(2) : '0.00'
        });
      }
    }
    return courses;
  };

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
            return trimmed && !isNaN(trimmed) ? parseInt(trimmed) : null
          }
          return null
        }
        
        // Per campi stringa (default)
        if (typeof value === 'string') {
          const trimmed = value.trim()
          return trimmed || null
        }
        
        return value
      }
      
      // Prepara updates solo con campi modificabili dall'utente
      const updates = {}
      
      // Campi modificabili dall'utente (stringhe)
      const stringFields = [
        'nome', 'cognome', 'cellulare',
        'nome_genitore1', 'cellulare_genitore1',
        'nome_genitore2', 'cellulare_genitore2',
        'taglia_tshirt', 'taglia_pantalone'
      ]
      
      stringFields.forEach(field => {
        updates[field] = cleanValue(formData[field], 'string')
      })
      
      // Campo numerico speciale
      updates.numero_scarpe = cleanValue(formData.numero_scarpe, 'integer')
      
      // Data nascita con conversione
      updates.data_nascita = toISODate(formData.data_nascita)
      
      // Campi admin-only (solo se admin)
      if (isAdmin) {
        for (let i = 1; i <= 5; i++) {
          const corsoField = `corso_${i}`
          const prezzoField = `prezzo_corso${i}`
          
          updates[corsoField] = cleanValue(formData[corsoField], 'string')
          updates[prezzoField] = cleanValue(formData[prezzoField], 'number')
        }
      }

      console.log('[DEBUG] Aggiornamento profilo allievo id:', id, updates)
      
      // Esegui update
      const { error } = await supabase
        .from('utenti')
        .update(updates)
        .eq('id', id)
      
      if (error) {
        console.error('[DEBUG] Errore update profilo:', error?.message, error)
        
        // Gestione errori specifici RLS
        if (error.code === 'PGRST116' || error.message?.includes('RLS')) {
          setMessage({ type: 'error', text: 'Permesso negato: alcuni campi non sono modificabili' })
        } else {
          setMessage({ type: 'error', text: `Errore nell'aggiornamento: ${error.message}` })
        }
        return
      }
      
      setMessage({ type: 'success', text: 'Profilo allievo aggiornato con successo!' })
      
      // Ricarica i dati aggiornati
      const { data: updatedProfile } = await supabase
        .from('utenti')
        .select('*')
        .eq('id', id)
        .single()
      
      if (updatedProfile) {
        setProfile(updatedProfile)
      }
      
      console.log('[DEBUG] Profilo aggiornato con successo')
      
      // Pulisci il messaggio dopo 3 secondi
      setTimeout(() => {
        setMessage({ type: '', text: '' })
      }, 3000)
      
    } catch (e) {
      console.error('[DEBUG] Update profilo fallito:', e?.message, e)
      setMessage({ type: 'error', text: 'Errore nell\'aggiornamento del profilo' })
    } finally {
      setSaving(false)
    }
  }

  // Gestione cambio input
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
  if (authError || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 flex items-center justify-center">
        <div className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg p-6 max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Allievo non trovato</h2>
          <p className="mb-4">L'allievo richiesto non esiste o non hai i permessi per visualizzarlo</p>
          <Link 
            to="/admin/allievi" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            ← Torna alla lista allievi
          </Link>
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
            Dettaglio Allievo: {profile?.nome && profile?.cognome ? `${profile.nome} ${profile.cognome}` : 'Sconosciuto'}
          </h1>
          <p className="text-white/80 mb-4">
            {profile?.ruolo ? `Ruolo: ${profile.ruolo.charAt(0).toUpperCase() + profile.ruolo.slice(1)}` : 'Gestisci il profilo dell\'allievo'}
          </p>
          <Link 
            to="/admin/allievi" 
            className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            ← Torna alla lista allievi
          </Link>
        </div>

        {/* Sezione Pagamenti */}
        <PaymentGrid authId={profile?.auth_id} adminMode={true} />

        {/* Card Profilo Allievo */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-6">Profilo Allievo</h2>
          
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
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.nome ? 'border-red-500' : 'border-white/20'
                    }`}
                    placeholder="Inserisci il nome"
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
                    placeholder="Inserisci il cognome"
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
                    placeholder="Inserisci il cellulare"
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