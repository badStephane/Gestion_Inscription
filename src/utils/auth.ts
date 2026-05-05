import { getDb } from './db';

const ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

interface AuthRow {
  password_hash: string;
  salt: string;
  iterations: number;
}

const toBase64 = (bytes: Uint8Array): string => {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
};

const fromBase64 = (s: string): Uint8Array => {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

const constantTimeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const derive = async (
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<string> => {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passwordKey,
    HASH_BITS
  );
  return toBase64(new Uint8Array(bits));
};

const getAuthRow = async (): Promise<AuthRow | null> => {
  const db = await getDb();
  const rows = await db.select<AuthRow[]>(
    'SELECT password_hash, salt, iterations FROM auth_settings WHERE id = 1 LIMIT 1'
  );
  return rows.length > 0 ? rows[0] : null;
};

export const hasPassword = async (): Promise<boolean> => {
  const row = await getAuthRow();
  return row !== null;
};

export const setPassword = async (password: string): Promise<void> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  const db = await getDb();
  await db.execute('DELETE FROM auth_settings WHERE id = 1');
  await db.execute(
    'INSERT INTO auth_settings (id, password_hash, salt, iterations, created_at) VALUES (1, $1, $2, $3, $4)',
    [hash, toBase64(salt), ITERATIONS, Date.now()]
  );
};

export const verifyPassword = async (password: string): Promise<boolean> => {
  const row = await getAuthRow();
  if (!row) return false;
  const candidate = await derive(password, fromBase64(row.salt), row.iterations);
  return constantTimeEqual(candidate, row.password_hash);
};

export const hasRecoveryCode = async (): Promise<boolean> => {
  const db = await getDb();
  const rows = await db.select<{ recovery_hash: string | null }[]>(
    'SELECT recovery_hash FROM auth_settings WHERE id = 1 LIMIT 1'
  );
  return rows.length > 0 && rows[0].recovery_hash !== null && rows[0].recovery_hash !== '';
};

export const setRecoveryCode = async (code: string): Promise<void> => {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(code, salt, ITERATIONS);
  const db = await getDb();
  await db.execute(
    'UPDATE auth_settings SET recovery_hash = $1, recovery_salt = $2, recovery_iterations = $3 WHERE id = 1',
    [hash, toBase64(salt), ITERATIONS]
  );
};

export const verifyRecoveryCode = async (code: string): Promise<boolean> => {
  const db = await getDb();
  const rows = await db.select<
    {
      recovery_hash: string | null;
      recovery_salt: string | null;
      recovery_iterations: number | null;
    }[]
  >(
    'SELECT recovery_hash, recovery_salt, recovery_iterations FROM auth_settings WHERE id = 1 LIMIT 1'
  );
  if (rows.length === 0) return false;
  const r = rows[0];
  if (!r.recovery_hash || !r.recovery_salt || !r.recovery_iterations) return false;
  const candidate = await derive(code, fromBase64(r.recovery_salt), r.recovery_iterations);
  return constantTimeEqual(candidate, r.recovery_hash);
};

export const clearRecoveryCode = async (): Promise<void> => {
  const db = await getDb();
  await db.execute(
    'UPDATE auth_settings SET recovery_hash = NULL, recovery_salt = NULL, recovery_iterations = NULL WHERE id = 1'
  );
};

export const resetAuthAndData = async (): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM auth_settings');
  await db.execute('DELETE FROM registrations');
};
