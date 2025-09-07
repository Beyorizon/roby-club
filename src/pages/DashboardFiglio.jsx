import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase.js"
import { useAuth } from '../context/AuthProvider'

export default function DashboardFiglio() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [allievo, setAllievo] = useState(null)
  const [corsi, setCorsi] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

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
      setEditData({
        nome: allieveData?.nome || "",
        cognome: allieveData?.cognome || "",
        data_nascita: allieveData?.data_nascita || "",
        cellulare: allieveData?.cellulare || "",
        taglia_tshirt: allieveData?.taglia_tshirt || "",
        taglia_pantalone: allieveData?.taglia_pantalone || "",
        numero_scarpe: allieveData?.numero_scarpe || ""
      })
      
      // Carica corsi disponibili
      const { data: corsiData } = await supabase
        .from("corsi")
        .select("id, nome")
        .order('nome')
      
      setCorsi(corsiData || [])
    }
    if (id) loadData()
  }, [id])

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset ai dati originali se si annulla
      setEditData({
        nome: allievo?.nome || "",
        cognome: allievo?.cognome || "",
        data_nascita: allievo?.data_nascita || "",
        cellulare: allievo?.cellulare || "",
        taglia_tshirt: allievo?.taglia_tshirt || "",
        taglia_pantalone: allievo?.taglia_pantalone || "",
        numero_scarpe: allievo?.numero_scarpe || ""
      })
    }
    setIsEditing(!isEditing)
    setMessage("")
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { error } = await supabase
        .from('utenti')
        .update(editData)
        .eq('id', id)
      
      if (error) throw error
      
      setAllievo({ ...allievo, ...editData })
      setIsEditing(false)
      alert('Dati aggiornati con successo!')
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error)
      alert('Errore nell\'aggiornamento dei dati')
    } finally {
      setSaving(false)
    }
  }

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white">
              {allievo.nome} {allievo.cognome}
            </h1>
            <button
              onClick={isEditing ? handleSave : handleEditToggle}
              disabled={saving}
              className={`px-6 py-3 rounded-xl font-semibold transition-colors ${
                isEditing 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Salvando...' : isEditing ? 'Salva' : 'Modifica'}
            </button>
          </div>
          
          {isEditing && (
            <button
              onClick={handleEditToggle}
              className="mb-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Annulla
            </button>
          )}
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${
              message.includes('successo') 
                ? 'bg-green-500/20 text-green-200' 
                : 'bg-red-500/20 text-red-200'
            }`}>
              {message}
            </div>
          )}
            {/* Informazioni personali */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Informazioni personali</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Nome</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="nome"
                      value={editData.nome}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  ) : (
                    <p className="text-white font-medium">{allievo.nome}</p>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Cognome</p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="cognome"
                      value={editData.cognome}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  ) : (
                    <p className="text-white font-medium">{allievo.cognome}</p>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Data di nascita</p>
                  {isEditing ? (
                    <input
                      type="date"
                      name="data_nascita"
                      value={editData.data_nascita}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  ) : (
                    <p className="text-white font-medium">
                      {allievo.data_nascita ? new Date(allievo.data_nascita).toLocaleDateString('it-IT') : 'Non specificata'}
                    </p>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Cellulare</p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="cellulare"
                      value={editData.cellulare}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  ) : (
                    <p className="text-white font-medium">{allievo.cellulare || 'Non specificato'}</p>
                  )}
                </div>
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
            </div>
            
            {/* Taglie */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Taglie</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Taglia T-shirt</p>
                  {isEditing ? (
                    <select
                      name="taglia_tshirt"
                      value={editData.taglia_tshirt}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">Seleziona</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  ) : (
                    <p className="text-white font-medium">{allievo.taglia_tshirt || 'Non specificata'}</p>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Taglia pantalone</p>
                  {isEditing ? (
                    <select
                      name="taglia_pantalone"
                      value={editData.taglia_pantalone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="">Seleziona</option>
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                      <option value="XXL">XXL</option>
                    </select>
                  ) : (
                    <p className="text-white font-medium">{allievo.taglia_pantalone || 'Non specificata'}</p>
                  )}
                </div>
                
                <div className="bg-white/5 rounded-lg p-4">
                  <p className="text-white/70 text-sm mb-2">Numero scarpe</p>
                  {isEditing ? (
                    <input
                      type="number"
                      name="numero_scarpe"
                      value={editData.numero_scarpe}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  ) : (
                    <p className="text-white font-medium">{allievo.numero_scarpe || 'Non specificato'}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Sezione Corsi - Admin può editare, altri solo visualizzano */}
            {isAdmin ? (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">Gestione corsi (Admin)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="space-y-2">
                      <div>
                        <label className="block text-white/80 text-sm font-medium mb-2">
                          Corso {i}
                        </label>
                        <select
                          name={`corso_${i}`}
                          value={editData[`corso_${i}`] || allievo?.[`corso_${i}`] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
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
                          value={editData[`prezzo_corso${i}`] || allievo?.[`prezzo_corso${i}`] || ''}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          step="0.01"
                          min="0"
                          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Visualizzazione corsi per allievi/genitori */
              getActiveCourses().length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Corsi attivi</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getActiveCourses().map((course) => (
                      <div key={course.numero} className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-2">{course.nome}</h4>
                        <p className="text-indigo-400 font-medium">€{course.prezzo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
  )
}
