import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../lib/firebase'
import CardGlass from '../components/CardGlass.jsx'

function SignupGenitore() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const auth = getAuth()
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password)
      const user = userCredential.user

      // Crea documento utente
      await setDoc(doc(db, 'users', user.uid), {
        auth_id: user.uid,
        email: formData.email,
        nome: formData.nome,
        cognome: formData.cognome,
        telefono: formData.telefono,
        ruolo: 'genitore',
        created_at: serverTimestamp()
      })

      navigate('/dashboard-utente') // O dashboard-genitore se esiste, ma dashboard-utente è standard
    } catch (err) {
      console.error(err)
      setError('Errore durante la registrazione: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <CardGlass className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">Registrati come Genitore</h1>

        {error && <div className="bg-red-500/20 text-red-200 border border-red-500/40 p-3 rounded mb-4">{error}</div>}


        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="nome" placeholder="Nome" value={formData.nome} onChange={handleInputChange} required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"/>
          <input type="text" name="cognome" placeholder="Cognome" value={formData.cognome} onChange={handleInputChange} required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"/>
          <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"/>
          <input type="tel" name="telefono" placeholder="Numero di telefono" value={formData.telefono} onChange={handleInputChange} required
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"/>
          <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleInputChange} required minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50"/>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-lg text-white font-semibold transition">
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>

        <p className="text-white/70 mt-6 text-center">
          Hai già un account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Accedi</Link>
        </p>
      </CardGlass>
    </div>
  )
}

export default SignupGenitore
