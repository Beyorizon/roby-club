import React, { useEffect, useState } from 'react'
import supabase from '../lib/supabase.js'

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }
  return date.toLocaleDateString('it-IT', options)
}

export default function Notizie() {
  const [notizie, setNotizie] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotizie = async () => {
      try {
        const { data, error } = await supabase
          .from('annunci')
          .select('id, titolo, contenuto, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Errore caricamento notizie:', error)
        } else {
          setNotizie(data || [])
        }
      } catch (err) {
        console.error('Errore caricamento notizie:', err)
      } finally {
        setLoading(false)
      }
    }

    loadNotizie()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4 pb-24">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Annunci</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            <p className="text-white/70">Caricamento notizie...</p>
          </div>
        ) : notizie.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-white/70 text-lg">Nessuna notizia disponibile al momento.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {notizie.map((notizia) => (
              <div 
                key={notizia.id} 
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
              >
                <h2 className="text-xl font-semibold text-white mb-2">
                  {notizia.titolo}
                </h2>
                <p className="text-indigo-300 text-sm mb-4">
                  {formatDate(notizia.created_at)}
                </p>
                <div className="text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                  {notizia.contenuto}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}