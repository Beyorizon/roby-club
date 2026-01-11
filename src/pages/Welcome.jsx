import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import CardGlass from '../components/CardGlass.jsx'
import Logo from '../assets/icon_logo.svg'
import { useAuth } from '../context/AuthProvider'

export default function Welcome() {
  const { user, loading } = useAuth()

  // Se sta caricando, mostra uno spinner (opzionale, ma buona UX)
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Se l'utente è autenticato, redirect a /home
  if (user) {
    return <Navigate to="/home" replace />
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
            <img 
              src={Logo} 
              alt="Roby Club" 
              className="h-32 w-32 md:h-40 md:w-40 drop-shadow-2xl"
            />
        </div>
        
        <CardGlass>
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">Benvenuto</h1>
              <p className="text-white/70">Accedi o crea un nuovo account per continuare</p>
            </div>

            <div className="space-y-4">
              <Link 
                to="/login"
                className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-center transition-colors shadow-lg shadow-indigo-500/30"
              >
                Accedi
              </Link>
              
              <Link 
                to="/signup"
                className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-center transition-colors backdrop-blur-sm"
              >
                Registrati
              </Link>
            </div>
          </div>
        </CardGlass>
      </div>
    </div>
  )
}
