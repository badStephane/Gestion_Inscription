import * as XLSX from 'xlsx';
import { Registration, Activity } from '../types';

const PAYMENT_LABEL: Record<Registration['paymentType'], string> = {
  wave: 'Wave',
  cash: 'Espèce',
  orange_money: 'Orange Money',
};

export const exportToExcel = (
  registrations: Registration[],
  activities: Activity[],
  filename?: string
): void => {
  const activityNameById: Record<string, string> = {};
  for (const a of activities) activityNameById[a.id] = a.name;

  const data = registrations.map(reg => ({
    'Activité': activityNameById[reg.activityId] ?? '',
    'Nom': reg.lastName,
    'Prénoms': reg.firstName,
    'Téléphone': reg.phone,
    'Adresse': reg.address,
    "Date d'inscription": new Date(reg.registrationDate).toLocaleDateString(),
    'Montant (F CFA)': reg.amount,
    'Type de paiement': PAYMENT_LABEL[reg.paymentType],
    'Date de création': new Date(reg.createdAt).toLocaleString(),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptions');

  const today = new Date().toISOString().split('T')[0];
  const finalName = filename ?? `inscriptions_${today}`;
  XLSX.writeFile(workbook, `${finalName}.xlsx`);
};
