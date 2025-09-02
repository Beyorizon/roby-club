import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { supabase } from '../lib/supabase.js'

function DashboardGenitore() {
  const { user } = useAuth()
  const [tab, setTab] = useState("profilo")
  const [genitore, setGenitore] = useState(null)
  const [figli, setFigli] = useState([])
  const [pagamenti, setPagamenti] = useState([])
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

  useEffect(() => {
    if (!user?.id) return
    const loadData = async () => {
      const { data: g } = await supabase
        .from('genitori')
        .select('*')
        .eq('auth_id', user.id)
        .single()
      setGenitore(g)
      
      if (g) {
        setFormData({
          nome: g.nome || "",
          cognome: g.cognome || "",
          email: g.email || "",
          telefono: g.telefono || ""
        })
        
        const { data: f } = await supabase
          .from('utenti')
          .select('id, nome, cognome, data_nascita')
          .eq('genitore_id', g.id)
        setFigli(f || [])
        
        const { data: pays } = await supabase
          .from('pagamenti')
          .select('*')
          .eq('genitore_id', g.id)
        setPagamenti(pays || [])
      }
    }
    loadData()
  }, [user?.id])

  // Salvataggio profilo genitore
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setMessage({ type: "", text: "" })

      const { error } = await supabase
        .from('genitori')
        .update(formData)
        .eq('auth_id', user.id)

      if (error) {
        console.error(error)
        setMessage({ type: "error", text: "Errore nel salvataggio" })
        return
      }

      setMessage({ type: "success", text: "Profilo aggiornato!" })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Benvenuto {genitore?.nome} {genitore?.cognome}
        </h1>

        {/* NAV TABS */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab("profilo")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "profilo" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70"}`}>
            Profilo
          </button>
          <button onClick={() => setTab("mensile")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "mensile" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70"}`}>
            Mensile
          </button>
          <button onClick={() => setTab("pagamenti")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "pagamenti" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70"}`}>
            Pagamenti
          </button>
          <button onClick={() => setTab("figli")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "figli" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70"}`}>
            Figli
          </button>
        </div>

        {/* TAB PROFILO */}
        {tab === "profilo" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-6">Il mio profilo</h2>

            {message.text && (
              <div className={`mb-4 p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-red-500/20 text-red-300 border border-red-500/30"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Nome *</label>
                  <input type="text" name="nome" value={formData.nome || ""}
                    onChange={handleInputChange} placeholder="Inserisci il tuo nome"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Cognome *</label>
                  <input type="text" name="cognome" value={formData.cognome || ""}
                    onChange={handleInputChange} placeholder="Inserisci il tuo cognome"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Email</label>
                  <input type="email" name="email" value={formData.email || ""}
                    onChange={handleInputChange} placeholder="Inserisci la tua email"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Telefono</label>
                  <input type="tel" name="telefono" value={formData.telefono || ""}
                    onChange={handleInputChange} placeholder="Inserisci il tuo telefono"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
              </div>

              <button type="submit" disabled={saving}
                className="mt-6 w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold">
                {saving ? "Salvando..." : "Salva modifiche"}
              </button>
            </form>
          </div>
        )}

        {/* TAB MENSILE */}
        {tab === "mensile" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">Pagamenti mensili</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {["Settembre","Ottobre","Novembre","Dicembre",
                "Gennaio","Febbraio","Marzo","Aprile",
                "Maggio","Giugno","Luglio","Agosto"].map(mese => {
                const pagamento = pagamenti.find(p => p.categoria === "mensile" && p.mese === mese)
                return (
                  <div key={mese} className={`px-4 py-3 rounded-lg text-sm ${
                    pagamento?.stato === "pagato"
                      ? "bg-green-500 text-white"
                      : pagamento?.stato === "scaduto"
                      ? "bg-red-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}>
                    {mese} – {pagamento?.stato || "non dovuto"}
                  </div>
                )
              })}
            </div>
            <h3 className="text-xl font-semibold text-white mt-6">Iscrizione</h3>
            {pagamenti.find(p => p.categoria === "iscrizione") ? (
              <p className={`font-semibold ${
                pagamenti.find(p => p.categoria === "iscrizione").stato === "pagato"
                  ? "text-green-400" : "text-red-400"
              }`}>
                {pagamenti.find(p => p.categoria === "iscrizione").stato === "pagato" ? "Pagata" : "Non pagata"}
                – €{pagamenti.find(p => p.categoria === "iscrizione").importo}
              </p>
            ) : (
              <p className="text-white/70">Nessun pagamento registrato</p>
            )}
          </div>
        )}

        {/* TAB PAGAMENTI */}
        {tab === "pagamenti" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 space-y-6">
            <h2 className="text-2xl font-semibold text-white">Pagamenti Extra</h2>

            {/* Saggio */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Quota Saggio</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Tranche 1","Tranche 2","Tranche 3","Tranche 4"].map((label,i) => {
                  const pagamento = pagamenti.find(p => p.categoria === "saggio" && p.tranche === i+1)
                  return (
                    <div key={i} className={`px-4 py-3 rounded-lg text-sm ${
                      pagamento?.stato === "pagato"
                        ? "bg-green-500 text-white"
                        : pagamento?.stato === "scaduto"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}>
                      {label} – {pagamento?.stato || "non dovuta"}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vestiti */}
            <div>
              <h3 className="text-xl font-semibold text-white mt-6">Vestiti e Accessori</h3>
              {pagamenti.filter(p => p.categoria === "vestiti").length > 0 ? (
                <ul className="space-y-2">
                  {pagamenti.filter(p => p.categoria === "vestiti").map(p => (
                    <li key={p.id} className="text-white/80">
                      {p.descrizione || "Acquisto"} – €{p.importo} – {p.stato}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-white/70">Nessun pagamento registrato</p>
              )}
            </div>
          </div>
        )}

        {/* TAB FIGLI */}
        {tab === "figli" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">I tuoi figli</h2>
            {figli.length === 0 ? (
              <p className="text-white/70">Nessun figlio registrato</p>
            ) : (
              <ul className="space-y-3">
                {figli.map(f => (
                  <li key={f.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-white">{f.nome} {f.cognome} ({f.data_nascita})</span>
                    <Link to={`/figlio/${f.id}`} className="text-indigo-400 hover:text-indigo-300">Dettagli</Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6">
              <Link to="/aggiungi-figlio" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">+ Aggiungi figlio</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardGenitore
