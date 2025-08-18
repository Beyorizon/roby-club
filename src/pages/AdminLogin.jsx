import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CardGlass from '../components/CardGlass.jsx'
import { supabase } from '../lib/supabase.js'

function AdminLogin() {
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

  const checkAdminAccess = async (user) => {
    // Fallback opzionale via email admin
    if (user.email === 'grafica.valeriobottiglieri@gmail.com') {
      return true
    }

    try {
      const { data, error } = await supabase
        .from('utenti')
        .select('ruolo')
        .eq('auth_id', user.id) // verifica ruolo tramite auth_id
        .single()

      if (error) {
        console.error('Errore controllo ruolo admin:', error)
        return false
      }

      return data?.ruolo === 'admin'
    } catch (err) {
      console.error('Errore verifica admin:', err)
      return false
    }
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

      if (error) {
        setError('Credenziali non valide o errore di connessione.')
        return
      }

      const user = data?.user
      if (!user) {
        setError('Login fallito, nessun utente trovato.')
        return
      }

      const isAdmin = await checkAdminAccess(user)

      if (isAdmin) {
        navigate('/admin', { replace: true })
      } else {
        await supabase.auth.signOut()
        setError('Non sei autorizzato come admin.')
      }
    } catch (err) {
      setError('Credenziali non valide o errore di connessione.')
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
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Area Admin
              </h2>
              <p className="text-white/70 text-sm">
                Accedi con le credenziali di amministratore
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  placeholder="admin@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-800 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent text-sm"
              >
                {loading ? 'Accesso in corso...' : 'Accedi come Admin'}
              </button>
            </form>
          </div>
        </CardGlass>
      </div>
    </div>
  )
}

export default AdminLogin