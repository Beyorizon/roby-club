import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthProvider'

function Navbar() {
  const { session, isAdmin, userProfile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    console.log('🔴 [DEBUG] Logout button clicked')
    
    try {
      await signOut()
      console.log('🏠 [DEBUG] Navigating to /')
      navigate('/', { replace: true })
      
      // Se dopo 2 secondi siamo ancora loggati, forza un reload
      setTimeout(() => {
        if (session) {
          console.log('🔄 [DEBUG] Session still exists, forcing page reload')
          window.location.href = '/'
        }
      }, 2000)
      
    } catch (err) {
      console.error('❌ [DEBUG] Logout error:', err)
      // Anche in caso di errore, prova a navigare e fare reload
      console.log('🏠 [DEBUG] Navigating to / (after error)')
      navigate('/', { replace: true })
      
      // Forza reload dopo errore
      setTimeout(() => {
        console.log('🔄 [DEBUG] Forcing page reload after error')
        window.location.href = '/'
      }, 1000)
    }
  }

  // Ottieni il nome utente dal profilo
  const getUserName = () => {
    if (userProfile?.nome) {
      return userProfile.nome
    }
    if (isAdmin) {
      return 'Admin'
    }
    return 'Utente'
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center">
            <Link to="/" className="text-white text-lg font-bold truncate">
              Roby Club
            </Link>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            {!session ? (
              // Stato non loggato: solo il titolo/logo
              <div></div>
            ) : (
              <>
                {/* Saluto personalizzato */}
                <span className="text-white/90 text-sm font-medium">
                  Ciao {getUserName()}
                </span>
                
                {/* Pulsanti basati sul ruolo */}
                {isAdmin ? (
                  // Admin: solo Area Admin + Logout
                  <>
                    <Link
                      to="/admin"
                      className="text-white/80 hover:text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    >
                      Area Admin
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  // Allievo: solo Dashboard + Logout
                  <>
                    <Link
                      to="/dashboard"
                      className="text-white/80 hover:text-white px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors"
                    >
                      Logout
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar