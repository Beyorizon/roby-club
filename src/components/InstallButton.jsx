import { useInstallPrompt } from '../hooks/useInstallPrompt'

export default function InstallButton() {
  const { isInstallable, install } = useInstallPrompt()

  const handleInstall = async () => {
    await install()
  }

  // Don't render if not installable
  if (!isInstallable) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium whitespace-nowrap"
      title="Installa l'app sul tuo dispositivo"
    >
      📱 Installa
    </button>
  )
}