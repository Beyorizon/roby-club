import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.js';

const PaymentGrid = ({ 
  authId, 
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
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('pagamenti')
          .select('*')
          .eq('auth_id', authId)
          .eq('anno', year);

        if (error) throw error;
        setPayments(data || []);
      } catch (err) {
        console.error('Errore caricamento pagamenti:', err);
        setError('Errore nel caricamento dei pagamenti');
      } finally {
        setLoading(false);
      }
    };

    if (authId) {
      loadPayments();
    }
  }, [authId, year]);

  const getMonthStatus = (month) => {
    const payment = payments.find(p => p.mese === month);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();

    if (payment && payment.pagato) {
      return 'paid';
    }

    if (year === currentYear) {
      if (month < currentMonth || (month === currentMonth && currentDay > 10)) {
        return 'overdue';
      }
    }

    return 'unpaid';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500 text-white';
      case 'overdue':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'Sì';
      case 'overdue':
        return 'No';
      default:
        return 'No';
    }
  };

  const calculateTotalAmount = () => {
    return iscrizioni.reduce((total, iscrizione) => total + (iscrizione.prezzo || 0), 0);
  };

  const togglePayment = async (month) => {
    if (!adminMode) return;
    
    const existingPayment = payments.find(p => p.mese === month);
    const newPagato = !existingPayment?.pagato;
    const totalAmount = calculateTotalAmount();
    
    setUpdating(prev => ({ ...prev, [month]: true }));
    
    try {
      const paymentData = {
        auth_id: authId,
        corso_id: null, // Pagamento generale
        mese: month,
        anno: year,
        importo: totalAmount,
        pagato: newPagato,
        data_pagamento: newPagato ? new Date().toISOString() : null
      };

      const { data, error } = await supabase
        .from('pagamenti')
        .upsert(paymentData, {
          onConflict: 'auth_id,corso_id,mese,anno'
        })
        .select();

      if (error) throw error;

      // Optimistic update
      setPayments(prev => {
        const filtered = prev.filter(p => p.mese !== month);
        return [...filtered, data[0]];
      });

      if (onPaymentUpdate) {
        onPaymentUpdate();
      }
    } catch (err) {
      console.error('Errore aggiornamento pagamento:', err);
      setError('Errore nell\'aggiornamento del pagamento');
    } finally {
      setUpdating(prev => ({ ...prev, [month]: false }));
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
        {monthNames.map((monthName, index) => {
          const month = index + 1;
          const status = getMonthStatus(month);
          const isUpdating = updating[month];
          const payment = payments.find(p => p.mese === month);
          
          return (
            <div
              key={month}
              className={`
                ${getStatusColor(status)}
                rounded-lg p-3 text-center transition-all duration-200
                ${adminMode ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : 'hover:scale-105 hover:shadow-lg'}
                ${isUpdating ? 'opacity-60' : ''}
              `}
              onClick={() => adminMode && !isUpdating && togglePayment(month)}
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