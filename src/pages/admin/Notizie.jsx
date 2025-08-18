import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabase.js'
import { timeAgo } from '../../lib/timeAgo.js'

export default function Notizie() {
  const [annunci, setAnnunci] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingAnnuncio, setEditingAnnuncio] = useState(null)
  const [formAnnuncio, setFormAnnuncio] = useState({ titolo: '', contenuto: '', published: false })
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    loadAnnunci()
  }, [])

  const loadAnnunci = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('annunci')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      showMessage('error', 'Errore nel caricamento: ' + error.message)
    } else {
      setAnnunci(data || [])
    }
    setLoading(false)
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  const handleSubmit = async (e) => {
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
        
        setAnnunci(prev => prev.map(a => 
          a.id === editingAnnuncio.id ? { ...a, ...formAnnuncio } : a
        ))
        
        showMessage('success', 'Annuncio aggiornato')
        setEditingAnnuncio(null)
      } else {
        // Create
        const { data, error } = await supabase
          .from('annunci')
          .insert([formAnnuncio])
          .select()
        
        if (error) throw error
        
        setAnnunci(prev => [data[0], ...prev])
        showMessage('success', 'Annuncio creato')
      }
      
      setFormAnnuncio({ titolo: '', contenuto: '', published: false })
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
    
    setSubmitting(false)
  }

  const togglePublish = async (annuncio) => {
    const newPublished = !annuncio.published
    
    try {
      const { error } = await supabase
        .from('annunci')
        .update({ published: newPublished })
        .eq('id', annuncio.id)
      
      if (error) throw error
      
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
      
      setAnnunci(prev => prev.filter(a => a.id !== id))
      showMessage('success', 'Annuncio eliminato')
    } catch (error) {
      showMessage('error', 'Errore: ' + error.message)
    }
  }

  const startEdit = (annuncio) => {
    setEditingAnnuncio(annuncio)
    setFormAnnuncio({
      titolo: annuncio.titolo,
      contenuto: annuncio.contenuto,
      published: annuncio.published
    })
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Gestione Notizie</h2>

      {/* Messaggi */}
      {message.text && (
        <div className={`p-4 rounded-xl border mb-6 ${
          message.type === 'success' 
            ? 'bg-green-500/20 border-green-500/30 text-green-100'
            : 'bg-red-500/20 border-red-500/30 text-red-100'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <div className="xl:col-span-1">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold mb-4">
              {editingAnnuncio ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Titolo <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formAnnuncio.titolo}
                  onChange={(e) => setFormAnnuncio(prev => ({ ...prev, titolo: e.target.value }))}
                  className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Titolo dell'annuncio"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">
                  Contenuto <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formAnnuncio.contenuto}
                  onChange={(e) => setFormAnnuncio(prev => ({ ...prev, contenuto: e.target.value }))}
                  className="w-full px-4 py-3 min-h-[120px] bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Contenuto dell'annuncio"
                  required
                />
              </div>
              
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
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold disabled:opacity-60"
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
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                  >
                    Annulla
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Lista Annunci */}
        <div className="xl:col-span-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-white/70">Caricamento annunci...</div>
            </div>
          ) : annunci.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-white/60">Nessun annuncio presente</div>
            </div>
          ) : (
            <div className="space-y-4">
              {annunci.map((annuncio) => (
                <div key={annuncio.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-white/90">{annuncio.titolo}</h3>
                      <p className="text-white/60 text-sm">
                        {timeAgo(annuncio.created_at)}
                      </p>
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
                      onClick={() => togglePublish(annuncio)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        annuncio.published
                          ? 'bg-yellow-500/20 text-yellow-100 border border-yellow-500/30 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-100 border border-green-500/30 hover:bg-green-500/30'
                      }`}
                    >
                      {annuncio.published ? 'Depubblica' : 'Pubblica'}
                    </button>
                    
                    <button
                      onClick={() => startEdit(annuncio)}
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