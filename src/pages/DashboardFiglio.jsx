import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase.js"

function DashboardFiglio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [allievo, setAllievo] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase
        .from("utenti")
        .select("*")
        .eq("id", id)
        .single()
      setAllievo(data)
    }
    if (id) loadData()
  }, [id])

  if (!allievo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            ← Torna indietro
          </button>
          <div className="text-white">Caricamento dati figlio...</div>
        </div>
      </div>
    )
  }

  // Riutilizza la dashboard allievo ma passando i dati del figlio
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="max-w-6xl mx-auto p-6">
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
        >
          ← Torna indietro
        </button>
        
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6">
            {allievo.nome} {allievo.cognome}
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Informazioni personali</h2>
              
              <div className="bg-white/5 rounded-lg p-4">
                <p className="text-white/70 text-sm">Nome completo</p>
                <p className="text-white font-medium">{allievo.nome} {allievo.cognome}</p>
              </div>
              
              {allievo.data_nascita && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Data di nascita</p>
                  <p className="text-white font-medium">{new Date(allievo.data_nascita).toLocaleDateString('it-IT')}</p>
                </div>
              )}
              
              {allievo.cellulare && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Cellulare</p>
                  <p className="text-white font-medium">{allievo.cellulare}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Contatti genitori</h2>
              
              {allievo.nome_genitore1 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Genitore 1</p>
                  <p className="text-white font-medium">{allievo.nome_genitore1}</p>
                  {allievo.cellulare_genitore1 && (
                    <p className="text-white/60 text-sm">{allievo.cellulare_genitore1}</p>
                  )}
                </div>
              )}
              
              {allievo.nome_genitore2 && (
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Genitore 2</p>
                  <p className="text-white font-medium">{allievo.nome_genitore2}</p>
                  {allievo.cellulare_genitore2 && (
                    <p className="text-white/60 text-sm">{allievo.cellulare_genitore2}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardFiglio
