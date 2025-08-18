import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase.js'
import CardGlass from '../components/CardGlass.jsx'

export default function Signup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nome: form.nome,
          cognome: form.cognome
        }
      }
    })
    
    if (signUpError) {
      setError(`Errore durante la registrazione: ${signUpError.message}`)
      setLoading(false)
      return
    }

    // Nessun insert manuale in `utenti`: lo fa il trigger in Supabase
    if (data?.user) {
      setInfo('Registrazione completata con successo. Controlla la tua email per la conferma.')
    }

    setLoading(false)
    setTimeout(() => {
      navigate('/login')
    }, 800)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <CardGlass className="w-full max-w-md p-6">
        <h2 className="text-2xl font-bold mb-6">Crea un account</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="nome"
              placeholder="Nome"
              value={form.nome}
              onChange={onChange}
              className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <input
              type="text"
              name="cognome"
              placeholder="Cognome"
              value={form.cognome}
              onChange={onChange}
              className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={onChange}
            className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={onChange}
            className="w-full px-4 py-3 bg-transparent border border-white/20 rounded-xl placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          {info && <p className="text-emerald-400 text-sm">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold disabled:opacity-60"
          >
            {loading ? 'Registrazione...' : 'Registrati'}
          </button>
        </form>
        <p className="mt-4 text-sm text-white/70">
          Hai già un account?{' '}
          <Link className="text-indigo-400 hover:underline" to="/login">
            Accedi
          </Link>
        </p>
      </CardGlass>
    </main>
  )
}
