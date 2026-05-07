import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  ClipboardList,
  Users,
  Coins,
  CalendarClock,
  CalendarRange,
  Clock,
  CalendarDays,
  Hourglass,
  BarChart3,
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

const daysBetween = (fromIso: string, toIso: string): number => {
  const a = new Date(fromIso);
  const b = new Date(toIso);
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return 0;
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
};

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

const STORAGE_KEY = 'home.currentActivityId';

const pickCurrentActivity = (activities: Activity[]): Activity | null => {
  const live = activities.filter(a => !a.archivedAt);
  if (live.length === 0) return null;

  const today = todayIso();
  const upcoming = live
    .filter(a => a.eventDate && a.eventDate >= today)
    .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? ''));
  if (upcoming.length > 0) return upcoming[0];

  // No upcoming → fall back to most recently created non-archived
  return live.slice().sort((a, b) => b.createdAt - a.createdAt)[0];
};

interface PaymentBreakdown {
  type: Registration['paymentType'];
  count: number;
  amount: number;
  share: number;
}

interface DashboardData {
  registrations: Registration[];
  activities: Activity[];
}

const Home: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [currentActivityId, setCurrentActivityIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  });

  const setCurrentActivityId = (id: string) => {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
    setCurrentActivityIdState(id);
  };

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
        // Auto-pick current activity if none selected, or stored id is no
        // longer valid (deleted, archived).
        const stored = localStorage.getItem(STORAGE_KEY);
        const liveActivities = activities.filter(a => !a.archivedAt);
        const isStoredValid = stored && liveActivities.some(a => a.id === stored);
        if (!isStoredValid) {
          const auto = pickCurrentActivity(activities);
          if (auto) setCurrentActivityId(auto.id);
        }
      } catch {
        if (!cancelled) setData({ registrations: [], activities: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const currentActivity = useMemo(() => {
    if (!data) return null;
    return data.activities.find(a => a.id === currentActivityId) ?? null;
  }, [data, currentActivityId]);

  const liveActivities = useMemo(() => {
    if (!data) return [];
    return data.activities
      .filter(a => !a.archivedAt)
      .sort((a, b) => {
        const ad = a.eventDate ?? '9999-12-31';
        const bd = b.eventDate ?? '9999-12-31';
        return ad.localeCompare(bd);
      });
  }, [data]);

  const stats = useMemo(() => {
    if (!data || !currentActivity) return null;
    const registrations = data.registrations.filter(r => r.activityId === currentActivity.id);

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
      recent,
    };
  }, [data, currentActivity]);

  if (data === null) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="skeleton h-9 w-72 rounded mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel p-4">
              <div className="skeleton h-3 w-24 rounded mb-2" />
              <div className="skeleton h-7 w-20 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="panel p-4 skeleton h-48" />
          <div className="panel p-4 skeleton h-48" />
          <div className="panel p-4 skeleton h-48" />
        </div>
      </div>
    );
  }

  // No activity at all
  if (liveActivities.length === 0) {
    return (
      <div className="p-6 max-w-6xl">
        <div className="panel p-8 text-center">
          <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-700 mb-1">Aucune activité active</p>
          <p className="text-xs text-gray-500 mb-4">
            Créez une activité pour commencer à suivre ses inscriptions ici.
          </p>
          <Link to="/activities" className="btn btn-primary">
            <CalendarDays className="h-3.5 w-3.5" />
            Aller aux activités
          </Link>
        </div>
      </div>
    );
  }

  const isEmpty = !stats || stats.total === 0;
  const daysToEvent = currentActivity?.eventDate
    ? daysBetween(todayIso(), currentActivity.eventDate)
    : null;

  return (
    <div className="p-6 max-w-6xl">
      {/* Activity selector header */}
      <div className="mb-4 panel px-4 py-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-block h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: currentActivity?.color ?? '#94a3b8' }}
          />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Activité en cours
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {currentActivity?.name ?? 'Aucune'}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {currentActivity?.eventDate && (
            <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-gray-600">
              <Hourglass className="h-3.5 w-3.5 text-gray-400" />
              {daysToEvent !== null && daysToEvent > 0 && (
                <>Dans <b className="tabular-nums">{daysToEvent}</b> jour{daysToEvent > 1 ? 's' : ''}</>
              )}
              {daysToEvent === 0 && <>C'est aujourd'hui !</>}
              {daysToEvent !== null && daysToEvent < 0 && (
                <>Il y a <b className="tabular-nums">{-daysToEvent}</b> jour{-daysToEvent > 1 ? 's' : ''}</>
              )}
            </span>
          )}

          <label className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="hidden sm:inline">Activité :</span>
            <select
              value={currentActivityId}
              onChange={(e) => setCurrentActivityId(e.target.value)}
              aria-label="Choisir l'activité affichée"
              className="input-field w-auto py-1"
            >
              {liveActivities.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.eventDate ? ` — ${formatDateLong(a.eventDate)}` : ''}
                </option>
              ))}
            </select>
          </label>

          {currentActivity && (
            <Link
              to={`/activities/${currentActivity.id}/stats`}
              className="btn btn-ghost"
              title="Statistiques détaillées"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Stats</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard
          icon={<Users className="h-4 w-4" />}
          iconClass="bg-slate-100 text-slate-700"
          label="Inscriptions"
          value={(stats?.total ?? 0).toLocaleString('fr-FR')}
          hint={
            stats && stats.avgTicket > 0
              ? `Panier moyen ${formatAmount(stats.avgTicket)}`
              : undefined
          }
        />
        <KpiCard
          icon={<Coins className="h-4 w-4" />}
          iconClass="bg-amber-100 text-amber-700"
          label="Montant collecté"
          value={formatAmount(stats?.totalAmount ?? 0)}
        />
        <KpiCard
          icon={<CalendarClock className="h-4 w-4" />}
          iconClass="bg-blue-100 text-blue-700"
          label="Aujourd'hui"
          value={(stats?.todayCount ?? 0).toLocaleString('fr-FR')}
          hint={stats && stats.todayCount > 0 ? formatAmount(stats.todayAmount) : '—'}
        />
        <KpiCard
          icon={<CalendarRange className="h-4 w-4" />}
          iconClass="bg-violet-100 text-violet-700"
          label="Ce mois-ci"
          value={(stats?.monthCount ?? 0).toLocaleString('fr-FR')}
          hint={stats && stats.monthCount > 0 ? formatAmount(stats.monthAmount) : '—'}
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
            Aucune inscription pour {currentActivity?.name ?? 'cette activité'}
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Créez la première inscription pour cette activité.
          </p>
          <Link to="/add" className="btn btn-primary">
            <PlusCircle className="h-3.5 w-3.5" />
            Créer une inscription
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
              {stats!.breakdown
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
              {stats!.breakdown.map(b => (
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

          {/* Activity details */}
          <section className="panel p-4 lg:col-span-1">
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              Détails de l'activité
            </h2>
            {currentActivity && (
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Nom</dt>
                  <dd className="text-gray-900 font-medium truncate">{currentActivity.name}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Date d'événement</dt>
                  <dd className="text-gray-900 tabular-nums">
                    {currentActivity.eventDate ? formatDateLong(currentActivity.eventDate) : '—'}
                  </dd>
                </div>
                {daysToEvent !== null && (
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500">Temps restant</dt>
                    <dd className="text-gray-900 tabular-nums">
                      {daysToEvent > 0 && `Dans ${daysToEvent} jour${daysToEvent > 1 ? 's' : ''}`}
                      {daysToEvent === 0 && "C'est aujourd'hui !"}
                      {daysToEvent < 0 && `Il y a ${-daysToEvent} jour${-daysToEvent > 1 ? 's' : ''}`}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Montant par défaut</dt>
                  <dd className="text-gray-900 tabular-nums">
                    {currentActivity.defaultAmount && currentActivity.defaultAmount > 0
                      ? formatAmount(currentActivity.defaultAmount)
                      : '—'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-gray-500">Couleur</dt>
                  <dd className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: currentActivity.color }}
                    />
                    <span className="text-gray-900 tabular-nums uppercase">
                      {currentActivity.color}
                    </span>
                  </dd>
                </div>
              </dl>
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
              {stats!.recent.map(r => (
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
