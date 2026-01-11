import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import CardGlass from '../components/CardGlass.jsx'
import { sendLog } from '../lib/logger'
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

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
      if (import.meta.env.DEV) console.log("[Login] Attempting login for:", formData.email);
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      if (import.meta.env.DEV) console.log("[Login] Success");
      navigate("/home", { replace: true })
      
    } catch (err) {
      console.error("[Login] Error:", err.code, err.message)
      
      let msg = "Credenziali non valide."
      if (err.code === 'auth/invalid-credential') msg = "Email o password errati."
      if (err.code === 'auth/user-not-found') msg = "Utente non trovato."
      if (err.code === 'auth/wrong-password') msg = "Password errata."
      if (err.code === 'auth/too-many-requests') msg = "Troppi tentativi. Riprova più tardi."
      
      setError(msg)
      
      // Logger non bloccante
      try {
        await sendLog('Login', 'Errore login', { 
            error: err.message, 
            code: err.code 
        });
      } catch (logErr) {
         console.warn("[Login] Failed to log error (ignored):", logErr);
      }
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
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </button>
            </form>
            
            <div className="text-center mt-6">
              <Link to="/" className="text-white/60 hover:text-white text-sm transition-colors">
                ← Torna indietro
              </Link>
            </div>
          </div>
        </CardGlass>
      </div>
    </div>
  )
}

export default Login
