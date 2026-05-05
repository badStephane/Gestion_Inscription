import { Registration } from '../types';
import { getDb } from './db';

interface Row {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  registration_date: string;
  payment_type: 'wave' | 'cash';
  created_at: number;
}

const rowToRegistration = (r: Row): Registration => ({
  id: r.id,
  firstName: r.first_name,
  lastName: r.last_name,
  address: r.address,
  registrationDate: r.registration_date,
  paymentType: r.payment_type,
  createdAt: r.created_at,
});

export const getRegistrations = async (): Promise<Registration[]> => {
  const db = await getDb();
  const rows = await db.select<Row[]>(
    'SELECT id, first_name, last_name, address, registration_date, payment_type, created_at FROM registrations ORDER BY created_at DESC'
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
    'INSERT INTO registrations (id, first_name, last_name, address, registration_date, payment_type, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [
      newRegistration.id,
      newRegistration.firstName,
      newRegistration.lastName,
      newRegistration.address,
      newRegistration.registrationDate,
      newRegistration.paymentType,
      newRegistration.createdAt,
    ]
  );
  return newRegistration;
};

export const deleteRegistration = async (id: string): Promise<void> => {
  const db = await getDb();
  await db.execute('DELETE FROM registrations WHERE id = $1', [id]);
};
