import CardGlass from '../components/CardGlass';

export default function Dashboard() {
  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardGlass className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Annunci
            </h3>
            <p className="text-white/70 mb-4">
              Visualizza gli ultimi annunci del club e le comunicazioni importanti.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Evento networking - 15 Marzo</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Nuove opportunità di business</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Aggiornamento regolamento</p>
              </div>
            </div>
          </CardGlass>

          <CardGlass className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Eventi
            </h3>
            <p className="text-white/70 mb-4">
              Prossimi eventi e attività del club a cui puoi partecipare.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Cena di gala - 20 Marzo</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Workshop imprenditoriale</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Torneo di golf</p>
              </div>
            </div>
          </CardGlass>

          <CardGlass className="p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Pagamenti
            </h3>
            <p className="text-white/70 mb-4">
              Gestisci le tue quote associative e i pagamenti per gli eventi.
            </p>
            <div className="space-y-3">
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Quota annuale: Pagata</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Evento networking: €50</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="text-white/80 text-sm">Cena di gala: €120</p>
              </div>
            </div>
          </CardGlass>
        </div>
      </div>
    </div>
  );
}