import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { getRegistrations } from '../utils/storage';
import { Registration } from '../types';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

const Home: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, wave: 0, cash: 0, totalAmount: 0 });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Registration[] = await getRegistrations();
        if (cancelled) return;
        setStats({
          total: data.length,
          wave: data.filter(r => r.paymentType === 'wave').length,
          cash: data.filter(r => r.paymentType === 'cash').length,
          totalAmount: data.reduce((sum, r) => sum + r.amount, 0),
        });
      } catch {
        // DB may not be available in browser-only mode
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-lg font-semibold text-gray-800 mb-6">Tableau de bord</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="panel p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total inscriptions</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Montant total</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalAmount)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paiements Wave</p>
          <p className="text-2xl font-bold text-purple-700">{stats.wave}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paiements Espece</p>
          <p className="text-2xl font-bold text-emerald-700">{stats.cash}</p>
        </div>
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">Actions rapides</h2>
      <div className="flex flex-wrap gap-2">
        <Link to="/add" className="btn btn-primary">
          <PlusCircle className="h-3.5 w-3.5" />
          Nouvelle inscription
        </Link>
        <Link to="/registrations" className="btn btn-default">
          <ClipboardList className="h-3.5 w-3.5" />
          Voir la liste
        </Link>
      </div>
    </div>
  );
};

export default Home;
