import React, { useEffect, useMemo, useState } from 'react';
import { History, Trash2, RefreshCw } from 'lucide-react';
import { AuditEvent, EntityType, EventType, getAuditEvents, clearAuditLog } from '../utils/audit';
import ConfirmModal from '../components/ConfirmModal';
import Toast, { ToastVariant } from '../components/Toast';

const EVENT_LABEL: Record<EventType, string> = {
  created: 'Créée',
  updated: 'Modifiée',
  deleted: 'Supprimée',
  archived: 'Archivée',
  unarchived: 'Réactivée',
};

const EVENT_BADGE: Record<EventType, string> = {
  created: 'bg-emerald-100 text-emerald-700',
  updated: 'bg-blue-100 text-blue-700',
  deleted: 'bg-red-100 text-red-700',
  archived: 'bg-amber-100 text-amber-700',
  unarchived: 'bg-purple-100 text-purple-700',
};

const ENTITY_LABEL: Record<EntityType, string> = {
  registration: 'Inscription',
  activity: 'Activité',
};

const formatDateTime = (ts: number): string =>
  new Date(ts).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const Audit: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterEvent, setFilterEvent] = useState<EventType | ''>('');
  const [filterEntity, setFilterEntity] = useState<EntityType | ''>('');
  const [search, setSearch] = useState('');
  const [clearOpen, setClearOpen] = useState(false);
  const [toast, setToast] = useState<{ open: boolean; variant: ToastVariant; message: string }>({
    open: false,
    variant: 'success',
    message: '',
  });

  const showToast = (variant: ToastVariant, message: string) =>
    setToast({ open: true, variant, message });

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await getAuditEvents(500);
      setEvents(data);
    } catch (error) {
      console.error('Error loading audit log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = events;
    if (filterEvent) list = list.filter(e => e.eventType === filterEvent);
    if (filterEntity) list = list.filter(e => e.entityType === filterEntity);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(e => e.summary.toLowerCase().includes(term));
    }
    return list;
  }, [events, filterEvent, filterEntity, search]);

  const handleClear = async () => {
    setClearOpen(false);
    try {
      await clearAuditLog();
      await load();
      showToast('success', 'Journal d\'historique effacé.');
    } catch (error) {
      console.error('Error clearing audit log:', error);
      showToast('error', 'Erreur lors de la suppression.');
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col" aria-busy="true">
        <div className="toolbar">
          <div className="skeleton h-7 w-40 rounded" />
          <div className="skeleton h-7 w-32 rounded" />
          <div className="skeleton h-7 w-48 rounded" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="space-y-2 p-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-10 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="toolbar flex-wrap">
        <select
          value={filterEvent}
          onChange={(e) => setFilterEvent(e.target.value as EventType | '')}
          className="input-field w-auto py-1"
          aria-label="Filtrer par type d'événement"
        >
          <option value="">Tous les événements</option>
          <option value="created">Créées</option>
          <option value="updated">Modifiées</option>
          <option value="deleted">Supprimées</option>
          <option value="archived">Archivées</option>
          <option value="unarchived">Réactivées</option>
        </select>

        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value as EntityType | '')}
          className="input-field w-auto py-1"
          aria-label="Filtrer par type d'entité"
        >
          <option value="">Toutes les entités</option>
          <option value="registration">Inscriptions</option>
          <option value="activity">Activités</option>
        </select>

        <input
          type="text"
          placeholder="Rechercher dans les résumés..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field w-64 py-1"
          aria-label="Rechercher"
        />

        <button onClick={load} className="btn btn-default" title="Recharger">
          <RefreshCw className="h-3.5 w-3.5" />
          Recharger
        </button>

        <button
          onClick={() => setClearOpen(true)}
          disabled={events.length === 0}
          className={`btn btn-danger ${events.length === 0 ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Effacer
        </button>

        <span className="ml-auto text-xs text-gray-500">
          {filtered.length} / {events.length} événement{events.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <History className="h-10 w-10 mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              {events.length === 0 ? 'Aucun événement' : 'Aucun résultat pour ces filtres'}
            </p>
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600 w-44">Date</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600 w-28">Action</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600 w-28">Entité</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Détails</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-blue-50/50 transition-colors duration-75">
                  <td className="px-3 py-2 text-gray-700 tabular-nums whitespace-nowrap">
                    {formatDateTime(e.createdAt)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${EVENT_BADGE[e.eventType]}`}>
                      {EVENT_LABEL[e.eventType]}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{ENTITY_LABEL[e.entityType]}</td>
                  <td className="px-3 py-2 text-gray-900">{e.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={clearOpen}
        title="Effacer le journal d'historique"
        message="Tous les événements enregistrés seront définitivement supprimés. Les inscriptions et activités ne seront pas affectées."
        confirmLabel="Tout effacer"
        variant="danger"
        onConfirm={handleClear}
        onCancel={() => setClearOpen(false)}
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

export default Audit;
