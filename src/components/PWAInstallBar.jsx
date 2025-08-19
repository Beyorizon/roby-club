import { useState, useEffect } from 'react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

function PWAInstallBar() {
  const { isInstallable, install } = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Controlla se la top bar è stata già nascosta permanentemente
    const isHidden = localStorage.getItem('pwa-install-bar-hidden');
    if (!isHidden && (isInstallable || isIOSDevice())) {
      setIsVisible(true);
    }
  }, [isInstallable]);

  const isIOSDevice = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  const handleInstallClick = async () => {
    if (isIOSDevice()) {
      // Mostra istruzioni per iOS
      setShowIOSInstructions(true);
    } else {
      // Prompt di installazione per Android/Chrome
      const success = await install();
      if (success) {
        hideBarPermanently();
      }
    }
  };

  const hideBarPermanently = () => {
    localStorage.setItem('pwa-install-bar-hidden', 'true');
    setIsVisible(false);
  };

  const closeIOSInstructions = () => {
    setShowIOSInstructions(false);
    hideBarPermanently();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Mini Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-indigo-600 text-white px-4 py-2 text-center text-sm font-medium">
        <button 
          onClick={handleInstallClick}
          className="hover:underline transition-all duration-200"
        >
          📱 Clicca qui per installare l'app
        </button>
        <button 
          onClick={hideBarPermanently}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white text-lg leading-none"
          aria-label="Chiudi"
        >
          ×
        </button>
      </div>

      {/* Popup istruzioni iOS */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
            <div className="mb-4">
              {/* Icona Share */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Installa l'App
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Clicca in alto a destra su <strong>Condividi</strong> e scegli <strong>'Aggiungi alla Home'</strong>
              </p>
            </div>
            <button 
              onClick={closeIOSInstructions}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ho capito
            </button>
          </div>
        </div>
      )}

      {/* Spacer per evitare che il contenuto vada sotto la top bar */}
      <div className="h-10"></div>
    </>
  );
}

export default PWAInstallBar;