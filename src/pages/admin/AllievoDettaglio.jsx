import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import supabase from '../../lib/supabase.js'
import PaymentGrid from '../../components/PaymentGrid.jsx'

export default function AllievoDettaglio() {
  const { authId } = useParams()
  const [allievo, setAllievo] = useState(null)
  const [corsi, setCorsi] = useState([])
  const [iscrizioni, setIscrizioni] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [newCourse, setNewCourse] = useState({ corso_id: '', prezzo: '' })
  const [addingCourse, setAddingCourse] = useState(false)

  useEffect(() => {
    loadData()
  }, [authId])

  const loadData = async () => {
    setLoading(true)
    
    // Carica dati allievo
    const { data: allievoData, error: allievoError } = await supabase
      .from('utenti')
      .select('*')
      .eq('auth_id', authId)
      .single()
    
    // Carica tutti i corsi
    const { data: corsiData, error: corsiError } = await supabase
      .from('corsi')
      .select('*')
      .order('nome')
    
    // Carica iscrizioni dell'allievo con prezzi
    const { data: iscrizioniData, error: iscrizioniError } = await supabase
      .from('iscrizioni')
      .select('*, corsi(nome, descrizione)')
      .eq('auth_id', authId)
      .eq('attiva', true)
    
    if (allievoError || corsiError || iscrizioniError) {
      console.error('Errore caricamento dati:', { allievoError, corsiError, iscrizioniError })
    } else {
      setAllievo(allievoData)
      setCorsi(corsiData || [])
      setIscrizioni(iscrizioniData || [])
      setProfileForm(allievoData || {})
    }
    
    setLoading(false)
  }

  const updateProfile = async (e) => {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('utenti')
        .update({
          nome: profileForm.nome,
          cognome: profileForm.cognome,
          data_nascita: profileForm.data_nascita,
          telefono: profileForm.telefono,
          nome_genitore: profileForm.nome_genitore,
          telefono_genitore: profileForm.telefono_genitore,
          taglia_maglietta: profileForm.taglia_maglietta,
          taglia_pantaloncini: profileForm.taglia_pantaloncini,
          data_iscrizione: profileForm.data_iscrizione
        })
        .eq('auth_id', authId)
      
      if (error) throw error
      
      setAllievo(profileForm)
      setEditingProfile(false)
      showMessage('success', 'Profilo aggiornato')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const addCourse = async () => {
    if (!newCourse.corso_id || !newCourse.prezzo) {
      showMessage('error', 'Seleziona corso e inserisci prezzo')
      return
    }
    
    setAddingCourse(true)
    try {
      const { data, error } = await supabase
        .from('iscrizioni')
        .upsert({
          auth_id: authId,
          corso_id: parseInt(newCourse.corso_id),
          prezzo: parseFloat(newCourse.prezzo),
          attiva: true
        })
        .select('*, corsi(nome, descrizione)')
      
      if (error) throw error
      
      await loadData() // Ricarica i dati
      setNewCourse({ corso_id: '', prezzo: '' })
      showMessage('success', 'Corso aggiunto')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
    setAddingCourse(false)
  }

  const updateCoursePrice = async (iscrizioneId, newPrice) => {
    try {
      const { error } = await supabase
        .from('iscrizioni')
        .update({ prezzo: parseFloat(newPrice) })
        .eq('id', iscrizioneId)
      
      if (error) throw error
      
      setIscrizioni(prev => prev.map(i => 
        i.id === iscrizioneId ? { ...i, prezzo: parseFloat(newPrice) } : i
      ))
      showMessage('success', 'Prezzo aggiornato')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const removeCourse = async (iscrizioneId) => {
    if (!confirm('Rimuovere questo corso?')) return
    
    try {
      const { error } = await supabase
        .from('iscrizioni')
        .update({ attiva: false })
        .eq('id', iscrizioneId)
      
      if (error) throw error
      
      setIscrizioni(prev => prev.filter(i => i.id !== iscrizioneId))
      showMessage('success', 'Corso rimosso')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-white/70">Caricamento dettagli allievo...</div>
        </div>
      </div>
    )
  }

  if (!allievo) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-red-400">Allievo non trovato</div>
          <Link to="/admin/allievi" className="text-indigo-400 hover:underline mt-2 inline-block">
            Torna alla lista allievi
          </Link>
        </div>
      </div>
    )
  }

  const availableCourses = corsi.filter(corso => 
    !iscrizioni.some(i => i.corso_id === corso.id)
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            to="/admin/allievi" 
            className="text-indigo-400 hover:underline text-sm mb-2 inline-block"
          >
            ← Torna alla lista allievi
          </Link>
          <h2 className="text-2xl font-bold">
            {allievo.nome} {allievo.cognome}
          </h2>
        </div>
      </div>

      {/* Messaggi */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-100'
            : 'bg-red-500/20 border-red-500/30 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Card Anagrafica */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Anagrafica</h3>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors"
          >
            {editingProfile ? 'Annulla' : 'Modifica'}
          </button>
        </div>

        {editingProfile ? (
          <form onSubmit={updateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Nome *</label>
              <input
                type="text"
                value={profileForm.nome || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Cognome *</label>
              <input
                type="text"
                value={profileForm.cognome || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, cognome: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Data Nascita</label>
              <input
                type="date"
                value={profileForm.data_nascita || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, data_nascita: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Data Iscrizione</label>
              <input
                type="date"
                value={profileForm.data_iscrizione || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, data_iscrizione: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Telefono</label>
              <input
                type="tel"
                value={profileForm.telefono || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, telefono: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Nome Genitore</label>
              <input
                type="text"
                value={profileForm.nome_genitore || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, nome_genitore: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Telefono Genitore</label>
              <input
                type="tel"
                value={profileForm.telefono_genitore || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, telefono_genitore: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Taglia Maglietta</label>
              <select
                value={profileForm.taglia_maglietta || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, taglia_maglietta: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleziona</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Taglia Pantaloncini</label>
              <select
                value={profileForm.taglia_pantaloncini || ''}
                onChange={(e) => setProfileForm(prev => ({ ...prev, taglia_pantaloncini: e.target.value }))}
                className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Seleziona</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors font-semibold"
              >
                Salva Modifiche
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Email</label>
              <div className="text-white/90">{allievo.email}</div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Ruolo</label>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                allievo.ruolo === 'insegnante' 
                  ? 'bg-blue-500/20 text-blue-100' 
                  : 'bg-green-500/20 text-green-100'
              }`}>
                {allievo.ruolo}
              </span>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Data Nascita</label>
              <div className="text-white/90">
                {allievo.data_nascita 
                  ? new Date(allievo.data_nascita).toLocaleDateString('it-IT')
                  : 'Non specificata'
                }
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Data Iscrizione</label>
              <div className="text-white/90">
                {allievo.data_iscrizione 
                  ? new Date(allievo.data_iscrizione).toLocaleDateString('it-IT')
                  : 'Non specificata'
                }
              </div>
            </div>
            {allievo.telefono && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Telefono</label>
                <div className="text-white/90">{allievo.telefono}</div>
              </div>
            )}
            {allievo.nome_genitore && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Nome Genitore</label>
                <div className="text-white/90">{allievo.nome_genitore}</div>
              </div>
            )}
            {allievo.telefono_genitore && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Telefono Genitore</label>
                <div className="text-white/90">{allievo.telefono_genitore}</div>
              </div>
            )}
            {allievo.taglia_maglietta && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Taglia Maglietta</label>
                <div className="text-white/90">{allievo.taglia_maglietta}</div>
              </div>
            )}
            {allievo.taglia_pantaloncini && (
              <div>
                <label className="block text-sm text-white/60 mb-1">Taglia Pantaloncini</label>
                <div className="text-white/90">{allievo.taglia_pantaloncini}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Corsi & Prezzi */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold mb-4">Corsi & Prezzi</h3>
        
        {/* Aggiungi Corso */}
        <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
          <h4 className="font-medium mb-3">Aggiungi Corso</h4>
          <div className="flex gap-3">
            <select
              value={newCourse.corso_id}
              onChange={(e) => setNewCourse(prev => ({ ...prev, corso_id: e.target.value }))}
              className="flex-1 px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Seleziona corso</option>
              {availableCourses.map(corso => (
                <option key={corso.id} value={corso.id}>{corso.nome}</option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Prezzo €"
              value={newCourse.prezzo}
              onChange={(e) => setNewCourse(prev => ({ ...prev, prezzo: e.target.value }))}
              className="w-32 px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addCourse}
              disabled={addingCourse}
              className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors font-semibold disabled:opacity-60"
            >
              {addingCourse ? 'Aggiungendo...' : 'Aggiungi'}
            </button>
          </div>
        </div>

        {/* Lista Corsi Attuali */}
        {iscrizioni.length > 0 ? (
          <div className="space-y-3">
            {iscrizioni.map((iscrizione) => (
              <div key={iscrizione.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <h4 className="font-medium text-white/90">{iscrizione.corsi.nome}</h4>
                  {iscrizione.corsi.descrizione && (
                    <p className="text-sm text-white/60">{iscrizione.corsi.descrizione}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.01"
                    value={iscrizione.prezzo || ''}
                    onChange={(e) => updateCoursePrice(iscrizione.id, e.target.value)}
                    className="w-24 px-2 py-1 bg-transparent border border-white/20 rounded text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-white/60">€</span>
                  <button
                    onClick={() => removeCourse(iscrizione.id)}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-100 border border-red-500/30 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white/60 text-center py-4">
            Nessun corso assegnato
          </div>
        )}
      </div>

      {/* Card Pagamenti */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-xl font-semibold mb-4">Pagamenti</h3>
        <PaymentGrid authId={authId} adminMode={true} iscrizioni={iscrizioni} onPaymentUpdate={loadData} />
      </div>
    </div>
  )
}