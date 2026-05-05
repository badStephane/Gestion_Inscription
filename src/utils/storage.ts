import { Registration } from '../types';
import { getDb } from './db';

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  address: string;
  registration_date: string;
  payment_type: 'wave' | 'cash';
  amount: number;
  created_at: number;
}

const COLUMNS =
  'id, first_name, last_name, phone, email, address, registration_date, payment_type, amount, created_at';

const rowToRegistration = (r: Row): Registration => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  phone: r.phone,
  email: r.email ?? undefined,
  address: r.address,
  registrationDate: r.registration_date,
  paymentType: r.payment_type,
  amount: r.amount,
  createdAt: r.created_at,
});

export const getRegistrations = async (): Promise<Registration[]> => {
  const db = await getDb();
  const rows = await db.select<Row[]>(
    `SELECT ${COLUMNS} FROM registrations ORDER BY created_at DESC`
  );
  return rows.map(rowToRegistration);
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
      newRegistration.email ?? null,
      newRegistration.address,
      newRegistration.registrationDate,
      newRegistration.paymentType,
      newRegistration.amount,
      newRegistration.createdAt,
    ]
  );
  return newRegistration;
};

export const deleteRegistration = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM registrations WHERE id = $1', [id]);
};
