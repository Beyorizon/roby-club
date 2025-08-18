import { useAuth } from '../context/AuthProvider'
import { Navigate, useLocation } from 'react-router-dom'

function ProtectedRoute({ children, requiredRole }) {
  const { user, profile, loading, isAdmin } = useAuth()
  const location = useLocation()

  // Mostra spinner durante il caricamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Caricamento...</div>
      </div>
    )
  }

  // Se non autenticato, redirect al login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Se richiede ruolo admin ma l'utente non è admin
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  // Se richiede ruolo user ma l'utente è admin (per evitare che admin vada su /dashboard)
  if (requiredRole === 'user' && isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return children
}

export default ProtectedRoute