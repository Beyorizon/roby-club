import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
          Roby Club
        </h1>
        <p className="text-xl md:text-2xl text-white/80 mb-12 max-w-2xl mx-auto">
          Il tuo club esclusivo per eventi, networking e opportunità uniche
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link 
            to="/login" 
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Accedi
          </Link>
          <Link 
            to="/signup" 
            className="px-8 py-4 backdrop-blur-lg bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
          >
            Registrati
          </Link>
        </div>
      </div>
    </div>
  );
}