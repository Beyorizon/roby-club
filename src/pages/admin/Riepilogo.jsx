import React, { useEffect, useState } from 'react'
import supabase from '../../lib/supabase.js'

export default function Riepilogo() {
  const [stats, setStats] = useState({
    totalUtenti: 0,
    totalAllievi: 0,
    totalInsegnanti: 0,
    totalAdmin: 0,
    totalAnnunci: 0,
    annunciPubblicati: 0,
    totalCorsi: 0,
    totalIscrizioni: 0
  })
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState([])
  const [filters, setFilters] = useState({
    anno: new Date().getFullYear(),
    mese: '',
    corso: '',
    searchAllievo: ''
  })
  const [paymentData, setPaymentData] = useState([])
  const [corsi, setCorsi] = useState([])
  const [kpiData, setKpiData] = useState({
    totaleIncassato: 0,
    numeroPagati: 0,
    numeroNonPagati: 0,
    percentualePagati: 0
  })

  useEffect(() => {
    loadStats()
    loadRecentActivity()
    loadCorsi()
  }, [])

  useEffect(() => {
    loadPaymentData()
  }, [filters])

  const loadStats = async () => {
    try {
      // Conta utenti per ruolo
      const { data: utenti } = await supabase
        .from('utenti')
        .select('ruolo')
      
      // Conta annunci
      const { data: annunci } = await supabase
        .from('annunci')
        .select('published')
      
      // Conta corsi
      const { count: totalCorsi } = await supabase
        .from('corsi')
        .select('*', { count: 'exact', head: true })
      
      // Conta iscrizioni
      const { count: totalIscrizioni } = await supabase
        .from('iscrizioni')
        .select('*', { count: 'exact', head: true })
      
      const totalUtenti = utenti?.length || 0
      const totalAllievi = utenti?.filter(u => u.ruolo === 'allievo').length || 0
      const totalInsegnanti = utenti?.filter(u => u.ruolo === 'insegnante').length || 0
      const totalAdmin = utenti?.filter(u => u.ruolo === 'admin').length || 0
      
      const totalAnnunci = annunci?.length || 0
      const annunciPubblicati = annunci?.filter(a => a.published).length || 0
      
      setStats({
        totalUtenti,
        totalAllievi,
        totalInsegnanti,
        totalAdmin,
        totalAnnunci,
        annunciPubblicati,
        totalCorsi: totalCorsi || 0,
        totalIscrizioni: totalIscrizioni || 0
      })
    } catch (error) {
      console.error('Errore caricamento statistiche:', error)
    }
    
    setLoading(false)
  }

  const loadCorsi = async () => {
    try {
      const { data } = await supabase
        .from('corsi')
        .select('*')
        .order('nome')
      
      setCorsi(data || [])
    } catch (error) {
      console.error('Errore caricamento corsi:', error)
    }
  }

  const loadPaymentData = async () => {
    try {
      let query = supabase
        .from('pagamenti')
        .select(`
          *,
          utenti!inner(nome, cognome, ruolo),
          corsi(nome)
        `)
        .eq('anno', filters.anno)
        .eq('utenti.ruolo', 'allievo')
      
      if (filters.mese) {
        query = query.eq('mese', parseInt(filters.mese))
      }
      
      if (filters.corso) {
        query = query.eq('corso_id', parseInt(filters.corso))
      }
      
      const { data } = await query
      
      let filteredData = data || []
      
      if (filters.searchAllievo) {
        filteredData = filteredData.filter(p => 
          `${p.utenti.nome} ${p.utenti.cognome}`
            .toLowerCase()
            .includes(filters.searchAllievo.toLowerCase())
        )
      }
      
      // Raggruppa per allievo
      const groupedData = {}
      filteredData.forEach(payment => {
        const key = payment.auth_id
        if (!groupedData[key]) {
          groupedData[key] = {
            auth_id: payment.auth_id,
            nome: payment.utenti.nome,
            cognome: payment.utenti.cognome,
            payments: {},
            totalePagato: 0,
            importoTotale: 0
          }
        }
        
        groupedData[key].payments[payment.mese] = payment
        if (payment.pagato) {
          groupedData[key].totalePagato += payment.importo || 0
        }
        groupedData[key].importoTotale += payment.importo || 0
      })
      
      setPaymentData(Object.values(groupedData))
      
      // Calcola KPI
      const totaleIncassato = filteredData
        .filter(p => p.pagato)
        .reduce((sum, p) => sum + (p.importo || 0), 0)
      
      const numeroPagati = filteredData.filter(p => p.pagato).length
      const numeroNonPagati = filteredData.filter(p => !p.pagato).length
      const percentualePagati = filteredData.length > 0 
        ? (numeroPagati / filteredData.length) * 100 
        : 0
      
      setKpiData({
        totaleIncassato,
        numeroPagati,
        numeroNonPagati,
        percentualePagati
      })
      
    } catch (error) {
      console.error('Errore caricamento dati pagamenti:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      // Ultimi utenti registrati
      const { data: nuoviUtenti } = await supabase
        .from('utenti')
        .select('nome, cognome, created_at, ruolo')
        .order('created_at', { ascending: false })
        .limit(5)
      
      // Ultimi annunci
      const { data: ultimiAnnunci } = await supabase
        .from('annunci')
        .select('titolo, created_at, published')
        .order('created_at', { ascending: false })
        .limit(5)
      
      const activity = []
      
      nuoviUtenti?.forEach(utente => {
        activity.push({
          type: 'user',
          message: `Nuovo ${utente.ruolo}: ${utente.nome} ${utente.cognome}`,
          timestamp: utente.created_at
        })
      })
      
      ultimiAnnunci?.forEach(annuncio => {
        activity.push({
          type: 'announcement',
          message: `${annuncio.published ? 'Pubblicato' : 'Creato'} annuncio: ${annuncio.titolo}`,
          timestamp: annuncio.created_at
        })
      })
      
      // Ordina per timestamp
      activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setRecentActivity(activity.slice(0, 10))
    } catch (error) {
      console.error('Errore caricamento attività recente:', error)
    }
  }

  const exportCSV = () => {
    const headers = ['Nome', 'Cognome', 'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic', 'Totale Pagato', 'Importo Totale']
    
    const rows = paymentData.map(allievo => {
      const row = [allievo.nome, allievo.cognome]
      
      // Aggiungi stato pagamenti per ogni mese
      for (let mese = 1; mese <= 12; mese++) {
        const payment = allievo.payments[mese]
        row.push(payment?.pagato ? '✓' : '✗')
      }
      
      row.push(`€${allievo.totalePagato.toFixed(2)}`)
      row.push(`€${allievo.importoTotale.toFixed(2)}`)
      
      return row
    })
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `riepilogo_pagamenti_${filters.anno}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const monthNames = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <div className="text-white/70">Caricamento statistiche...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Riepilogo</h2>

      {/* Statistiche Principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30">
          <div className="text-blue-100 text-sm font-medium">Totale Utenti</div>
          <div className="text-3xl font-bold text-white mt-2">{stats.totalUtenti}</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-500/30">
          <div className="text-green-100 text-sm font-medium">Allievi</div>
          <div className="text-3xl font-bold text-white mt-2">{stats.totalAllievi}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-xl border border-purple-500/30">
          <div className="text-purple-100 text-sm font-medium">Insegnanti</div>
          <div className="text-3xl font-bold text-white mt-2">{stats.totalInsegnanti}</div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 p-6 rounded-xl border border-orange-500/30">
          <div className="text-orange-100 text-sm font-medium">Admin</div>
          <div className="text-3xl font-bold text-white mt-2">{stats.totalAdmin}</div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4">Filtri Pagamenti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">Anno</label>
            <select
              value={filters.anno}
              onChange={(e) => setFilters(prev => ({ ...prev, anno: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-white/60 mb-1">Mese</label>
            <select
              value={filters.mese}
              onChange={(e) => setFilters(prev => ({ ...prev, mese: e.target.value }))}
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti i mesi</option>
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-white/60 mb-1">Corso</label>
            <select
              value={filters.corso}
              onChange={(e) => setFilters(prev => ({ ...prev, corso: e.target.value }))}
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti i corsi</option>
              {corsi.map(corso => (
                <option key={corso.id} value={corso.id}>{corso.nome}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-white/60 mb-1">Cerca Allievo</label>
            <input
              type="text"
              placeholder="Nome o cognome..."
              value={filters.searchAllievo}
              onChange={(e) => setFilters(prev => ({ ...prev, searchAllievo: e.target.value }))}
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-6 rounded-xl border border-emerald-500/30">
          <div className="text-emerald-100 text-sm font-medium">Totale Incassato</div>
          <div className="text-2xl font-bold text-white mt-2">€{kpiData.totaleIncassato.toFixed(2)}</div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30">
          <div className="text-blue-100 text-sm font-medium">N. Pagati</div>
          <div className="text-2xl font-bold text-white mt-2">{kpiData.numeroPagati}</div>
        </div>
        
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-6 rounded-xl border border-red-500/30">
          <div className="text-red-100 text-sm font-medium">N. Non Pagati</div>
          <div className="text-2xl font-bold text-white mt-2">{kpiData.numeroNonPagati}</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 p-6 rounded-xl border border-purple-500/30">
          <div className="text-purple-100 text-sm font-medium">% Pagati</div>
          <div className="text-2xl font-bold text-white mt-2">{kpiData.percentualePagati.toFixed(1)}%</div>
        </div>
      </div>

      {/* Tabella Pagamenti */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tabella Pagamenti</h3>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition-colors font-semibold"
          >
            Esporta CSV
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-white/70 border-b border-white/10">
              <tr>
                <th className="py-3 pr-4">Nome</th>
                <th className="py-3 pr-4">Cognome</th>
                {monthNames.map(month => (
                  <th key={month} className="py-3 pr-2 text-center">{month}</th>
                ))}
                <th className="py-3 pr-4 text-right">Tot. Pagato</th>
                <th className="py-3 pr-4 text-right">Tot. Dovuto</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.map((allievo) => (
                <tr key={allievo.auth_id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 pr-4 font-medium">{allievo.nome}</td>
                  <td className="py-3 pr-4 font-medium">{allievo.cognome}</td>
                  {monthNames.map((_, index) => {
                    const mese = index + 1
                    const payment = allievo.payments[mese]
                    return (
                      <td key={mese} className="py-3 pr-2 text-center">
                        <span className={`inline-block w-6 h-6 rounded-full text-xs leading-6 ${
                          payment?.pagato 
                            ? 'bg-green-500 text-white' 
                            : payment 
                            ? 'bg-red-500 text-white' 
                            : 'bg-gray-400 text-white'
                        }`}>
                          {payment?.pagato ? '✓' : payment ? '✗' : '-'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="py-3 pr-4 text-right font-medium text-green-400">
                    €{allievo.totalePagato.toFixed(2)}
                  </td>
                  <td className="py-3 pr-4 text-right font-medium text-white/70">
                    €{allievo.importoTotale.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paymentData.length === 0 && (
            <div className="text-center py-8 text-white/60">
              Nessun dato di pagamento trovato per i filtri selezionati.
            </div>
          )}
        </div>
      </div>

      {/* Attività Recente */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4">Attività Recente</h3>
        
        {recentActivity.length === 0 ? (
          <div className="text-white/60 text-center py-4">
            Nessuna attività recente
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'user' ? 'bg-blue-400' : 'bg-green-400'
                }`}></div>
                <div className="flex-1">
                  <div className="text-white/90">{activity.message}</div>
                  <div className="text-white/60 text-sm">
                    {new Date(activity.timestamp).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}