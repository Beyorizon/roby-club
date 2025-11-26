import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const PaymentGrid = ({ 
  allievoId, 
  year = new Date().getFullYear(), 
  adminMode = false, 
  iscrizioni = [], 
  onPaymentUpdate 
}) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState({});

  const monthNames = [
    'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto'
  ];

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pagamenti')
          .select('*')
          .eq('allievo_id', allievoId)
          .eq('anno', year)
          .eq('categoria', 'mensile');

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error('Errore caricamento pagamenti:', err);
        setError('Errore nel caricamento dei pagamenti');
      } finally {
        setLoading(false);
      }
    };

    if (allievoId) {
      loadPayments();
    }
  }, [allievoId, year]);

  const getMonthStatus = (monthName) => {
    const payment = payments.find(p => (p.mese || '').toLowerCase() === monthName.toLowerCase() && String(p.anno) === String(year));
    if (payment && payment.stato) {
      return payment.stato;
    }

    const today = new Date();
    const map = { 'Gennaio':1,'Febbraio':2,'Marzo':3,'Aprile':4,'Maggio':5,'Giugno':6,'Luglio':7,'Agosto':8,'Settembre':9,'Ottobre':10,'Novembre':11,'Dicembre':12 };
    const monthIndex = map[monthName] || 0;
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    if (monthIndex && (monthIndex < currentMonth || (monthIndex === currentMonth && currentDay > 10))) {
      return 'scaduto';
    }

    return 'non_dovuto';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pagato':
        return 'bg-green-500 text-white';
      case 'scaduto':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pagato':
        return 'Pagato';
      case 'scaduto':
        return 'Scaduto';
      default:
        return 'Non dovuto';
    }
  };

  const calculateTotalAmount = () => {
    return iscrizioni.reduce((total, iscrizione) => total + (iscrizione.prezzo || 0), 0);
  };

  const togglePayment = async (monthName) => {
    if (!adminMode) return;
    
    const existingPayment = payments.find(p => (p.mese || '').toLowerCase() === monthName.toLowerCase() && String(p.anno) === String(year));
    const currentStatus = existingPayment?.stato;
    const newStato = currentStatus === 'pagato' ? 'scaduto' : 'pagato';
    const totalAmount = calculateTotalAmount();
    
    setUpdating(prev => ({ ...prev, [monthName]: true }));
    
    try {
      const paymentData = {
        allievo_id: allievoId,
        categoria: 'mensile',
        mese: monthName,
        anno: year,
        importo: totalAmount,
        stato: newStato,
        data_pagamento: newStato === 'pagato' ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('pagamenti')
        .upsert(paymentData, {
          onConflict: 'allievo_id,mese,anno,categoria'
        })
        .select();

      if (error) throw error;

      // Optimistic update
      setPayments(prev => {
        const filtered = prev.filter(p => (p.mese || '').toLowerCase() !== monthName.toLowerCase() || String(p.anno) !== String(year) || p.categoria !== 'mensile');
        return [...filtered, data[0]];
      });

      if (onPaymentUpdate) {
        onPaymentUpdate();
      }
    } catch (err) {
      console.error('Errore aggiornamento pagamento:', err);
      setError('Errore nell\'aggiornamento del pagamento');
    } finally {
      setUpdating(prev => ({ ...prev, [monthName]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded mb-4"></div>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/20 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">
          Pagamenti {year}
          {adminMode && (
            <span className="ml-2 text-sm text-white/60">
              (Totale mensile: €{calculateTotalAmount().toFixed(2)})
            </span>
          )}
        </h3>
        
        {/* Legenda */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-white/80">Pagato</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-white/80">Scaduto</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-white/80">Non dovuto</span>
          </div>
        </div>
      </div>

      {/* Griglia mesi */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {monthNames.map((monthName) => {
          const status = getMonthStatus(monthName);
          const isUpdating = updating[monthName];
          const payment = payments.find(p => (p.mese || '').toLowerCase() === monthName.toLowerCase() && String(p.anno) === String(year));
          
          return (
            <div
              key={monthName}
              className={`
                ${getStatusColor(status)}
                rounded-lg p-3 text-center transition-all duration-200
                ${adminMode ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'hover:scale-105 hover:shadow-lg'}
                ${isUpdating ? 'opacity-60' : ''}
              `}
              onClick={() => adminMode && !isUpdating && togglePayment(monthName)}
            >
              <div className="text-xs font-medium mb-1">
                {monthName}
              </div>
              <div className="text-lg font-bold">
                {isUpdating ? '...' : getStatusText(status)}
              </div>
              {adminMode && payment && (
                <div className="text-xs mt-1 opacity-80">
                  €{payment.importo?.toFixed(2) || '0.00'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info aggiuntiva */}
      <div className="mt-4 text-sm text-white/60">
        <p>
          {adminMode 
            ? 'Clicca sui mesi per cambiare lo stato di pagamento. I pagamenti sono considerati scaduti dopo il giorno 10 del mese.'
            : 'I pagamenti sono considerati scaduti dopo il giorno 10 del mese.'
          }
        </p>
      </div>
    </div>
  );
};

export default PaymentGrid;