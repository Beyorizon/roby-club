import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import CardGlass from '../components/CardGlass.jsx'
import { resetIOSZoom } from '../utils/iosZoomFix'

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  useEffect(() => {
    // Reset zoom quando si carica la pagina login
    resetIOSZoom();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(formData.email, formData.password)
      // Reset zoom prima della navigazione
      resetIOSZoom()
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
      // Reset zoom anche in caso di errore
      setTimeout(resetIOSZoom, 100)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <CardGlass>
          <div className="p-4 sm:p-6">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Accedi
              </h2>
              <p className="text-white/70 text-sm">
                Accedi al tuo account
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
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="tua@email.com"
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
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-transparent text-sm"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>

            <div className="mt-4 text-center space-y-2">
              <Link
                to="/signup"
                className="block text-indigo-400 hover:text-indigo-300 text-xs"
              >
                Non sei registrato? Registrati
              </Link>
              <Link
                to="/admin-login"
                className="block text-yellow-400 hover:text-yellow-300 text-xs"
              >
                Sei un amministratore? Accedi
              </Link>
            </div>
          </div>
        </CardGlass>
      </div>
    </div>
  )
}

export default Login