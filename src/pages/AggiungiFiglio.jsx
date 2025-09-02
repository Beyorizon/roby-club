import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthProvider"
import { supabase } from "../lib/supabase.js"

function AggiungiFiglio() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [genitore, setGenitore] = useState(null)
  const [corsi, setCorsi] = useState([])

  const [formData, setFormData] = useState({
    nome: "",
    cognome: "",
    data_nascita: "",
    cellulare: "",
    taglia_tshirt: "",
    taglia_pantalone: "",
    numero_scarpe: "",
    corso: ""
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    const loadData = async () => {
      // Trova il record del genitore loggato
      const { data: g } = await supabase
        .from("genitori")
        .select("id")
        .eq("auth_id", user.id)
        .single()
      setGenitore(g)

      // Carica corsi
      const { data: c } = await supabase.from("corsi").select("id, nome")
      setCorsi(c || [])
    }
    if (user?.id) loadData()
  }, [user?.id])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!genitore) return

    try {
      setSaving(true)
      const { error } = await supabase.from("utenti").insert({
  nome: formData.nome,
  cognome: formData.cognome,
  data_nascita: formData.data_nascita
    ? (() => {
        const [gg, mm, yyyy] = formData.data_nascita.split("/")
        return `${yyyy}-${mm}-${gg}`
      })()
    : null,
  cellulare: formData.cellulare || null,
  taglia_tshirt: formData.taglia_tshirt || null,
  taglia_pantalone: formData.taglia_pantalone || null,
  numero_scarpe: formData.numero_scarpe ? parseInt(formData.numero_scarpe, 10) : null,
  corso_1: formData.corso || null,
  ruolo: "allievo",
  genitore_id: genitore.id
})

      if (error) throw error

      setMessage("Figlio aggiunto con successo!")
      setTimeout(() => navigate("/dashboard-genitore"), 1500)
    } catch (err) {
      console.error(err)
      setMessage("Errore nell'aggiunta del figlio.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <h1 className="text-2xl font-bold text-white mb-6">Aggiungi Figlio</h1>

        {message && (
          <div className="mb-4 p-3 rounded-lg bg-indigo-500/20 text-indigo-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Nome</label>
              <input type="text" name="nome" value={formData.nome} onChange={handleInputChange}
                required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Cognome</label>
              <input type="text" name="cognome" value={formData.cognome} onChange={handleInputChange}
                required className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Data di nascita (gg/mm/aaaa)</label>
            <input type="text" name="data_nascita" value={formData.data_nascita} onChange={handleInputChange}
              placeholder="00/00/0000" pattern="\d{2}/\d{2}/\d{4}"
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Cellulare</label>
            <input type="tel" name="cellulare" value={formData.cellulare} onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Taglia T-shirt</label>
              <select name="taglia_tshirt" value={formData.taglia_tshirt} onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                <option value="">Seleziona</option>
                <option value="XS">XS</option><option value="S">S</option>
                <option value="M">M</option><option value="L">L</option>
                <option value="XL">XL</option><option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Taglia pantalone</label>
              <select name="taglia_pantalone" value={formData.taglia_pantalone} onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
                <option value="">Seleziona</option>
                <option value="XS">XS</option><option value="S">S</option>
                <option value="M">M</option><option value="L">L</option>
                <option value="XL">XL</option><option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="text-white/80 text-sm font-medium mb-2 block">Numero scarpe</label>
              <input type="number" name="numero_scarpe" value={formData.numero_scarpe} onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white"/>
            </div>
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Corso</label>
            <select name="corso" value={formData.corso} onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white">
              <option value="">Seleziona corso</option>
              {corsi.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
            {saving ? "Salvando..." : "Aggiungi figlio"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AggiungiFiglio
