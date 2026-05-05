import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Archive, ArchiveRestore, Trash2, CalendarDays, Users, Lock } from 'lucide-react';
import { Activity, DEFAULT_ACTIVITY_ID } from '../types';
import {
  getActivities,
  archiveActivity,
  unarchiveActivity,
  countRegistrationsForActivity,
  deleteActivity,
} from '../utils/activities';
import ActivityFormModal from '../components/ActivityFormModal';
import ConfirmModal from '../components/ConfirmModal';
import Toast, { ToastVariant } from '../components/Toast';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
  const [toast, setToast] = useState<{ open: boolean; variant: ToastVariant; message: string }>({
    open: false,
    variant: 'success',
    message: '',
  });

  const showToast = (variant: ToastVariant, message: string) =>
    setToast({ open: true, variant, message });

  const loadActivities = async () => {
    try {
      const list = await getActivities(true);
      setActivities(list);
      const c: Record<string, number> = {};
      await Promise.all(
        list.map(async a => {
          c[a.id] = await countRegistrationsForActivity(a.id);
        })
      );
      setCounts(c);
    } catch (error) {
      console.error('Error loading activities:', error);
      showToast('error', 'Erreur lors du chargement.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const handleNew = () => {
    setEditingActivity(null);
    setFormOpen(true);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormOpen(true);
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditingActivity(null);
    loadActivities();
    showToast('success', 'Activité enregistrée.');
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      if (archiveTarget.archivedAt) {
        await unarchiveActivity(archiveTarget.id);
        showToast('success', 'Activité réactivée.');
      } else {
        await archiveActivity(archiveTarget.id);
        showToast('success', 'Activité archivée.');
      }
      await loadActivities();
    } catch (error) {
      console.error('Error toggling archive:', error);
      showToast('error', 'Erreur lors de l\'opération.');
    } finally {
      setArchiveTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteActivity(deleteTarget.id);
      showToast('success', 'Activité supprimée.');
      await loadActivities();
    } catch (error) {
      console.error('Error deleting activity:', error);
      showToast('error', 'Erreur lors de la suppression.');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  const active = activities.filter(a => !a.archivedAt);
  const archived = activities.filter(a => a.archivedAt);

  const renderRow = (a: Activity) => {
    const count = counts[a.id] ?? 0;
    const isDefault = a.id === DEFAULT_ACTIVITY_ID;
    const isArchived = !!a.archivedAt;
    return (
      <div
        key={a.id}
        className={`panel px-3 py-2.5 flex items-center gap-3 ${isArchived ? 'opacity-60' : ''}`}
      >
        <div
          className="h-3 w-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: a.color }}
          aria-label="Couleur"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">{a.name}</h3>
            {isDefault && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                <Lock className="h-2.5 w-2.5" /> par défaut
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
            {a.eventDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(a.eventDate).toLocaleDateString('fr-FR')}
              </span>
            )}
            {a.defaultAmount !== undefined && a.defaultAmount > 0 && (
              <span className="tabular-nums">{formatAmount(a.defaultAmount)}</span>
            )}
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {count}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleEdit(a)}
            aria-label={`Modifier ${a.name}`}
            title="Modifier"
            className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          {!isDefault && (
            <button
              onClick={() => setArchiveTarget(a)}
              aria-label={`${isArchived ? 'Réactiver' : 'Archiver'} ${a.name}`}
              title={isArchived ? 'Réactiver' : 'Archiver'}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-600"
            >
              {isArchived
                ? <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                : <Archive className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          )}
          {!isDefault && count === 0 && (
            <button
              onClick={() => setDeleteTarget(a)}
              aria-label={`Supprimer ${a.name}`}
              title="Supprimer"
              className="p-1.5 rounded hover:bg-red-50 text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-gray-800">Activités</h1>
        <button onClick={handleNew} className="btn btn-primary">
          <Plus className="h-3.5 w-3.5" />
          Nouvelle activité
        </button>
      </div>

      {active.length === 0 && archived.length === 0 ? (
        <div className="panel p-8 text-center text-gray-500">
          <p className="text-sm">Aucune activité. Créez la première.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.length > 0 && (
            <div className="space-y-2">
              {active.map(renderRow)}
            </div>
          )}

          {archived.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 mt-4">
                Archivées ({archived.length})
              </h2>
              <div className="space-y-2">
                {archived.map(renderRow)}
              </div>
            </div>
          )}
        </div>
      )}

      <ActivityFormModal
        open={formOpen}
        activity={editingActivity}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmModal
        open={archiveTarget !== null}
        title={archiveTarget?.archivedAt ? 'Réactiver l\'activité' : 'Archiver l\'activité'}
        message={
          archiveTarget?.archivedAt
            ? `« ${archiveTarget?.name} » sera de nouveau disponible dans le formulaire d'inscription.`
            : `« ${archiveTarget?.name} » sera masquée du formulaire mais ses inscriptions existantes restent intactes.`
        }
        confirmLabel={archiveTarget?.archivedAt ? 'Réactiver' : 'Archiver'}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Supprimer l'activité"
        message={`« ${deleteTarget?.name} » sera définitivement supprimée. Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
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

export default Activities;
