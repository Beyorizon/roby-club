import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import { useAuth } from '../../context/AuthProvider'

export default function Allievi() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [allievi, setAllievi] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTimeout, setSearchTimeout] = useState(null)
  
  const pageSize = 20

  // Verifica permessi admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAdmin, navigate])

  // Funzione per caricare gli allievi con paginazione e ricerca
  const loadAllievi = useCallback(async (searchQuery = '', currentPage = 1) => {
    setLoading(true)
    setError('')
    
    try {
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      
      let query = supabase
        .from('utenti')
        .select('id, auth_id, nome, cognome, email, ruolo, data_iscrizione', { count: 'exact' })
        .eq('ruolo', 'allievo')
        .order('cognome')
        .order('nome')
        .range(from, to)
      
      // Applica filtro di ricerca se presente
      if (searchQuery.trim()) {
        const q = searchQuery.trim()
        query = query.or(`nome.ilike.%${q}%,cognome.ilike.%${q}%,email.ilike.%${q}%`)
      }
      
      const { data, error: queryError, count } = await query
      
      if (queryError) {
        console.error('❌ Errore caricamento allievi:', queryError)
        console.error('Dettagli errore Supabase:', {
          message: queryError.message,
          details: queryError.details,
          hint: queryError.hint,
          code: queryError.code
        })
        setError(`Errore nel caricamento degli allievi: ${queryError.message}`)
        setAllievi([])
        setTotalCount(0)
      } else {
        console.log('✅ Allievi caricati:', data?.length || 0)
        setAllievi(data || [])
        setTotalCount(count || 0)
        setError('')
      }
    } catch (err) {
      console.error('💥 Errore critico caricamento allievi:', err)
      setError('Errore critico durante il caricamento')
      setAllievi([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  // Caricamento iniziale
  useEffect(() => {
    loadAllievi('', 1)
  }, [])

  // Gestione ricerca con debounce (300ms)
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      setPage(1) // Reset alla prima pagina quando si cerca
      loadAllievi(searchTerm, 1)
    }, 300)
    
    setSearchTimeout(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [searchTerm, loadAllievi])

  // Gestione cambio pagina
  const handlePageChange = (newPage) => {
    setPage(newPage)
    loadAllievi(searchTerm, newPage)
  }

  // Gestione clic su riga allievo
  const handleAllieveClick = (allievo) => {
    navigate(`/admin/allievi/${allievo.id}`)
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
            searchTerm ? 
              `${allievi.length} risultati di ${totalCount} allievi` :
              `${startItem}-${endItem} di ${totalCount} allievi`
          ) : (
            '0 allievi'
          )}
        </div>
      </div>

      {/* Barra di ricerca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cerca per nome, cognome o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Stato di errore */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
          {error}
        </div>
      )}

      {/* Stato di caricamento */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-white/70 text-lg">Caricamento allievi...</div>
        </div>
      ) : (
        <>
          {/* Tabella allievi */}
          {allievi.length > 0 ? (
            <div className="bg-white/5 rounded-xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5">
                    <tr className="text-white/70 border-b border-white/10">
                      <th className="py-4 px-6 font-medium">Nome Completo</th>
                      <th className="py-4 px-6 font-medium">Email</th>
                      <th className="py-4 px-6 font-medium">Data Iscrizione</th>
                      <th className="py-4 px-6 font-medium">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allievi.map((allievo) => (
                      <tr 
                        key={allievo.id} 
                        className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => handleAllieveClick(allievo)}
                      >
                        <td className="py-4 px-6">
                          <div className="text-white font-medium">
                            {allievo.cognome} {allievo.nome}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white/70 text-sm">
                            {allievo.email}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-white/70 text-sm">
                            {allievo.data_iscrizione 
                              ? new Date(allievo.data_iscrizione).toLocaleDateString('it-IT')
                              : 'Non specificata'
                            }
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <Link
                            to={`/admin/allievi/${allievo.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-100 border border-indigo-500/30 hover:bg-indigo-500/30 text-sm font-medium transition-colors"
                          >
                            Dettagli
                          </Link>
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
                {searchTerm ? 'Nessun allievo trovato' : 'Nessun allievo presente'}
              </div>
              {searchTerm && (
                <div className="text-white/40 text-sm">
                  Prova a modificare i termini di ricerca
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}