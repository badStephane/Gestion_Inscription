import { getDb } from './db';
import { DEMO_MODE, demoAudit } from './demo';

export type EventType = 'created' | 'updated' | 'deleted' | 'archived' | 'unarchived';
export type EntityType = 'registration' | 'activity';

export interface AuditEvent {
  id: string;
  eventType: EventType;
  entityType: EntityType;
  entityId: string;
  summary: string;
  details?: string;
  createdAt: number;
}

interface Row {
  id: string;
  event_type: EventType;
  entity_type: EntityType;
  entity_id: string;
  summary: string;
  details: string | null;
  created_at: number;
}

const rowToEvent = (r: Row): AuditEvent => ({
  id: r.id,
  eventType: r.event_type,
  entityType: r.entity_type,
  entityId: r.entity_id,
  summary: r.summary,
  details: r.details ?? undefined,
  createdAt: r.created_at,
});

/**
 * Best-effort audit log. Failures are swallowed (console.warn) so the
 * user's CRUD operation isn't blocked by an audit issue.
 */
export const logEvent = async (
  eventType: EventType,
  entityType: EntityType,
  entityId: string,
  summary: string,
  details?: object
): Promise<void> => {
  if (DEMO_MODE) {
    demoAudit.unshift({
      id: crypto.randomUUID(),
      eventType,
      entityType,
      entityId,
      summary,
      details: details ? JSON.stringify(details) : undefined,
      createdAt: Date.now(),
    });
    return;
  }
  try {
    const db = await getDb();
    await db.execute(
      'INSERT INTO audit_events (id, event_type, entity_type, entity_id, summary, details, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        crypto.randomUUID(),
        eventType,
        entityType,
        entityId,
        summary,
        details ? JSON.stringify(details) : null,
        Date.now(),
      ]
    );
  } catch (error) {
    console.warn('Failed to log audit event:', error);
  }
};

export const getAuditEvents = async (limit = 500): Promise<AuditEvent[]> => {
  if (DEMO_MODE) {
    return [...demoAudit].sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  }
  const db = await getDb();
  const rows = await db.select<Row[]>(
    'SELECT id, event_type, entity_type, entity_id, summary, details, created_at FROM audit_events ORDER BY created_at DESC LIMIT $1',
    [limit]
  );
  return rows.map(rowToEvent);
};

export const clearAuditLog = async (): Promise<void> => {
  if (DEMO_MODE) {
    demoAudit.length = 0;
    return;
  }
  const db = await getDb();
  await db.execute('DELETE FROM audit_events');
};
