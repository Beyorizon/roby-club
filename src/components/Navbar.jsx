import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import InstallButton from './InstallButton';
import supabase from '../lib/supabase';
import Logo from "../assets/icon_logo.svg";

function Navbar() {
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/', { replace: true });
    } catch (err) {
      navigate('/', { replace: true });
    }
  };

  const scrollToSection = (sectionId) => {
    setIsMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  // Icone SVG inline
  const DashboardIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const NewsIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );

  const LoginIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
  );

  const LogoutIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );

  const LogoIcon = () => (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );

  const HamburgerIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );

  const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  const VideoIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <>
      {/* Overlay per chiudere menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Hamburger Menu Drawer - Solo se utente loggato */}
      {session && (
        <div className={`fixed top-0 right-0 h-full w-80 max-w-[80vw] bg-white/10 backdrop-blur-md border-l border-white/20 z-50 transform transition-transform duration-300 ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6">
            {/* Header del menu */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Voci del menu */}
            <nav className="space-y-4">
              {/* Dashboard */}
              <Link
                to={isAdmin ? "/admin" : "/dashboard"}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <DashboardIcon />
                <span className="font-medium">
                  {isAdmin ? 'Admin' : 'Dashboard'}
                </span>
              </Link>

              {/* Orari */}
              <button
                onClick={() => scrollToSection('orari')}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <ClockIcon />
                <span className="font-medium">Orari</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/10 backdrop-blur-md border-t border-white/20"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom)',
          height: 'calc(4rem + env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          
          {/* 1. Accedi/Logout */}
          {!session ? (
            <Link
              to="/login"
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive('/login') 
                  ? 'text-white bg-white/20' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-current={isActive('/login') ? 'page' : undefined}
            >
              <LoginIcon />
              <span className="text-xs mt-1 font-medium">Accedi</span>
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/10"
            >
              <LogoutIcon />
              <span className="text-xs mt-1 font-medium">Logout</span>
            </button>
          )}

          {/* 2. Novità */}
          <Link
            to="/novita"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/novita') 
                ? 'text-white bg-white/20' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-current={isActive('/novita') ? 'page' : undefined}
          >
            <NewsIcon />
            <span className="text-xs mt-1 font-medium">Novità</span>
          </Link>

         {/* 3. Logo al centro */}
<Link
  to="/"
  className="flex flex-col items-center justify-center p-3 rounded-full transition-colors text-white"
>
  <img src={Logo} alt="Logo" className="h-8 w-8 md:h-12 md:w-12" />
</Link>

          {/* 4. Saggi */}
          <Link
            to="/saggi"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/saggi') 
                ? 'text-white bg-white/20' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-current={isActive('/saggi') ? 'page' : undefined}
          >
            <VideoIcon />
            <span className="text-xs mt-1 font-medium">Saggi</span>
          </Link>

          {/* 5. Menu hamburger */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/10"
          >
            <HamburgerIcon />
            <span className="text-xs mt-1 font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Install Button - posizionato in alto a destra */}
      <div className="fixed top-4 right-4 z-20">
        <InstallButton />
      </div>
    </>
  );
}

export default Navbar;