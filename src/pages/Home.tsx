import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { getRegistrations } from '../utils/storage';
import { Registration } from '../types';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

const Home: React.FC = () => {
  const [stats, setStats] = useState<{ total: number; wave: number; cash: number; orange: number; totalAmount: number } | null>(null);

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
          orange: data.filter(r => r.paymentType === 'orange_money').length,
          totalAmount: data.reduce((sum, r) => sum + r.amount, 0),
        });
      } catch {
        // DB may not be available in browser-only mode
        if (!cancelled) setStats({ total: 0, wave: 0, cash: 0, orange: 0, totalAmount: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-4xl">
      {/* Stats cards */}
      {stats === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-4">
              <div className="skeleton h-3 w-24 rounded mb-2" />
              <div className="skeleton h-7 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total inscriptions</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
          </div>
          <div className="panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Montant total</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatAmount(stats.totalAmount)}</p>
          </div>
          <div className="panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Wave / Orange Money</p>
            <p className="text-2xl font-bold text-purple-700 tabular-nums">
              {stats.wave} <span className="text-orange-600">/ {stats.orange}</span>
            </p>
          </div>
          <div className="panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Paiements Espece</p>
            <p className="text-2xl font-bold text-emerald-700 tabular-nums">{stats.cash}</p>
          </div>
        </div>
      )}

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
