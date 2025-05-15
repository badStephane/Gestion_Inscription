import * as XLSX from 'xlsx';
import { Registration } from '../types';

export const exportToExcel = (registrations: Registration[]): void => {
  // Transform registrations data for Excel
  const data = registrations.map(reg => ({
    'Nom': reg.lastName,
    'Prénoms': reg.firstName,
    'Adresse': reg.address,
    'Date d\'inscription': new Date(reg.registrationDate).toLocaleDateString(),
    'Type de paiement': reg.paymentType === 'wave' ? 'Wave' : 'Espèce',
    'Date de création': new Date(reg.createdAt).toLocaleString(),
  }));

  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptions');

  // Generate Excel file
  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `inscriptions_${today}.xlsx`);
};