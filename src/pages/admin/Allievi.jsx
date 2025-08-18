import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../../lib/supabase.js'

export default function Allievi() {
  const [allievi, setAllievi] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAllievi()
  }, [])

  const loadAllievi = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('utenti')
      .select('*')
      .in('ruolo', ['allievo', 'insegnante'])
      .order('cognome')
    
    if (error) {
      console.error('Errore caricamento allievi:', error)
    } else {
      setAllievi(data || [])
    }
    setLoading(false)
  }

  const filteredAllievi = allievi.filter(allievo => 
    `${allievo.nome} ${allievo.cognome} ${allievo.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Gestione Allievi</h2>
        <div className="text-sm text-white/60">
          {filteredAllievi.length} di {allievi.length} allievi
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cerca per nome, cognome o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="text-white/70">Caricamento allievi...</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-white/70 border-b border-white/10">
              <tr>
                <th className="py-3 pr-4">Nome</th>
                <th className="py-3 pr-4">Cognome</th>
                <th className="py-3 pr-4">Email</th>
                <th className="py-3 pr-4">Ruolo</th>
                <th className="py-3 pr-4">Data Iscrizione</th>
                <th className="py-3 pr-4">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredAllievi.map((allievo) => (
                <tr key={allievo.auth_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 font-medium">{allievo.nome}</td>
                  <td className="py-3 pr-4 font-medium">{allievo.cognome}</td>
                  <td className="py-3 pr-4 text-white/70">{allievo.email}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      allievo.ruolo === 'insegnante' 
                        ? 'bg-blue-500/20 text-blue-100' 
                        : 'bg-green-500/20 text-green-100'
                    }`}>
                      {allievo.ruolo}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-white/70">
                    {allievo.data_iscrizione 
                      ? new Date(allievo.data_iscrizione).toLocaleDateString('it-IT')
                      : 'Non specificata'
                    }
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      to={`/admin/allievi/${allievo.auth_id}`}
                      className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 hover:bg-indigo-500/30 text-sm font-medium transition-colors"
                    >
                      Dettagli
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredAllievi.length === 0 && (
            <div className="text-center py-8 text-white/60">
              {searchTerm ? 'Nessun allievo trovato per la ricerca.' : 'Nessun allievo presente.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}