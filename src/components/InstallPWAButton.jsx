import { useState, useEffect } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Controlla se l'app è già installata
    const checkIfInstalled = () => {
      // Metodo 1: display-mode standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        return true;
      }
      
      // Metodo 2: navigator.standalone (iOS Safari)
      if (window.navigator.standalone === true) {
        return true;
      }
      
      // Metodo 3: document.referrer (Android)
      if (document.referrer.includes('android-app://')) {
        return true;
      }
      
      return false;
    };

    if (checkIfInstalled()) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };

    const appInstalledHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setShowButton(false);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", appInstalledHandler);

    // Mostra il pulsante anche se beforeinstallprompt non viene triggerato
    // (per browser che non supportano l'evento ma supportano PWA)
    const timer = setTimeout(() => {
      if (!isInstalled && !deferredPrompt) {
        setShowButton(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", appInstalledHandler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setShowButton(false);
      }
    } else {
      // Fallback per browser che non supportano l'installazione automatica
      const userAgent = navigator.userAgent.toLowerCase();
      let instructions = '';
      
      if (userAgent.includes('chrome') || userAgent.includes('edge')) {
        instructions = 'Menu (⋮) → "Installa app" o "Aggiungi alla schermata Home"';
      } else if (userAgent.includes('firefox')) {
        instructions = 'Menu → "Installa" o "Aggiungi alla schermata Home"';
      } else if (userAgent.includes('safari')) {
        instructions = 'Condividi → "Aggiungi alla schermata Home"';
      } else {
        instructions = 'Cerca l\'opzione "Installa app" o "Aggiungi alla schermata Home" nel menu del browser';
      }
      
      alert(`Per installare l'app:\n\n${instructions}`);
    }
  };

  // Non mostrare se già installata
  if (isInstalled) return null;

  // Non mostrare se non dovrebbe essere visibile
  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
      title="Installa l'app sul tuo dispositivo"
    >
      📱 Installa
    </button>
  );
}