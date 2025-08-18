import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import CardGlass from '../components/CardGlass.jsx'
import { useAuth } from '../context/AuthProvider.jsx'

export default function Login() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Effettua il login
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password
      })
      
      if (signInError) {
        setError('Credenziali non valide. Verifica email e password.')
        setLoading(false)
        return
      }

      if (!authData.user) {
        setError('Errore durante l\'autenticazione. Riprova.')
        setLoading(false)
        return
      }

      // Carica immediatamente il profilo per determinare il ruolo
      const { data: userProfile, error: profileError } = await supabase
        .from('utenti')
        .select('ruolo')
        .eq('auth_id', authData.user.id)
        .single()
      
      if (profileError) {
        console.error('Errore caricamento profilo:', profileError.message)
        // Fallback al dashboard se non riesce a caricare il profilo
        navigate('/dashboard')
        setLoading(false)
        return
      }

      // Redirect basato sul ruolo
      if (userProfile?.ruolo === 'admin') {
        navigate('/admin/allievi')
      } else {
        navigate('/dashboard')
      }
      
    } catch (err) {
      console.error('Errore login:', err.message)
      setError('Errore di connessione. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <CardGlass className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Accedi
          </h1>
          <p className="text-white/70">Benvenuto in Roby Club</p>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
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
              value={form.password}
              onChange={onChange}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Inserisci la tua password"
            />
          </div>
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold disabled:opacity-60"
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>
        
        <p className="mt-4 text-sm text-white/70">
          Non hai un account?{' '}
          <Link className="text-indigo-400 hover:underline" to="/signup">
            Registrati
          </Link>
        </p>
      </CardGlass>
    </main>
  )
}