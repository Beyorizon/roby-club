import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase.js"

function DashboardFiglio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [allievo, setAllievo] = useState(null)
  const [corsi, setCorsi] = useState([])

  // Funzione per ottenere i corsi attivi dell'allievo
  const getActiveCourses = () => {
    if (!allievo || !corsi.length) return []
    
    const activeCourses = []
    for (let i = 1; i <= 5; i++) {
      const corsoId = allievo[`corso_${i}`]
      const prezzo = allievo[`prezzo_corso${i}`]
      
      if (corsoId && prezzo) {
        const corso = corsi.find(c => c.id === corsoId)
        if (corso) {
          activeCourses.push({
            numero: i,
            nome: corso.nome,
            prezzo: prezzo
          })
        }
      }
    }
    return activeCourses
  }

  useEffect(() => {
    const loadData = async () => {
      // Carica dati allievo
      const { data: allieveData } = await supabase
        .from("utenti")
        .select(`
          id, nome, cognome, data_nascita, cellulare, email, data_iscrizione,
          nome_genitore1, cellulare_genitore1,
          nome_genitore2, cellulare_genitore2,
          taglia_tshirt, taglia_pantalone, numero_scarpe,
          corso_1, corso_2, corso_3, corso_4, corso_5,
          prezzo_corso1, prezzo_corso2, prezzo_corso3, prezzo_corso4, prezzo_corso5
        `)
        .eq("id", id)
        .single()
      
      setAllievo(allieveData)
      
      // Carica corsi disponibili
      const { data: corsiData } = await supabase
        .from("corsi")
        .select("id, nome")
        .order('nome')
      
      setCorsi(corsiData || [])
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
          
          <div className="space-y-6">
            {/* Informazioni personali */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Informazioni personali</h2>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm">Nome completo</p>
                  <p className="text-white font-medium">{allievo.nome} {allievo.cognome}</p>
                </div>
                
                {allievo.email && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm">Email</p>
                    <p className="text-white font-medium">{allievo.email}</p>
                  </div>
                )}
                
                {allievo.data_iscrizione && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white/70 text-sm">Data iscrizione</p>
                    <p className="text-white font-medium">{new Date(allievo.data_iscrizione).toLocaleDateString('it-IT')}</p>
                  </div>
                )}
                
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
            
            {/* Taglie */}
            {(allievo.taglia_tshirt || allievo.taglia_pantalone || allievo.numero_scarpe) && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Taglie</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {allievo.taglia_tshirt && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/70 text-sm">Taglia T-shirt</p>
                      <p className="text-white font-medium">{allievo.taglia_tshirt}</p>
                    </div>
                  )}
                  
                  {allievo.taglia_pantalone && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/70 text-sm">Taglia pantalone</p>
                      <p className="text-white font-medium">{allievo.taglia_pantalone}</p>
                    </div>
                  )}
                  
                  {allievo.numero_scarpe && (
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-white/70 text-sm">Numero scarpe</p>
                      <p className="text-white font-medium">{allievo.numero_scarpe}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Corsi attivi */}
            {getActiveCourses().length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">Corsi attivi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getActiveCourses().map((course) => (
                    <div key={course.numero} className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-2">{course.nome}</h4>
                      <p className="text-indigo-400 font-medium">€{course.prezzo}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardFiglio
