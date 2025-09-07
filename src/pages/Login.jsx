import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CardGlass from '../components/CardGlass.jsx'
import { supabase } from '../lib/supabase.js'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
      if (error) throw error

      const session = data?.session
      if (!session?.user?.id) throw new Error("Sessione non valida")

      // Dopo il login, tutti i ruoli vengono reindirizzati a /home
      navigate("/home", { replace: true })
      if (!userData) {
        setError("Utente non trovato nella tabella 'utenti'")
      } else {
        setError(`Ruolo non valido: ${userData.ruolo}`)
      }
    } catch (err) {
      console.error(err)
      setError("Credenziali non valide. Riprova.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <CardGlass>
          <div className="p-4 sm:p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Accedi</h2>
              <p className="text-white/70 text-sm">Inserisci le tue credenziali</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="tua@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 text-sm">
                Non sei registrato? Registrati
              </Link>
            </div>
          </div>
        </CardGlass>
      </div>
    </div>
  )
}

export default Login
