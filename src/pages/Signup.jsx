import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'
import { supabase } from '../lib/supabase.js'

function Signup() {
  const { refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    try {
      console.log('🔄 Tentativo registrazione:', {
        email: formData.email,
        nome: formData.nome,
        cognome: formData.cognome,
        timestamp: new Date().toISOString()
      })

      // Registrazione con metadati
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            nome: formData.nome,
            cognome: formData.cognome
          }
        }
      })

      if (signUpError) {
        console.error('❌ Errore signup Supabase:', {
          message: signUpError.message,
          status: signUpError.status,
          details: signUpError
        })
        setError(signUpError.message)
        return
      }

      console.log('✅ Signup completato:', {
        userId: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at,
        session: !!data.session
      })

      if (data.user) {
        if (data.user.email_confirmed_at) {
          // Email già confermata - login automatico
          console.log('🔄 Caricamento profilo per redirect...')
          const profile = await refreshProfile()
          
          console.log('👤 Profilo caricato:', {
            profile,
            ruolo: profile?.ruolo
          })
          
          if (profile?.ruolo?.toLowerCase() === 'admin') {
            console.log('🔀 Redirect admin -> /admin')
            navigate('/admin', { replace: true })
          } else {
            if (profile === null) {
              console.log('⏳ Profilo in creazione, redirect ritardato -> /dashboard')
              setInfo('Profilo in creazione, reindirizzamento alla dashboard...')
              setTimeout(() => {
                navigate('/dashboard', { replace: true })
              }, 2000)
            } else {
              console.log('🔀 Redirect user -> /dashboard')
              navigate('/dashboard', { replace: true })
            }
          }
        } else {
          // Email da confermare
          console.log('📧 Email da confermare, redirect -> /login')
          setInfo('Registrazione completata! Controlla la tua email per confermare l\'account.')
          setTimeout(() => {
            navigate('/login', { replace: true })
          }, 3000)
        }
      }
    } catch (err) {
      console.error('💥 Errore critico signup:', {
        error: err,
        message: err.message,
        stack: err.stack
      })
      setError('Errore durante la registrazione')
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
        <h1 className="text-3xl font-bold text-white text-center mb-8">Registrati</h1>
        
        {error && (
          <div className="bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg p-3 mb-6">
            {error}
          </div>
        )}
        
        {info && (
          <div className="bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg p-3 mb-6">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Nome
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nome"
              />
            </div>
            
            <div>
              <label className="block text-white/80 text-sm font-medium mb-2">
                Cognome
              </label>
              <input
                type="text"
                name="cognome"
                value={formData.cognome}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Cognome"
              />
            </div>
          </div>
          
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
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Inserisci la tua password"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Registrazione in corso...' : 'Registrati'}
          </button>
        </form>
        
        <p className="text-white/70 text-center mt-6">
          Hai già un account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Accedi
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup
