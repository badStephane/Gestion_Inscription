import { Activity } from '../types';
import { getDb } from './db';

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

export const getActivities = async (includeArchived = false): Promise<Activity[]> => {
  const db = await getDb();
  const sql = includeArchived
    ? `SELECT ${COLUMNS} FROM activities ORDER BY archived_at IS NOT NULL, COALESCE(event_date, '9999-12-31'), name`
    : `SELECT ${COLUMNS} FROM activities WHERE archived_at IS NULL ORDER BY COALESCE(event_date, '9999-12-31'), name`;
  const rows = await db.select<Row[]>(sql);
  return rows.map(rowToActivity);
};

export const getActivityById = async (id: string): Promise<Activity | null> => {
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
  const db = await getDb();
  const newActivity: Activity = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
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
  return newActivity;
};

export const updateActivity = async (
  activity: Omit<Activity, 'createdAt' | 'archivedAt'>
): Promise<void> => {
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
};

export const archiveActivity = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE activities SET archived_at = $1 WHERE id = $2', [Date.now(), id]);
};

export const unarchiveActivity = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.execute('UPDATE activities SET archived_at = NULL WHERE id = $1', [id]);
};

export const countRegistrationsForActivity = async (id: string): Promise<number> => {
  const db = await getDb();
  const rows = await db.select<{ n: number }[]>(
    'SELECT COUNT(*) as n FROM registrations WHERE activity_id = $1',
    [id]
  );
  return rows[0]?.n ?? 0;
};

export const deleteActivity = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM activities WHERE id = $1', [id]);
};
