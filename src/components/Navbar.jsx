import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import PWAInstallBar from './PWAInstallBar';
import supabase from '../lib/supabase';

function Navbar() {
  const { session, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ruolo, setRuolo] = useState(null);

  useEffect(() => {
    const loadRuolo = async () => {
      if (!session?.user) {
        setRuolo(null);
        return;
      }
      if (isAdmin) {
        setRuolo("admin");
        return;
      }
      const { data: g } = await supabase
        .from("genitori")
        .select("id")
        .eq("auth_id", session.user.id)
        .maybeSingle();
      if (g) {
        setRuolo("genitore");
        return;
      }
      const { data: u } = await supabase
        .from("utenti")
        .select("id")
        .eq("auth_id", session.user.id)
        .maybeSingle();
      if (u) {
        setRuolo("allievo");
        return;
      }
      setRuolo(null);
    };
    loadRuolo();
  }, [session, isAdmin]);
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

  const InfoIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const BookIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  // Aggiungo l'icona Home
  const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const dashboardPath =
    ruolo === "admin"
      ? "/admin"
      : ruolo === "genitore"
      ? "/dashboard-genitore"
      : ruolo === "allievo"
      ? "/dashboard-allievo"
      : "/login";

  return (
    <>
      {/* PWA Install Bar */}
      <PWAInstallBar />

      {/* Overlay per chiudere menu */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Hamburger Menu Drawer - Uguale per tutti */}
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

          {/* Voci del menu - Riorganizzate */}
          <nav className="space-y-4">
            {/* Home - Prima posizione */}
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <HomeIcon />
              <span className="font-medium">Home</span>
            </Link>

            {/* Annunci - Seconda posizione */}
            <Link
              to="/notizie"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <NewsIcon />
              <span className="font-medium">Annunci</span>
            </Link>

            {/* Orari - Terza posizione */}
            <Link
              to="/orari"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ClockIcon />
              <span className="font-medium">Orari</span>
            </Link>

            {/* Chi siamo - TEMPORANEAMENTE NASCOSTO
            <Link
              to="/chi-siamo"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <InfoIcon />
              <span className="font-medium">Chi siamo</span>
            </Link>
            */}

            {/* Saggi */}
            <button
              onClick={() => {
                setIsMenuOpen(false);
                scrollToSection('saggi');
              }}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
            >
              <VideoIcon />
              <span className="font-medium">Saggi</span>
            </button>

            {/* Regolamento - TEMPORANEAMENTE NASCOSTO
            <Link
              to="/regolamento"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <BookIcon />
              <span className="font-medium">Regolamento</span>
            </Link>
            */}

            {/* Dashboard/Accedi - Quarta posizione */}
            {session ? (
              <>
                <Link
                  to={dashboardPath}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <DashboardIcon />
                  <span className="font-medium">
                    Dashboard
                  </span>
                </Link>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors text-left"
                >
                  <LoginIcon />
                  <span className="font-medium">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LoginIcon />
                <span className="font-medium">Accedi</span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* Bottom Navigation Bar - Riorganizzata con Home al primo posto */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-30 bg-white/10 backdrop-blur-md border-t border-white/20"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
          height: 'calc(4.5rem + env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex items-center justify-between h-16 px-4">
          
          {/* 1. Home - Prima posizione a sinistra */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/') 
                ? 'text-white bg-white/20' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-current={isActive('/') ? 'page' : undefined}
          >
            <HomeIcon />
            <span className="text-xs mt-1 font-medium">Home</span>
          </Link>

          {/* 2. Annunci */}
          <Link
            to="/notizie"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/notizie') 
                ? 'text-white bg-white/20' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-current={isActive('/notizie') ? 'page' : undefined}
          >
            <NewsIcon />
            <span className="text-xs mt-1 font-medium">Annunci</span>
          </Link>

          {/* 3. Orari */}
          <Link
            to="/orari"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
              isActive('/orari') 
                ? 'text-white bg-white/20' 
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
            aria-current={isActive('/orari') ? 'page' : undefined}
          >
            <ClockIcon />
            <span className="text-xs mt-1 font-medium">Orari</span>
          </Link>

          {/* 4. Dashboard/Accedi */}
          {session ? (
            <Link
              to={dashboardPath}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                isActive(dashboardPath) 
                  ? 'text-white bg-white/20' 
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
              aria-current={isActive(dashboardPath) ? 'page' : undefined}
            >
              <DashboardIcon />
              <span className="text-xs mt-1 font-medium">Dashboard</span>
            </Link>
          ) : (
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
          )}

          {/* 5. Menu hamburger - Ultima posizione */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-white/70 hover:text-white hover:bg-white/10"
          >
            <HamburgerIcon />
            <span className="text-xs mt-1 font-medium">Menu</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default Navbar;