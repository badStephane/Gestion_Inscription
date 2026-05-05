import * as XLSX from 'xlsx';
import { Registration } from '../types';

export const exportToExcel = (registrations: Registration[]): void => {
  const data = registrations.map(reg => ({
    'Nom': reg.lastName,
    'Prénoms': reg.firstName,
    'Téléphone': reg.phone,
    'Email': reg.email ?? '',
    'Adresse': reg.address,
    "Date d'inscription": new Date(reg.registrationDate).toLocaleDateString(),
    'Montant (F CFA)': reg.amount,
    'Type de paiement': reg.paymentType === 'wave' ? 'Wave' : 'Espèce',
    'Date de création': new Date(reg.createdAt).toLocaleString(),
  }));

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptions');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `inscriptions_${today}.xlsx`);
};
