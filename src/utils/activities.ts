import { Activity } from '../types';
import { getDb } from './db';
import { logEvent } from './audit';
import { DEMO_MODE, demoActivities, demoRegistrations } from './demo';

interface Row {
  id: string;
  name: string;
  color: string;
  event_date: string | null;
  default_amount: number | null;
  archived_at: number | null;
  created_at: number;
}

const COLUMNS = 'id, name, color, event_date, default_amount, archived_at, created_at';

const rowToActivity = (r: Row): Activity => ({
  id: r.id,
  name: r.name,
  color: r.color,
  eventDate: r.event_date ?? undefined,
  defaultAmount: r.default_amount ?? undefined,
  archivedAt: r.archived_at ?? undefined,
  createdAt: r.created_at,
});

const byEventDateThenName = (a: Activity, b: Activity): number =>
  (a.eventDate ?? '9999-12-31').localeCompare(b.eventDate ?? '9999-12-31') ||
  a.name.localeCompare(b.name);

export const getActivities = async (includeArchived = false): Promise<Activity[]> => {
  if (DEMO_MODE) {
    const list = includeArchived
      ? [...demoActivities].sort(
          (a, b) =>
            Number(a.archivedAt != null) - Number(b.archivedAt != null) ||
            byEventDateThenName(a, b)
        )
      : demoActivities.filter((a) => a.archivedAt == null).sort(byEventDateThenName);
    return list;
  }
  const db = await getDb();
  const sql = includeArchived
    ? `SELECT ${COLUMNS} FROM activities ORDER BY archived_at IS NOT NULL, COALESCE(event_date, '9999-12-31'), name`
    : `SELECT ${COLUMNS} FROM activities WHERE archived_at IS NULL ORDER BY COALESCE(event_date, '9999-12-31'), name`;
  const rows = await db.select<Row[]>(sql);
  return rows.map(rowToActivity);
};

export const getActivityById = async (id: string): Promise<Activity | null> => {
  if (DEMO_MODE) return demoActivities.find((a) => a.id === id) ?? null;
  const db = await getDb();
  const rows = await db.select<Row[]>(
    `SELECT ${COLUMNS} FROM activities WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? rowToActivity(rows[0]) : null;
};

export const addActivity = async (
  data: Omit<Activity, 'id' | 'createdAt' | 'archivedAt'>
): Promise<Activity> => {
  const newActivity: Activity = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  if (DEMO_MODE) {
    demoActivities.push(newActivity);
    await logEvent('created', 'activity', newActivity.id, newActivity.name);
    return newActivity;
  }
  const db = await getDb();
  await db.execute(
    `INSERT INTO activities (id, name, color, event_date, default_amount, archived_at, created_at)
     VALUES ($1, $2, $3, $4, $5, NULL, $6)`,
    [
      newActivity.id,
      newActivity.name,
      newActivity.color,
      newActivity.eventDate ?? null,
      newActivity.defaultAmount ?? null,
      newActivity.createdAt,
    ]
  );
  await logEvent('created', 'activity', newActivity.id, newActivity.name);
  return newActivity;
};

export const updateActivity = async (
  activity: Omit<Activity, 'createdAt' | 'archivedAt'>
): Promise<void> => {
  if (DEMO_MODE) {
    const i = demoActivities.findIndex((a) => a.id === activity.id);
    if (i !== -1) demoActivities[i] = { ...demoActivities[i], ...activity };
    await logEvent('updated', 'activity', activity.id, activity.name);
    return;
  }
  const db = await getDb();
  await db.execute(
    `UPDATE activities SET name = $1, color = $2, event_date = $3, default_amount = $4 WHERE id = $5`,
    [
      activity.name,
      activity.color,
      activity.eventDate ?? null,
      activity.defaultAmount ?? null,
      activity.id,
    ]
  );
  await logEvent('updated', 'activity', activity.id, activity.name);
};

export const archiveActivity = async (id: string): Promise<void> => {
  if (DEMO_MODE) {
    const a = demoActivities.find((x) => x.id === id);
    if (a) {
      a.archivedAt = Date.now();
      await logEvent('archived', 'activity', id, a.name);
    }
    return;
  }
  const db = await getDb();
  const before = await getActivityById(id);
  await db.execute('UPDATE activities SET archived_at = $1 WHERE id = $2', [Date.now(), id]);
  if (before) await logEvent('archived', 'activity', id, before.name);
};

export const unarchiveActivity = async (id: string): Promise<void> => {
  if (DEMO_MODE) {
    const a = demoActivities.find((x) => x.id === id);
    if (a) {
      a.archivedAt = undefined;
      await logEvent('unarchived', 'activity', id, a.name);
    }
    return;
  }
  const db = await getDb();
  const before = await getActivityById(id);
  await db.execute('UPDATE activities SET archived_at = NULL WHERE id = $1', [id]);
  if (before) await logEvent('unarchived', 'activity', id, before.name);
};

export const countRegistrationsForActivity = async (id: string): Promise<number> => {
  if (DEMO_MODE) return demoRegistrations.filter((r) => r.activityId === id).length;
  const db = await getDb();
  const rows = await db.select<{ n: number }[]>(
    'SELECT COUNT(*) as n FROM registrations WHERE activity_id = $1',
    [id]
  );
  return rows[0]?.n ?? 0;
};

export const deleteActivity = async (id: string): Promise<void> => {
  if (DEMO_MODE) {
    const i = demoActivities.findIndex((a) => a.id === id);
    const before = i !== -1 ? demoActivities[i] : null;
    if (i !== -1) demoActivities.splice(i, 1);
    if (before) await logEvent('deleted', 'activity', id, before.name);
    return;
  }
  const db = await getDb();
  const before = await getActivityById(id);
  await db.execute('DELETE FROM activities WHERE id = $1', [id]);
  if (before) await logEvent('deleted', 'activity', id, before.name);
};
