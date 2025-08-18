import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { supabase } from '../lib/supabase.js'

function Login() {
  const { user, profile, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect automatico se già loggato
  if (user && profile) {
    const redirectPath = isAdmin ? '/admin' : '/dashboard'
    navigate(redirectPath, { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Solo autenticazione - AuthProvider gestirà il resto
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        console.error('❌ Errore login:', signInError.message)
        setError(signInError.message)
        return
      }

      // AuthProvider gestirà automaticamente il redirect tramite onAuthStateChange
      console.log('✅ Login effettuato, AuthProvider gestirà il redirect...')
      
    } catch (err) {
      console.error('💥 Errore critico durante login:', err)
      setError('Errore durante il login')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 w-full max-w-md border border-white/20">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Accedi</h1>
        
        {error && (
          <div className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg p-3 mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Inserisci la tua email"
            />
          </div>
          
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Inserisci la tua password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        <p className="text-white/60 text-center mt-6">
          Non hai un account?{' '}
          <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Registrati
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login