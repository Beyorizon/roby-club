import React from 'react'
import { Link } from 'react-router-dom'
import NewsFeed from '../components/NewsFeed.jsx'

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
          Benvenuto in Roby Club
        </h1>
        <p className="text-white/70">
          Gestisci corsi, eventi, annunci e pagamenti in un’unica piattaforma.
        </p>

        <div className="text-left">
          <NewsFeed />
        </div>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/login"
            className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 transition-colors font-semibold"
          >
            Accedi
          </Link>
          <Link
            to="/signup"
            className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 transition-colors font-semibold"
          >
            Registrati
          </Link>
        </div>
      </div>
    </main>
  )
}