import { Registration } from '../types';
import { getDb } from './db';

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  address: string;
  registration_date: string;
  payment_type: 'wave' | 'cash' | 'orange_money';
  amount: number;
  activity_id: string;
  created_at: number;
}

const COLUMNS =
  'id, first_name, last_name, phone, address, registration_date, payment_type, amount, activity_id, created_at';

const rowToRegistration = (r: Row): Registration => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  phone: r.phone,
  address: r.address,
  registrationDate: r.registration_date,
  paymentType: r.payment_type,
  amount: r.amount,
  activityId: r.activity_id,
  createdAt: r.created_at,
});

export const getRegistrations = async (): Promise<Registration[]> => {
  const db = await getDb();
  const rows = await db.select<Row[]>(
    `SELECT ${COLUMNS} FROM registrations ORDER BY created_at DESC`
  );
  return rows.map(rowToRegistration);
};

export const getRegistrationById = async (id: string): Promise<Registration | null> => {
  const db = await getDb();
  const rows = await db.select<Row[]>(
    `SELECT ${COLUMNS} FROM registrations WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? rowToRegistration(rows[0]) : null;
};

export const findDuplicateRegistration = async (
  activityId: string,
  lastName: string,
  firstName: string,
  phone: string,
  excludeId?: string
): Promise<Registration | null> => {
  const db = await getDb();
  const phoneDigits = phone.replace(/\D/g, '');
  const sql = excludeId
    ? `SELECT ${COLUMNS} FROM registrations
         WHERE activity_id = $1
           AND LOWER(TRIM(last_name)) = LOWER(TRIM($2))
           AND LOWER(TRIM(first_name)) = LOWER(TRIM($3))
           AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE $4
           AND id != $5
         LIMIT 1`
    : `SELECT ${COLUMNS} FROM registrations
         WHERE activity_id = $1
           AND LOWER(TRIM(last_name)) = LOWER(TRIM($2))
           AND LOWER(TRIM(first_name)) = LOWER(TRIM($3))
           AND REPLACE(REPLACE(REPLACE(phone, ' ', ''), '-', ''), '+', '') LIKE $4
         LIMIT 1`;
  const params = excludeId
    ? [activityId, lastName, firstName, `%${phoneDigits}%`, excludeId]
    : [activityId, lastName, firstName, `%${phoneDigits}%`];
  const rows = await db.select<Row[]>(sql, params);
  return rows.length > 0 ? rowToRegistration(rows[0]) : null;
};

export const addRegistration = async (
  registration: Omit<Registration, 'id' | 'createdAt'>
): Promise<Registration> => {
  const db = await getDb();
  const newRegistration: Registration = {
    ...registration,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  await db.execute(
    `INSERT INTO registrations (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      newRegistration.id,
      newRegistration.firstName,
      newRegistration.lastName,
      newRegistration.phone,
      newRegistration.address,
      newRegistration.registrationDate,
      newRegistration.paymentType,
      newRegistration.amount,
      newRegistration.activityId,
      newRegistration.createdAt,
    ]
  );
  return newRegistration;
};

export const updateRegistration = async (
  registration: Omit<Registration, 'createdAt'>
): Promise<void> => {
  const db = await getDb();
  await db.execute(
    `UPDATE registrations SET
       first_name = $1,
       last_name = $2,
       phone = $3,
       address = $4,
       registration_date = $5,
       payment_type = $6,
       amount = $7,
       activity_id = $8
     WHERE id = $9`,
    [
      registration.firstName,
      registration.lastName,
      registration.phone,
      registration.address,
      registration.registrationDate,
      registration.paymentType,
      registration.amount,
      registration.activityId,
      registration.id,
    ]
  );
};

export const deleteRegistration = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM registrations WHERE id = $1', [id]);
};

export const addRegistrationsBulk = async (
  registrations: Omit<Registration, 'id' | 'createdAt'>[]
): Promise<Registration[]> => {
  const db = await getDb();
  const inserted: Registration[] = [];
  await db.execute('BEGIN');
  try {
    for (const reg of registrations) {
      const newReg: Registration = {
        ...reg,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
      };
      await db.execute(
        `INSERT INTO registrations (${COLUMNS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          newReg.id,
          newReg.firstName,
          newReg.lastName,
          newReg.phone,
          newReg.address,
          newReg.registrationDate,
          newReg.paymentType,
          newReg.amount,
          newReg.activityId,
          newReg.createdAt,
        ]
      );
      inserted.push(newReg);
    }
    await db.execute('COMMIT');
    return inserted;
  } catch (error) {
    await db.execute('ROLLBACK');
    throw error;
  }
};
