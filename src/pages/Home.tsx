import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ClipboardList,
  Users,
  Coins,
  CalendarClock,
  CalendarRange,
  Trophy,
  Clock,
} from 'lucide-react';
import { getRegistrations } from '../utils/storage';
import { getActivities } from '../utils/activities';
import { Registration, Activity } from '../types';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

const formatDateLong = (iso: string): string => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

const todayIso = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const monthIsoPrefix = (): string => todayIso().slice(0, 7);

const PAYMENT_META: Record<
  Registration['paymentType'],
  { label: string; barClass: string; dotClass: string; textClass: string }
> = {
  wave: {
    label: 'Wave',
    barClass: 'bg-blue-500',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-700',
  },
  orange_money: {
    label: 'Orange Money',
    barClass: 'bg-orange-500',
    dotClass: 'bg-orange-500',
    textClass: 'text-orange-700',
  },
  cash: {
    label: 'Espèce',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
  },
};

interface PaymentBreakdown {
  type: Registration['paymentType'];
  count: number;
  amount: number;
  share: number;
}

interface ActivityRanking {
  id: string;
  name: string;
  color: string;
  count: number;
  amount: number;
}

interface DashboardData {
  registrations: Registration[];
  activities: Activity[];
}

const Home: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [registrations, activities] = await Promise.all([
          getRegistrations(),
          getActivities(true),
        ]);
        if (cancelled) return;
        setData({ registrations, activities });
      } catch {
        if (!cancelled) setData({ registrations: [], activities: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    if (!data) return null;
    const { registrations, activities } = data;

    const sumOf = (rs: Registration[]) => rs.reduce((acc, r) => acc + r.amount, 0);
    const today = todayIso();
    const monthPrefix = monthIsoPrefix();

    const todayList = registrations.filter(r => r.registrationDate === today);
    const monthList = registrations.filter(r => r.registrationDate.startsWith(monthPrefix));

    const total = registrations.length;
    const totalAmount = sumOf(registrations);

    const breakdown: PaymentBreakdown[] = (
      ['wave', 'orange_money', 'cash'] as Registration['paymentType'][]
    ).map(type => {
      const list = registrations.filter(r => r.paymentType === type);
      return {
        type,
        count: list.length,
        amount: sumOf(list),
        share: total > 0 ? list.length / total : 0,
      };
    });

    const activityById = new Map(activities.map(a => [a.id, a] as const));
    const ranking: ActivityRanking[] = Array.from(
      registrations.reduce((map, r) => {
        const cur = map.get(r.activityId) ?? { count: 0, amount: 0 };
        map.set(r.activityId, { count: cur.count + 1, amount: cur.amount + r.amount });
        return map;
      }, new Map<string, { count: number; amount: number }>())
    )
      .map(([id, v]) => {
        const a = activityById.get(id);
        return {
          id,
          name: a?.name ?? 'Activité supprimée',
          color: a?.color ?? '#94a3b8',
          count: v.count,
          amount: v.amount,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const recent = [...registrations]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 5);

    const avgTicket = total > 0 ? Math.round(totalAmount / total) : 0;

    return {
      total,
      totalAmount,
      todayCount: todayList.length,
      todayAmount: sumOf(todayList),
      monthCount: monthList.length,
      monthAmount: sumOf(monthList),
      avgTicket,
      breakdown,
      ranking,
      recent,
    };
  }, [data]);

  if (stats === null) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-4">
              <div className="skeleton h-3 w-24 rounded mb-2" />
              <div className="skeleton h-7 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="panel p-4 lg:col-span-1">
            <div className="skeleton h-3 w-24 rounded mb-3" />
            <div className="skeleton h-2 w-full rounded mb-3" />
            <div className="skeleton h-3 w-3/4 rounded mb-2" />
            <div className="skeleton h-3 w-2/3 rounded mb-2" />
            <div className="skeleton h-3 w-1/2 rounded" />
          </div>
          <div className="panel p-4 lg:col-span-2">
            <div className="skeleton h-3 w-32 rounded mb-3" />
            <div className="skeleton h-3 w-full rounded mb-2" />
            <div className="skeleton h-3 w-full rounded mb-2" />
            <div className="skeleton h-3 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = stats.total === 0;

  return (
    <div className="p-6 max-w-6xl">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          iconClass="bg-slate-100 text-slate-700"
          label="Total inscriptions"
          value={stats.total.toLocaleString('fr-FR')}
          hint={
            stats.avgTicket > 0
              ? `Panier moyen ${formatAmount(stats.avgTicket)}`
              : undefined
          }
        />
        <KpiCard
          icon={<Coins className="h-4 w-4" />}
          iconClass="bg-amber-100 text-amber-700"
          label="Montant total"
          value={formatAmount(stats.totalAmount)}
        />
        <KpiCard
          icon={<CalendarClock className="h-4 w-4" />}
          iconClass="bg-blue-100 text-blue-700"
          label="Aujourd'hui"
          value={stats.todayCount.toLocaleString('fr-FR')}
          hint={stats.todayCount > 0 ? formatAmount(stats.todayAmount) : '—'}
        />
        <KpiCard
          icon={<CalendarRange className="h-4 w-4" />}
          iconClass="bg-violet-100 text-violet-700"
          label="Ce mois-ci"
          value={stats.monthCount.toLocaleString('fr-FR')}
          hint={stats.monthCount > 0 ? formatAmount(stats.monthAmount) : '—'}
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link to="/add" className="btn btn-primary">
          <PlusCircle className="h-3.5 w-3.5" />
          Nouvelle inscription
        </Link>
        <Link to="/registrations" className="btn btn-default">
          <ClipboardList className="h-3.5 w-3.5" />
          Voir la liste
        </Link>
      </div>

      {isEmpty ? (
        <div className="panel p-8 text-center">
          <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">
            Aucune inscription pour le moment
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Commencez par enregistrer une nouvelle inscription pour voir les statistiques.
          </p>
          <Link to="/add" className="btn btn-primary">
            <PlusCircle className="h-3.5 w-3.5" />
            Créer la première inscription
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Payment breakdown */}
          <section className="panel p-4 lg:col-span-1">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Modes de paiement
            </h2>

            {/* Stacked proportional bar */}
            <div className="h-2 w-full rounded-full overflow-hidden bg-gray-100 flex mb-3">
              {stats.breakdown
                .filter(b => b.count > 0)
                .map(b => (
                  <div
                    key={b.type}
                    className={`${PAYMENT_META[b.type].barClass} h-full`}
                    style={{ width: `${b.share * 100}%` }}
                    title={`${PAYMENT_META[b.type].label} : ${(b.share * 100).toFixed(1)}%`}
                  />
                ))}
            </div>

            <ul className="space-y-2">
              {stats.breakdown.map(b => (
                <li key={b.type} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${PAYMENT_META[b.type].dotClass}`}
                    />
                    <span className={`font-medium truncate ${PAYMENT_META[b.type].textClass}`}>
                      {PAYMENT_META[b.type].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 tabular-nums">
                    <span className="text-gray-500">
                      {(b.share * 100).toFixed(0)}%
                    </span>
                    <span className="text-gray-900 font-semibold w-8 text-right">
                      {b.count}
                    </span>
                    <span className="text-gray-500 w-20 text-right">
                      {formatAmount(b.amount)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Top activities */}
          <section className="panel p-4 lg:col-span-1">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-gray-400" />
              Top activités
            </h2>
            {stats.ranking.length === 0 ? (
              <p className="text-xs text-gray-500">Aucune donnée.</p>
            ) : (
              <ul className="space-y-2">
                {stats.ranking.map((a, idx) => {
                  const max = stats.ranking[0].count || 1;
                  const pct = (a.count / max) * 100;
                  return (
                    <li key={a.id} className="text-xs">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-gray-400 tabular-nums w-3 text-right">
                            {idx + 1}
                          </span>
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: a.color }}
                          />
                          <span className="font-medium text-gray-800 truncate">
                            {a.name}
                          </span>
                        </div>
                        <span className="text-gray-900 font-semibold tabular-nums">
                          {a.count}
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden ml-5">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: a.color }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Recent registrations */}
          <section className="panel p-4 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                Dernières inscriptions
              </h2>
              <Link
                to="/registrations"
                className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline"
              >
                Tout voir
              </Link>
            </div>
            <ul className="divide-y divide-gray-100 -mx-1">
              {stats.recent.map(r => (
                <li key={r.id} className="px-1 py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {r.lastName} {r.firstName}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                      {formatDateLong(r.registrationDate)} · {PAYMENT_META[r.paymentType].label}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900 tabular-nums shrink-0">
                    {formatAmount(r.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
};

interface KpiCardProps {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  hint?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, iconClass, label, value, hint }) => (
  <div className="panel p-4">
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <span
        className={`inline-flex items-center justify-center h-7 w-7 rounded-full shrink-0 ${iconClass}`}
      >
        {icon}
      </span>
    </div>
    <p className="text-2xl font-bold text-gray-900 tabular-nums leading-tight">{value}</p>
    {hint && <p className="text-[11px] text-gray-500 tabular-nums mt-1">{hint}</p>}
  </div>
);

export default Home;
