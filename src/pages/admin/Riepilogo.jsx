import React, { useEffect, useState } from 'react'
import { listCourses } from '../../lib/courses.api.js'
import { listUsers } from '../../lib/users.api.js'
import { listPayments } from '../../lib/payments.api.js'

const MESI_ACCADEMICO = [
  'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile',
  'Maggio', 'Giugno', 'Luglio', 'Agosto'
]

export default function Riepilogo() {
  const [stats, setStats] = useState({ totalGenitori: 0, totalAllievi: 0 })
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    anno: String(new Date().getFullYear()), // stringa coerente con il DB
    mese: '',
    corso: '',
    searchAllievo: ''
  })
  const [paymentData, setPaymentData] = useState([])
  const [corsi, setCorsi] = useState([])
  const [usersMap, setUsersMap] = useState({}) // Map id -> user
  const [kpiData, setKpiData] = useState({
    totaleIncassoIscrizioni: 0,
    totaleIncassoMensili: {},
    totaleIncassoAnnuale: 0,
    totaleNonIncassato: 0
  })

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    loadPaymentData()
  }, [filters, usersMap])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      // Load users
      const users = await listUsers()
      const uMap = {}
      users.forEach(u => uMap[u.id] = u)
      setUsersMap(uMap)

      const totalGenitori = users.filter(u => u.ruolo === 'genitore').length
      const totalAllievi = users.filter(u => u.ruolo === 'allievo').length
      setStats({ totalGenitori, totalAllievi })

      // Load courses
      const courses = await listCourses()
      const sortedCourses = courses.sort((a, b) => a.nome.localeCompare(b.nome))
      setCorsi(sortedCourses)

    } catch (error) {
      console.error('Errore caricamento dati iniziali:', error)
    }
    setLoading(false)
  }

  // Legacy loadStats removed as it is merged into loadInitialData
  const loadStats = async () => {} 
  const loadCorsi = async () => {}

  const loadPaymentData = async () => {
    if (Object.keys(usersMap).length === 0) return

    try {
      const filtersObj = {
        anno: filters.anno,
        mese: filters.mese,
        corso_id: filters.corso // listPayments uses corso_id
      }
      
      const payments = await listPayments(filtersObj)
      
      // Enrich with user data and filter by role 'allievo' as per original code
      let enrichedData = payments.map(p => ({
        ...p,
        utenti: usersMap[p.allievo_id] || {}
      })).filter(p => p.utenti.ruolo === 'allievo')

      // filtro ricerca per nome/cognome
      if (filters.searchAllievo) {
        enrichedData = enrichedData.filter(
          p =>
            `${p.utenti.nome || ''} ${p.utenti.cognome || ''}`
              .toLowerCase()
              .includes(filters.searchAllievo.toLowerCase())
        )
      }

      const filteredData = enrichedData

      // raggruppa i dati per allievo
      const groupedData = {}
      filteredData.forEach(payment => {
      if (!payment.allievo_id || !payment.utenti) return  // ignora pagamenti senza allievo collegato o senza utente
      const key = payment.allievo_id
      if (!groupedData[key]) {
        groupedData[key] = {
          id: payment.allievo_id,
          nome: payment.utenti ? payment.utenti.nome : 'N/D',
          cognome: payment.utenti ? payment.utenti.cognome : '',
          payments: {},
          totalePagato: 0,
          importoTotale: 0
        }
      }
        groupedData[key].payments[payment.mese] = payment
        if (payment.stato === 'pagato') {
          groupedData[key].totalePagato += payment.importo || 0
        }
        groupedData[key].importoTotale += payment.importo || 0
      })

      setPaymentData(Object.values(groupedData))

      // KPI

      // totale incasso iscrizioni
      const allPayments = await listPayments({ anno: filters.anno })
      const iscrizioni = allPayments.filter(p => 
        p.categoria === 'iscrizione' && p.stato === 'pagato'
      )

      const totaleIncassoIscrizioni =
        iscrizioni?.reduce((sum, p) => sum + (p.importo || 0), 0) || 0

      // solo pagamenti mensili validi
      const mensiliOnly = filteredData.filter(p =>
        MESI_ACCADEMICO.includes(p.mese)
      )

      // incassi mensili
      const totaleIncassoMensili = {}
      MESI_ACCADEMICO.forEach(meseNome => {
        const incassoMese = mensiliOnly
          .filter(p => p.mese === meseNome && p.stato === 'pagato')
          .reduce((sum, p) => sum + (p.importo || 0), 0)
        totaleIncassoMensili[meseNome] = incassoMese
      })

      // incasso annuale
      const totaleIncassoAnnuale = MESI_ACCADEMICO.reduce(
        (sum, meseNome) => sum + (totaleIncassoMensili[meseNome] || 0),
        0
      )

      // totale non incassato (solo mensili)
      const totaleNonIncassato = mensiliOnly
        .filter(p => p.stato !== 'pagato')
        .reduce((sum, p) => sum + (p.importo || 0), 0)

      setKpiData({
        totaleIncassoIscrizioni,
        totaleIncassoMensili,
        totaleIncassoAnnuale,
        totaleNonIncassato
      })
    } catch (error) {
      console.error('Errore caricamento dati pagamenti:', error)
    }
  }

  const exportCSV = () => {
    const headers = [
      'Nome',
      'Cognome',
      ...MESI_ACCADEMICO,
      'Totale Pagato',
      'Importo Totale'
    ]

    const rows = paymentData.map(allievo => {
      const row = [allievo.nome, allievo.cognome]
      MESI_ACCADEMICO.forEach(meseNome => {
        const payment = allievo.payments[meseNome]
        row.push(payment?.stato === 'pagato' ? '✓' : '✗')
      })
      row.push(`€${allievo.totalePagato.toFixed(2)}`)
      row.push(`€${allievo.importoTotale.toFixed(2)}`)
      return row
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `riepilogo_pagamenti_${filters.anno}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30">
          <div className="text-blue-100 text-sm font-medium">
            Numero Genitori
          </div>
          <div className="text-3xl font-bold text-white mt-2">
            {stats.totalGenitori}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 p-6 rounded-xl border border-green-500/30">
          <div className="text-green-100 text-sm font-medium">
            Numero Allievi
          </div>
          <div className="text-3xl font-bold text-white mt-2">
            {stats.totalAllievi}
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4">Filtri Pagamenti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Anno
            </label>
            <select
              value={filters.anno}
              onChange={e =>
                setFilters(prev => ({ ...prev, anno: e.target.value }))
              }
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={String(year)}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Mese
            </label>
            <select
              value={filters.mese}
              onChange={e =>
                setFilters(prev => ({ ...prev, mese: e.target.value }))
              }
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti i mesi</option>
              {MESI_ACCADEMICO.map(month => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Corso
            </label>
            <select
              value={filters.corso}
              onChange={e =>
                setFilters(prev => ({ ...prev, corso: e.target.value }))
              }
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti i corsi</option>
              {corsi.map(corso => (
                <option key={corso.id} value={corso.id}>
                  {corso.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Cerca Allievo
            </label>
            <input
              type="text"
              placeholder="Nome o cognome..."
              value={filters.searchAllievo}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  searchAllievo: e.target.value
                }))
              }
              className="w-full px-3 py-2 bg-transparent border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 p-6 rounded-xl border border-emerald-500/30">
          <div className="text-emerald-100 text-sm font-medium">
            Totale Incasso Iscrizioni
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            €{kpiData.totaleIncassoIscrizioni.toFixed(2)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 p-6 rounded-xl border border-blue-500/30">
          <div className="text-blue-100 text-sm font-medium">
            Totale Incassi Annuale
          </div>
          <div className="text-blue-100 text-xs">(Set-Ago)</div>
          <div className="text-2xl font-bold text-white mt-2">
            €{kpiData.totaleIncassoAnnuale.toFixed(2)}
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 p-6 rounded-xl border border-red-500/30">
          <div className="text-red-100 text-sm font-medium">
            Totale Non Ancora Incassato
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            €{kpiData.totaleNonIncassato.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Totali Mensili */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold mb-4">
          Totale Incassi Mensili Diviso per Mese
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {MESI_ACCADEMICO.map(meseNome => {
            const incasso = kpiData.totaleIncassoMensili[meseNome] || 0
            return (
              <div
                key={meseNome}
                className="bg-white/5 p-4 rounded-lg text-center"
              >
                <div className="text-white/70 text-sm font-medium">
                  {meseNome.substring(0, 3)}
                </div>
                <div className="text-lg font-bold text-white mt-1">
                  €{incasso.toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabella */}
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
                {MESI_ACCADEMICO.map(meseNome => (
                  <th
                    key={meseNome}
                    className="py-3 pr-2 text-center"
                  >
                    {meseNome.substring(0, 3)}
                  </th>
                ))}
                <th className="py-3 pr-4 text-right">Tot. Pagato</th>
                <th className="py-3 pr-4 text-right">Tot. Dovuto</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.map(allievo => (
                <tr
                  key={allievo.id}
                  className="border-b border-white/5 hover:bg-white/5"
                >
                  <td className="py-3 pr-4 font-medium">
                    {allievo.nome}
                  </td>
                  <td className="py-3 pr-4 font-medium">
                    {allievo.cognome}
                  </td>
                  {MESI_ACCADEMICO.map(meseNome => {
                    const payment = allievo.payments[meseNome]
                    return (
                      <td
                        key={meseNome}
                        className="py-3 pr-2 text-center"
                      >
                        <span
                          className={`inline-block w-6 h-6 rounded-full text-xs leading-6 ${
                            payment?.stato === 'pagato'
                              ? 'bg-green-500 text-white'
                              : payment
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-400 text-white'
                          }`}
                        >
                          {payment?.stato === 'pagato'
                            ? '✓'
                            : payment
                            ? '✗'
                            : '-'}
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
    </div>
  )
}
