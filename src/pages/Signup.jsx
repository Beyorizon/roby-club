import { Link } from 'react-router-dom'
import CardGlass from '../components/CardGlass.jsx'

function Signup() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <CardGlass className="p-8 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-white mb-6">Registrati come</h1>
        <div className="space-y-4">
          <Link
            to="/signup-genitore"
            className="block w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition"
          >
            Genitore
          </Link>
          <Link
            to="/signup-allievo"
            className="block w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition"
          >
            Allievo
          </Link>
        </div>
        <p className="text-white/70 mt-6">
          Hai già un account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Accedi
          </Link>
        </p>
      </CardGlass>
    </div>
  )
}

export default Signup
