import CardGlass from '../components/CardGlass';

export default function Admin() {
  const users = [
    { id: 1, nome: 'Mario', cognome: 'Rossi', ruolo: 'Membro', azioni: 'Modifica' },
    { id: 2, nome: 'Laura', cognome: 'Bianchi', ruolo: 'Admin', azioni: 'Modifica' },
    { id: 3, nome: 'Giuseppe', cognome: 'Verdi', ruolo: 'Membro', azioni: 'Modifica' }
  ];

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Pannello Admin
        </h1>
        <CardGlass className="p-6">
          <h3 className="text-2xl font-semibold text-white mb-6">
            Gestione Utenti
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Nome</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Cognome</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Ruolo</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 text-white/80">{user.nome}</td>
                    <td className="py-3 px-4 text-white/80">{user.cognome}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.ruolo === 'Admin' 
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {user.ruolo}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105">
                        {user.azioni}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardGlass>
      </div>
    </div>
  );
}