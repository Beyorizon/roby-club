import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthProvider'

export default function Allievi() {
  const { isAdmin, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [allievi, setAllievi] = useState([])
  const [corsi, setCorsi] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCorso, setSelectedCorso] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTimeout, setSearchTimeout] = useState(null)
  
  const pageSize = 20

  // Verifica permessi admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAdmin, authLoading, navigate])

  // Carica corsi disponibili
  const loadCorsi = async () => {
    try {
      const { data, error } = await supabase
        .from('corsi')
        .select('id, nome')
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

  // Funzione per caricare gli allievi con paginazione, ricerca e filtro corso
const loadAllievi = useCallback(async (searchQuery = '', corsoFilter = '', tipoFilter = '', currentPage = 1) => {
    setListLoading(true)
    setError('')
    try {
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('utenti')
        .select('id, auth_id, ruolo, nome, cognome, genitore_id', { count: 'exact' })
        .order('cognome')
        .order('nome')
        .range(from, to)

      // Filtro per ricerca nome/cognome
      if (searchQuery.trim()) {
        const q = searchQuery.trim()
        query = query.or(`nome.ilike.%${q}%,cognome.ilike.%${q}%`)
      }

      // Filtro per corso
      if (corsoFilter) {
        query = query.or(`corso_1.eq.${corsoFilter},corso_2.eq.${corsoFilter},corso_3.eq.${corsoFilter},corso_4.eq.${corsoFilter},corso_5.eq.${corsoFilter}`)
      }
      
      // Filtro per tipo (ruolo)
      if (tipoFilter) {
        query = query.eq('ruolo', tipoFilter)
      }

      const { data, error: queryError, count } = await query

      if (queryError) {
        console.error('[supabase] allievi fetch error:', queryError?.message || queryError?.code || 'unknown')
        setError(`Errore nel caricamento degli allievi: ${queryError.message}`)
        setAllievi([])
        setTotalCount(0)
      } else {
        setAllievi(data || [])
        setTotalCount(count || 0)
        setError('')
      }
    } catch (err) {
      console.error('[allievi] load error:', err?.message || 'unknown')
      setError('Errore critico durante il caricamento')
      setAllievi([])
      setTotalCount(0)
    } finally {
      setListLoading(false)
    }
  }, [pageSize])

  // Caricamento iniziale
  useEffect(() => {
    loadCorsi()
    loadAllievi('', '', '', 1)
  }, [])

  // Gestione ricerca con debounce (300ms)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      setPage(1) // Reset alla prima pagina quando si cerca
      loadAllievi(searchTerm, selectedCorso, selectedTipo, 1)
    }, 300)
    
    setSearchTimeout(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchTerm, selectedCorso, selectedTipo, loadAllievi])

  // Gestione cambio pagina
  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadAllievi(searchTerm, selectedCorso, selectedTipo, newPage)
  }

  // Gestione clic su riga allievo
  const handleAllieveClick = (allievo) => {
    const isChild = allievo.ruolo === 'allievo' && allievo.genitore_id
    navigate(isChild ? `/admin/allievi/${allievo.genitore_id}` : `/admin/allievi/${allievo.id}`)
  }

  // Calcolo paginazione
  const totalPages = Math.ceil(totalCount / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, totalCount)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Gestione Allievi</h2>
        <div className="text-sm text-white/60">
          {totalCount > 0 ? (
           searchTerm || selectedCorso || selectedTipo ? 
              `${allievi.length} risultati di ${totalCount} utenti` :
              `${startItem}-${endItem} di ${totalCount} utenti`
          ) : (
            '0 utenti'
          )}
        </div>
      </div>

{/* Pulsanti filtro tipo */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setSelectedTipo('')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTipo === '' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Tutti
        </button>
        <button
          onClick={() => setSelectedTipo('allievo')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTipo === 'allievo' 
              ? 'bg-green-600 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Allievi
        </button>
        <button
          onClick={() => setSelectedTipo('genitore')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTipo === 'genitore' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/10 text-white/70 hover:bg-white/20'
          }`}
        >
          Genitori
        </button>
      </div>
      
      {/* Barra di ricerca e filtri */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Cerca per nome o cognome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <select
          value={selectedCorso}
          onChange={(e) => setSelectedCorso(e.target.value)}
          className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-w-[200px]"
        >
          <option value="">Tutti i corsi</option>
          {corsi.map(corso => (
            <option key={corso.id} value={corso.id}>
              {corso.nome}
            </option>
          ))}
        </select>
      </div>

      {/* Stato di errore */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {/* Stato di caricamento */}
      {listLoading ? (
        <div className="text-center py-12">
          <div className="text-white/70 text-lg">Caricamento allievi...</div>
        </div>
      ) : (
        <>
          {/* Legenda */}
          {allievi.some(a => a.ruolo === 'allievo' && a.genitore_id) && (
            <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-amber-500/20 border border-amber-400/30 rounded"></div>
                <span>Allievo collegato a genitore</span>
              </div>
            </div>
          )}

          {/* Tabella allievi semplificata */}
          {allievi.length > 0 ? (
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr className="text-white/70 border-b border-white/10">
                      <th className="py-4 px-6 font-medium">Nome</th>
                      <th className="py-4 px-6 font-medium">Cognome</th>
                      <th className="py-4 px-6 font-medium">Tipo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allievi.map((allievo) => (
                      <tr 
                        key={allievo.id} 
                        className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${
                          allievo.ruolo === 'allievo' && allievo.genitore_id ? 'bg-amber-500/10 border-amber-400/30' : ''
                        }`}
                        onClick={() => handleAllieveClick(allievo)}
                      >
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">
                            {allievo.nome}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">
                            {allievo.cognome}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-white">
                          {allievo.ruolo === "genitore" ? "Genitore" : (allievo.genitore_id ? "Allievo G" : "Allievo")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginazione */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-t border-white/10">
                  <div className="text-sm text-white/60">
                    Pagina {page} di {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                    >
                      Precedente
                    </button>
                    
                    {/* Numeri pagina */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              pageNum === page
                                ? 'bg-indigo-500 text-white'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm transition-colors"
                    >
                      Successiva
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Stato vuoto */
            <div className="text-center py-12">
              <div className="text-white/60 text-lg mb-2">
                {searchTerm || selectedCorso ? 'Nessun allievo trovato' : 'Nessun allievo presente'}
              </div>
              {(searchTerm || selectedCorso) && (
                <div className="text-white/40 text-sm">
                  Prova a modificare i filtri di ricerca
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}