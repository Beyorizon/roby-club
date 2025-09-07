import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthProvider"
import { supabase } from "../lib/supabase.js"

const MESI_ACCADEMICO = [
  "Settembre","Ottobre","Novembre","Dicembre",
  "Gennaio","Febbraio","Marzo","Aprile",
  "Maggio","Giugno","Luglio","Agosto"
]

function DashboardUtente() {
  const { user } = useAuth()
  const [tab, setTab] = useState("dati")

  const [utente, setUtente] = useState(null)
  const [formData, setFormData] = useState({})
  const [corsi, setCorsi] = useState([])
  const [pagamenti, setPagamenti] = useState([])
  const [figli, setFigli] = useState([])
  const [selectedAnno, setSelectedAnno] = useState(new Date().getFullYear().toString())

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [errors, setErrors] = useState({})

  // Carica dati utente, pagamenti e figli (se genitore)
  useEffect(() => {
    if (!user?.id) return
    
    const loadData = async () => {
      try {
        // Carica i dati dell'utente loggato
        const { data: userData, error: userError } = await supabase
          .from("utenti")
          .select("*")
          .eq("auth_id", user.id)
          .single()
        
        if (userError) throw userError
        
        if (userData) {
          setUtente(userData)
          setFormData({
            nome: userData.nome || "",
            cognome: userData.cognome || "",
            data_nascita: userData.data_nascita || "",
            cellulare: userData.cellulare || "",
            nome_genitore1: userData.nome_genitore1 || "",
            cellulare_genitore1: userData.cellulare_genitore1 || "",
            nome_genitore2: userData.nome_genitore2 || "",
            cellulare_genitore2: userData.cellulare_genitore2 || "",
            taglia_tshirt: userData.taglia_tshirt || "",
            taglia_pantalone: userData.taglia_pantalone || "",
            numero_scarpe: userData.numero_scarpe || ""
          })

          // Carica i pagamenti collegati all'utente
          const { data: pagamentiData, error: pagamentiError } = await supabase
            .from("pagamenti")
            .select("*")
            .eq("allievo_id", userData.id)
          
          if (pagamentiError) throw pagamentiError
          setPagamenti(pagamentiData || [])

          // Se è un genitore, carica anche i figli
          if (userData.ruolo === 'genitore') {
            const { data: figliData, error: figliError } = await supabase
              .from("utenti")
              .select("id, nome, cognome")
              .eq("genitore_id", userData.id)
            
            if (figliError) throw figliError
            setFigli(figliData || [])
          }
        }

        // Carica i corsi disponibili
        const { data: corsiData } = await supabase.from("corsi").select("id, nome")
        setCorsi(corsiData || [])

        // Subscription realtime per i pagamenti
        if (userData) {
          const channel = supabase
            .channel('pagamenti-utente')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'pagamenti',
                filter: `allievo_id=eq.${userData.id}`
              },
              async () => {
                const { data: updatedPagamenti } = await supabase
                  .from("pagamenti")
                  .select("*")
                  .eq("allievo_id", userData.id)
                setPagamenti(updatedPagamenti || [])
              }
            )
            .subscribe()
          
          return () => {
            supabase.removeChannel(channel)
          }
        }
      } catch (error) {
        console.error('Errore nel caricamento dati:', error)
        setMessage({ type: "error", text: "Errore nel caricamento dei dati" })
      }
    }
    
    loadData()
  }, [user?.id])

  // Salvataggio profilo
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setErrors({})

      // Pulisci i dati prima di inviare
      const cleanData = { ...formData }

      // Converte stringhe vuote in null
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === "") cleanData[key] = null
      })

      // Converte numero_scarpe in numero
      if (cleanData.numero_scarpe) {
        cleanData.numero_scarpe = parseInt(cleanData.numero_scarpe, 10)
      }

      // Converte data_nascita in formato ISO (se valida)
      if (cleanData.data_nascita && /^\d{2}\/\d{2}\/\d{4}$/.test(cleanData.data_nascita)) {
        const [gg, mm, yyyy] = cleanData.data_nascita.split("/")
        cleanData.data_nascita = `${yyyy}-${mm}-${gg}` // formato accettato da Postgres
      }

      const { error } = await supabase
        .from("utenti")
        .update(cleanData)
        .eq("auth_id", user.id)

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

  // Filtri pagamenti
  const iscrizione = pagamenti.find(p => p.categoria === "iscrizione")
  const mensili = pagamenti.filter(p => p.categoria?.toLowerCase() === "mensile")
  const vestiti = pagamenti.filter(p => p.categoria === "vestiti")
  const saggio = pagamenti.filter(p => p.categoria === "saggio")

  // Corsi attivi
  const getActiveCourses = () => {
    if (!utente) return []
    const courses = []
    for (let i = 1; i <= 5; i++) {
      const corsoId = utente[`corso_${i}`]
      const prezzo = utente[`prezzo_corso${i}`]
      if (corsoId) {
        const corso = corsi.find(c => c.id === corsoId)
        if (corso) {
          courses.push({
            numero: i,
            nome: corso.nome,
            prezzo: prezzo ? parseFloat(prezzo).toFixed(2) : "0.00"
          })
        }
      }
    }
    return courses
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">
          Benvenuto {utente?.nome} {utente?.cognome}
        </h1>

        {/* NAV TABS */}
        <div className="grid grid-cols-2 md:grid-cols-4 flex gap-2 mb-6">
          <button onClick={() => setTab("dati")}
            className={`px-4 py-2 rounded-lg font-semibold ${
              tab === "dati" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70"}`}>
            Dati personali
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
          {/* Tab Figli - visibile solo ai genitori */}
          {utente?.ruolo === 'genitore' && (
            <button onClick={() => setTab("figli")}
              className={`px-4 py-2 rounded-lg font-semibold ${
                tab === "figli" ? "bg-indigo-600 text-white" : "bg-white/10 text-white/70"}`}>
              Figli
            </button>
          )}
        </div>

        {/* TAB DATI */}
        {tab === "dati" && (
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
              {/* Dati personali */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Nome *</label>
                  <input type="text" name="nome" value={formData.nome}
                    onChange={handleInputChange} placeholder="Inserisci il tuo nome"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Cognome *</label>
                  <input type="text" name="cognome" value={formData.cognome}
                    onChange={handleInputChange} placeholder="Inserisci il tuo cognome"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Data di nascita (gg/mm/aaaa)</label>
                  <input type="text" name="data_nascita" value={formData.data_nascita}
                    onChange={handleInputChange} placeholder="00/00/0000" pattern="\d{2}/\d{2}/\d{4}"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50"/>
                </div>
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">Cellulare</label>
                  <input type="tel" name="cellulare" value={formData.cellulare}
                    onChange={handleInputChange} placeholder="Inserisci il tuo cellulare"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                </div>
              </div>

              {/* Dati genitori - solo per allievi */}
              {utente?.ruolo === 'allievo' && (
                <>
                  <h3 className="text-lg font-semibold text-white mt-6">Genitori</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Nome genitore 1</label>
                      <input type="text" name="nome_genitore1" value={formData.nome_genitore1}
                        onChange={handleInputChange} placeholder="Nome del primo genitore"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Cellulare genitore 1</label>
                      <input type="tel" name="cellulare_genitore1" value={formData.cellulare_genitore1}
                        onChange={handleInputChange} placeholder="Cellulare del primo genitore"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Nome genitore 2</label>
                      <input type="text" name="nome_genitore2" value={formData.nome_genitore2}
                        onChange={handleInputChange} placeholder="Nome del secondo genitore"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Cellulare genitore 2</label>
                      <input type="tel" name="cellulare_genitore2" value={formData.cellulare_genitore2}
                        onChange={handleInputChange} placeholder="Cellulare del secondo genitore"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                    </div>
                  </div>
                </>
              )}

              {/* Taglie - solo per allievi */}
              {utente?.ruolo === 'allievo' && (
                <>
                  <h3 className="text-lg font-semibold text-white mt-6">Taglie</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Taglia T-shirt</label>
                      <select name="taglia_tshirt" value={formData.taglia_tshirt}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                        <option value="">Seleziona taglia</option>
                        <option value="XS">XS</option><option value="S">S</option>
                        <option value="M">M</option><option value="L">L</option>
                        <option value="XL">XL</option><option value="XXL">XXL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Taglia pantalone</label>
                      <select name="taglia_pantalone" value={formData.taglia_pantalone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                        <option value="">Seleziona taglia</option>
                        <option value="XS">XS</option><option value="S">S</option>
                        <option value="M">M</option><option value="L">L</option>
                        <option value="XL">XL</option><option value="XXL">XXL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white/80 text-sm font-medium mb-2">Numero scarpe</label>
                      <input type="number" name="numero_scarpe" value={formData.numero_scarpe}
                        onChange={handleInputChange} placeholder="es. 42"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
                    </div>
                  </div>
                </>
              )}

              <button type="submit" disabled={saving}
                className="mt-6 w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold">
                {saving ? "Salvando..." : "Salva modifiche"}
              </button>
            </form>

            {/* Sezione Corsi attivi - solo per allievi */}
            {utente?.ruolo === 'allievo' && getActiveCourses().length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-white mb-4">I miei corsi</h3>
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
        )}

        {/* TAB MENSILE */}
        {tab === "mensile" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 space-y-4">
            <h3 className="text-xl font-semibold text-white mb-4">Iscrizione</h3>
            {iscrizione ? (
              <p className={`font-semibold mb-6 ${
                iscrizione.stato === "pagato" ? "text-green-400" : "text-red-400"
              }`}>
                {iscrizione.stato === "pagato" ? "Pagata" : "Non pagata"} – €{iscrizione.importo}
              </p>
            ) : (
              <p className="text-white/70 mb-6">Nessun pagamento registrato</p>
            )}
            
            <h2 className="text-2xl font-semibold text-white mb-4">Pagamenti mensili</h2>
            <select
              value={selectedAnno}
              onChange={(e) => setSelectedAnno(e.target.value)}
              className="mb-4 px-3 py-2 rounded bg-white/10 border border-white/20 text-white"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MESI_ACCADEMICO.map(mese => {
                const pagamento = pagamenti
                  .filter(p => p.categoria === "mensile")
                  .find(p => (p.mese || "").toLowerCase() === mese.toLowerCase() && String(p.anno) === String(selectedAnno))
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
                {[1,2,3,4].map(tranche => {
                  const pagamento = saggio.find(p => p.tranche === tranche)
                  return (
                    <div key={tranche} className={`px-4 py-3 rounded-lg text-sm text-center ${
                      pagamento?.stato === "pagato"
                        ? "bg-green-500 text-white"
                        : pagamento?.stato === "scaduto"
                        ? "bg-red-500 text-white"
                        : "bg-gray-500 text-white"
                    }`}>
                      Tranche {tranche} – {pagamento?.stato || "non dovuto"}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Vestiti */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Vestiti e Accessori</h3>
              {vestiti.length === 0 ? (
                <p className="text-white/70">Nessun acquisto registrato</p>
              ) : (
                <ul className="space-y-2">
                  {vestiti.map(v => (
                    <li key={v.id} className="bg-white/5 border border-white/10 rounded-lg p-3 flex justify-between">
                      <span className="text-white">€{v.importo} – {v.note || "Vestiti/Accessori"}</span>
                      <span className={`font-semibold ${
                        v.stato === "pagato" ? "text-green-400" : "text-red-400"
                      }`}>
                        {v.stato}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* TAB FIGLI - solo per genitori */}
        {utente?.ruolo === 'genitore' && tab === "figli" && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">I miei figli</h2>
              <Link 
                to="/aggiungi-figlio"
                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
              >
                + Aggiungi figlio
              </Link>
            </div>
            
            {figli.length === 0 ? (
              <p className="text-white/70">Nessun figlio registrato</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {figli.map(figlio => (
                  <Link 
                    key={figlio.id}
                    to={`/figlio/${figlio.id}`}
                    className="block bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <h4 className="text-lg font-semibold text-white">
                      {figlio.nome} {figlio.cognome}
                    </h4>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardUtente