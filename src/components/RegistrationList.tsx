import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getRegistrations, deleteRegistration } from '../utils/storage';
import { exportToExcel } from '../utils/excelExport';
import { exportDatabase, importDatabase } from '../utils/dbBackup';
import { getActivities } from '../utils/activities';
import { Registration, Activity } from '../types';
import ConfirmModal from './ConfirmModal';
import Toast, { ToastVariant } from './Toast';
import {
  Download,
  Search,
  Trash2,
  Save,
  Upload,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type SortKey = 'name' | 'date' | 'amount' | 'payment';
type SortDirection = 'asc' | 'desc';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

const compareRegistrations = (
  a: Registration,
  b: Registration,
  key: SortKey
): number => {
  switch (key) {
    case 'name': {
      const an = `${a.lastName} ${a.firstName}`.toLowerCase();
      const bn = `${b.lastName} ${b.firstName}`.toLowerCase();
      return an.localeCompare(bn, 'fr');
    }
    case 'date':
      return a.registrationDate.localeCompare(b.registrationDate);
    case 'amount':
      return a.amount - b.amount;
    case 'payment':
      return a.paymentType.localeCompare(b.paymentType);
  }
};

const RegistrationList: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [filterActivity, setFilterActivity] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; variant: ToastVariant; message: string }>({
    open: false,
    variant: 'success',
    message: '',
  });

  const showToast = (variant: ToastVariant, message: string) =>
    setToast({ open: true, variant, message });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPayment, filterActivity, sortKey, sortDirection, pageSize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [data, acts] = await Promise.all([getRegistrations(), getActivities(true)]);
        if (cancelled) return;
        setRegistrations(data);
        setFilteredRegistrations(data);
        setActivities(acts);
      } catch (error) {
        console.error('Error loading registrations or activities:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const activitiesById = useMemo(() => {
    const map: Record<string, Activity> = {};
    for (const a of activities) map[a.id] = a;
    return map;
  }, [activities]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterPayment, filterActivity, registrations, sortKey, sortDirection]);

  const applyFilters = () => {
    let filtered = [...registrations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.firstName.toLowerCase().includes(term) ||
        reg.lastName.toLowerCase().includes(term) ||
        reg.phone.toLowerCase().includes(term) ||
        reg.address.toLowerCase().includes(term)
      );
    }

    if (filterPayment) {
      filtered = filtered.filter(reg => reg.paymentType === filterPayment);
    }

    if (filterActivity) {
      filtered = filtered.filter(reg => reg.activityId === filterActivity);
    }

    if (sortKey) {
      const dir = sortDirection === 'asc' ? 1 : -1;
      filtered.sort((a, b) => compareRegistrations(a, b, sortKey) * dir);
    }

    setFilteredRegistrations(filtered);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon: React.FC<{ column: SortKey }> = ({ column }) => {
    if (sortKey !== column) {
      return <ChevronsUpDown className="h-3 w-3 ml-0.5 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-0.5 text-gray-700" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-0.5 text-gray-700" />
    );
  };

  const handleExport = () => {
    if (filteredRegistrations.length > 0) {
      exportToExcel(filteredRegistrations, activities);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteRegistration(deleteTargetId);
      setRegistrations(prev => prev.filter(reg => reg.id !== deleteTargetId));
      showToast('success', 'Inscription supprimee.');
    } catch (error) {
      console.error('Error deleting registration:', error);
      showToast('error', 'Erreur lors de la suppression.');
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleBackup = async () => {
    try {
      const ok = await exportDatabase();
      if (ok) showToast('success', 'Base de donnees sauvegardee.');
    } catch (error) {
      console.error('Error exporting database:', error);
      showToast('error', 'Erreur lors de la sauvegarde.');
    }
  };

  const confirmRestore = async () => {
    setRestoreOpen(false);
    try {
      const ok = await importDatabase();
      if (ok) {
        showToast('success', 'Base restauree. Redemarrage...');
        setTimeout(() => window.location.reload(), 1200);
      }
    } catch (error) {
      console.error('Error importing database:', error);
      showToast('error', 'Erreur lors de la restauration.');
    }
  };

  const stats = useMemo(() => {
    const wave = registrations.filter(r => r.paymentType === 'wave');
    const cash = registrations.filter(r => r.paymentType === 'cash');
    const sum = (rs: Registration[]) => rs.reduce((acc, r) => acc + r.amount, 0);
    return {
      total: registrations.length,
      totalAmount: sum(registrations),
      waveCount: wave.length,
      waveAmount: sum(wave),
      cashCount: cash.length,
      cashAmount: sum(cash),
    };
  }, [registrations]);

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRegistrations.length);
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats strip */}
      {stats.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 px-3 py-2 border-b border-gray-200 bg-white">
          <div className="panel px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Inscriptions</div>
            <div className="text-base font-semibold text-gray-900 mt-0.5">{stats.total}</div>
          </div>
          <div className="panel px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500">Montant total</div>
            <div className="text-base font-semibold text-gray-900 mt-0.5">{formatAmount(stats.totalAmount)}</div>
          </div>
          <div className="panel px-3 py-2 border-l-2 border-l-purple-400">
            <div className="text-[10px] font-medium uppercase tracking-wider text-purple-700">Wave</div>
            <div className="text-base font-semibold text-gray-900 mt-0.5">
              {stats.waveCount} <span className="text-xs font-normal text-gray-500">· {formatAmount(stats.waveAmount)}</span>
            </div>
          </div>
          <div className="panel px-3 py-2 border-l-2 border-l-emerald-400">
            <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-700">Espece</div>
            <div className="text-base font-semibold text-gray-900 mt-0.5">
              {stats.cashCount} <span className="text-xs font-normal text-gray-500">· {formatAmount(stats.cashAmount)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="toolbar flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-7 w-48 py-1"
          />
        </div>

        {/* Activity filter */}
        <select
          value={filterActivity}
          onChange={(e) => setFilterActivity(e.target.value)}
          className="input-field w-auto py-1"
        >
          <option value="">Toutes les activités</option>
          {activities.map(a => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.archivedAt ? ' (archivée)' : ''}
            </option>
          ))}
        </select>

        {/* Payment filter */}
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="input-field w-auto py-1"
        >
          <option value="">Tous les paiements</option>
          <option value="cash">Espece</option>
          <option value="wave">Wave</option>
        </select>

        <div className="h-4 w-px bg-gray-300 mx-1"></div>

        {/* Actions */}
        <button
          onClick={handleExport}
          disabled={filteredRegistrations.length === 0}
          className={`btn btn-success ${filteredRegistrations.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Download className="h-3.5 w-3.5" />
          Excel
        </button>

        <button onClick={handleBackup} className="btn btn-default">
          <Save className="h-3.5 w-3.5" />
          Sauvegarder
        </button>

        <button onClick={() => setRestoreOpen(true)} className="btn btn-warning">
          <Upload className="h-3.5 w-3.5" />
          Restaurer
        </button>

        {/* Count */}
        <span className="ml-auto text-xs text-gray-500">
          {filteredRegistrations.length} / {registrations.length} inscription(s)
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {filteredRegistrations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <p className="text-sm">Aucune inscription trouvee</p>
            {(searchTerm || filterPayment || filterActivity) && (
              <button
                onClick={() => { setSearchTerm(''); setFilterPayment(''); setFilterActivity(''); }}
                className="mt-2 text-xs text-blue-600 hover:underline"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center hover:text-gray-900"
                  >
                    Inscrit <SortIcon column="name" />
                  </button>
                </th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Activité</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Adresse</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={() => toggleSort('date')}
                    className="inline-flex items-center hover:text-gray-900"
                  >
                    Date <SortIcon column="date" />
                  </button>
                </th>
                <th className="text-right px-3 py-2 font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center hover:text-gray-900"
                  >
                    Montant <SortIcon column="amount" />
                  </button>
                </th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">
                  <button
                    type="button"
                    onClick={() => toggleSort('payment')}
                    className="inline-flex items-center hover:text-gray-900"
                  >
                    Paiement <SortIcon column="payment" />
                  </button>
                </th>
                <th className="text-center px-3 py-2 font-medium text-gray-600 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedRegistrations.map(registration => (
                <tr key={registration.id} className="hover:bg-blue-50/50 transition-colors duration-75">
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-900">
                      {registration.lastName} {registration.firstName}
                    </div>
                    <div className="text-gray-500">{registration.phone}</div>
                  </td>
                  <td className="px-3 py-2">
                    {(() => {
                      const a = activitiesById[registration.activityId];
                      if (!a) return <span className="text-gray-400">—</span>;
                      return (
                        <span className="inline-flex items-center gap-1.5 max-w-[160px]">
                          <span
                            className="h-2 w-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: a.color }}
                          />
                          <span className="truncate text-gray-700" title={a.name}>{a.name}</span>
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-3 py-2 text-gray-700">
                    <div className="truncate max-w-[180px]" title={registration.address}>
                      {registration.address}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {new Date(registration.registrationDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900 whitespace-nowrap">
                    {formatAmount(registration.amount)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
                      registration.paymentType === 'wave'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {registration.paymentType === 'wave' ? 'Wave' : 'Espece'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        to={`/edit/${registration.id}`}
                        className="p-1 rounded hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteTargetId(registration.id)}
                        className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination bar */}
      {filteredRegistrations.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Lignes par page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="input-field w-auto py-0.5 px-1.5 text-xs"
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <span>{startIndex + 1}-{endIndex} sur {filteredRegistrations.length}</span>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Supprimer l'inscription"
        message="Cette inscription sera definitivement supprimee. Cette action est irreversible."
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmModal
        open={restoreOpen}
        title="Restaurer la base de donnees"
        message="Toutes les inscriptions actuelles seront remplacees par celles du fichier importe. Continuer ?"
        confirmLabel="Restaurer"
        variant="danger"
        onConfirm={confirmRestore}
        onCancel={() => setRestoreOpen(false)}
      />

      <Toast
        open={toast.open}
        variant={toast.variant}
        message={toast.message}
        onClose={() => setToast(t => ({ ...t, open: false }))}
      />
    </div>
  );
};

export default RegistrationList;
