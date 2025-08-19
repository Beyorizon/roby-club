import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabase.js'
import { timeAgo } from '../../lib/timeAgo.js'

export default function NotizieAdmin() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingAnnuncio, setEditingAnnuncio] = useState(null)
  const [formAnnuncio, setFormAnnuncio] = useState({ titolo: '', contenuto: '', published: false })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Carica annunci
  const loadAnnunci = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('annunci')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      showMessage('error', 'Errore nel caricamento annunci: ' + error.message)
    } else {
      setAnnunci(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAnnunci()
  }, [])

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // CRUD Annunci
  const handleSubmitAnnuncio = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    
    try {
      if (editingAnnuncio) {
        // Update
        const { error } = await supabase
          .from('annunci')
          .update(formAnnuncio)
          .eq('id', editingAnnuncio.id)
        
        if (error) throw error
        
        // Optimistic update
        setAnnunci(prev => prev.map(a => 
          a.id === editingAnnuncio.id ? { ...a, ...formAnnuncio } : a
        ))
        
        showMessage('success', 'Annuncio aggiornato con successo')
        setEditingAnnuncio(null)
      } else {
        // Create
        const { data, error } = await supabase
          .from('annunci')
          .insert([formAnnuncio])
          .select()
        
        if (error) throw error
        
        // Optimistic update
        setAnnunci(prev => [data[0], ...prev])
        showMessage('success', 'Annuncio creato con successo')
      }
      
      setFormAnnuncio({ titolo: '', contenuto: '', published: false })
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
    
    setSubmitting(false)
  }

  const togglePublishAnnuncio = async (annuncio) => {
    const newPublished = !annuncio.published
    
    try {
      const { error } = await supabase
        .from('annunci')
        .update({ published: newPublished })
        .eq('id', annuncio.id)
      
      if (error) throw error
      
      // Optimistic update
      setAnnunci(prev => prev.map(a => 
        a.id === annuncio.id ? { ...a, published: newPublished } : a
      ))
      
      showMessage('success', `Annuncio ${newPublished ? 'pubblicato' : 'depubblicato'}`)
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const deleteAnnuncio = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return
    
    try {
      const { error } = await supabase
        .from('annunci')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      // Optimistic update
      setAnnunci(prev => prev.filter(a => a.id !== id))
      showMessage('success', 'Annuncio eliminato')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const startEditAnnuncio = (annuncio) => {
    setEditingAnnuncio(annuncio)
    setFormAnnuncio({
      titolo: annuncio.titolo,
      contenuto: annuncio.contenuto,
      published: annuncio.published
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Gestione Notizie</h1>
      </div>

      {/* Messaggi di stato */}
      {message.text && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-100'
            : 'bg-red-500/20 border-red-500/30 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Nuovo/Modifica Annuncio */}
        <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {editingAnnuncio ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
          </h2>
          
          <form onSubmit={handleSubmitAnnuncio} className="space-y-4">
            <input
              type="text"
              placeholder="Titolo"
              value={formAnnuncio.titolo}
              onChange={(e) => setFormAnnuncio(prev => ({ ...prev, titolo: e.target.value }))}
              className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            
            <textarea
              placeholder="Contenuto"
              value={formAnnuncio.contenuto}
              onChange={(e) => setFormAnnuncio(prev => ({ ...prev, contenuto: e.target.value }))}
              className="w-full px-4 py-3 min-h-[120px] bg-transparent border border-white/20 rounded-xl placeholder-white/60 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formAnnuncio.published}
                onChange={(e) => setFormAnnuncio(prev => ({ ...prev, published: e.target.checked }))}
                className="w-4 h-4 text-indigo-500 bg-transparent border-white/20 rounded focus:ring-indigo-500"
              />
              <span className="text-white/80">Pubblica immediatamente</span>
            </label>
            
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Salvando...' : (editingAnnuncio ? 'Aggiorna' : 'Crea')}
              </button>
              
              {editingAnnuncio && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingAnnuncio(null)
                    setFormAnnuncio({ titolo: '', contenuto: '', published: false })
                  }}
                  className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors text-white"
                >
                  Annulla
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista Annunci */}
        <div className="lg:col-span-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Lista Annunci</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
              <p className="text-white/70">Caricamento annunci...</p>
            </div>
          ) : annunci.length === 0 ? (
            <p className="text-white/70 text-center py-12">Nessun annuncio presente</p>
          ) : (
            <div className="space-y-4">
              {annunci.map((annuncio) => (
                <div key={annuncio.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-white text-lg">{annuncio.titolo}</h3>
                      <p className="text-white/60 text-sm">{timeAgo(annuncio.created_at)}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      annuncio.published 
                        ? 'bg-green-500/20 text-green-100 border border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30'
                    }`}>
                      {annuncio.published ? 'Pubblicato' : 'Bozza'}
                    </span>
                  </div>
                  
                  <p className="text-white/80 mb-4 line-clamp-3">
                    {annuncio.contenuto}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => togglePublishAnnuncio(annuncio)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        annuncio.published
                          ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-100 border border-green-500/30 hover:bg-green-500/30'
                      }`}
                    >
                      {annuncio.published ? 'Depubblica' : 'Pubblica'}
                    </button>
                    
                    <button
                      onClick={() => startEditAnnuncio(annuncio)}
                      className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-100 border border-blue-500/30 hover:bg-blue-500/30 text-sm font-medium transition-colors"
                    >
                      Modifica
                    </button>
                    
                    <button
                      onClick={() => deleteAnnuncio(annuncio.id)}
                      className="px-3 py-1 rounded-lg bg-red-500/20 text-red-100 border border-red-500/30 hover:bg-red-500/30 text-sm font-medium transition-colors"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}