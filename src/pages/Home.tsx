import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ClipboardList } from 'lucide-react';
import { getRegistrations } from '../utils/storage';
import { Registration } from '../types';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

interface DashboardStats {
  total: number;
  totalAmount: number;
  waveCount: number;
  waveAmount: number;
  orangeCount: number;
  orangeAmount: number;
  cashCount: number;
  cashAmount: number;
}

const EMPTY_STATS: DashboardStats = {
  total: 0,
  totalAmount: 0,
  waveCount: 0,
  waveAmount: 0,
  orangeCount: 0,
  orangeAmount: 0,
  cashCount: 0,
  cashAmount: 0,
};

const Home: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data: Registration[] = await getRegistrations();
        if (cancelled) return;
        const sumOf = (rs: Registration[]) => rs.reduce((acc, r) => acc + r.amount, 0);
        const wave = data.filter(r => r.paymentType === 'wave');
        const orange = data.filter(r => r.paymentType === 'orange_money');
        const cash = data.filter(r => r.paymentType === 'cash');
        setStats({
          total: data.length,
          totalAmount: sumOf(data),
          waveCount: wave.length,
          waveAmount: sumOf(wave),
          orangeCount: orange.length,
          orangeAmount: sumOf(orange),
          cashCount: cash.length,
          cashAmount: sumOf(cash),
        });
      } catch {
        // DB may not be available in browser-only mode
        if (!cancelled) setStats(EMPTY_STATS);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="p-6 max-w-5xl">
      {/* Stats cards */}
      {stats === null ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="panel p-4">
              <div className="skeleton h-3 w-24 rounded mb-2" />
              <div className="skeleton h-7 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          <div className="panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total inscriptions</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.total}</p>
          </div>
          <div className="panel p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Montant total</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{formatAmount(stats.totalAmount)}</p>
          </div>
          <div className="panel p-4 border-l-2 border-l-blue-400">
            <p className="text-xs text-blue-700 uppercase tracking-wide mb-1">Wave</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.waveCount}</p>
            <p className="text-xs text-gray-500 tabular-nums mt-0.5">{formatAmount(stats.waveAmount)}</p>
          </div>
          <div className="panel p-4 border-l-2 border-l-orange-400">
            <p className="text-xs text-orange-700 uppercase tracking-wide mb-1">Orange Money</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.orangeCount}</p>
            <p className="text-xs text-gray-500 tabular-nums mt-0.5">{formatAmount(stats.orangeAmount)}</p>
          </div>
          <div className="panel p-4 border-l-2 border-l-emerald-400">
            <p className="text-xs text-emerald-700 uppercase tracking-wide mb-1">Espèce</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{stats.cashCount}</p>
            <p className="text-xs text-gray-500 tabular-nums mt-0.5">{formatAmount(stats.cashAmount)}</p>
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
