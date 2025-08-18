import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider.jsx'

export default function ProtectedRoute({ children, roles = null }) {
  const { user, profile, loading, isAdmin } = useAuth()

  // Mostra loader durante il caricamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  // Se non autenticato, vai al login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se sono specificati ruoli e l'utente non ha il ruolo giusto
  if (roles && profile && !roles.includes(profile.ruolo)) {
    // Reindirizza in base al ruolo dell'utente
    if (isAdmin) {
      return <Navigate to="/admin/allievi" replace />
    } else {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}