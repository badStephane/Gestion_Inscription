import * as XLSX from 'xlsx';
import { Activity, Registration } from '../types';

export type ImportableRegistration = Omit<Registration, 'id' | 'createdAt'>;

export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, unknown>;
  data?: ImportableRegistration;
  error?: string;
  duplicate?: boolean;
}

export interface ParseResult {
  total: number;
  valid: ParsedRow[];
  invalid: ParsedRow[];
  duplicates: ParsedRow[];
}

const normalize = (s: string): string =>
  s.toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s_'`-]+/g, '')
    .trim();

const COLUMN_ALIASES: Record<keyof ImportableRegistration | 'paymentTypeRaw', string[]> = {
  lastName: ['nom', 'lastname', 'last'],
  firstName: ['prenoms', 'prenom', 'firstname', 'first'],
  phone: ['telephone', 'tel', 'phone', 'mobile', 'numero', 'gsm'],
  address: ['adresse', 'address', 'localisation', 'lieu'],
  amount: ['montant', 'amount', 'prix', 'somme', 'montantfcfa'],
  paymentTypeRaw: ['typedepaiement', 'paiement', 'modedepaiement', 'mode', 'payment', 'paymenttype'],
  paymentType: [],
  registrationDate: ['datedinscription', 'date', 'registrationdate'],
  activityId: [],
};

const findValue = (row: Record<string, unknown>, aliases: string[]): unknown => {
  const normalizedKeys: Record<string, string> = {};
  for (const key of Object.keys(row)) normalizedKeys[normalize(key)] = key;
  for (const alias of aliases) {
    const k = normalizedKeys[alias];
    if (k !== undefined) return row[k];
  }
  return undefined;
};

const PAYMENT_VALUES: Record<string, Registration['paymentType']> = {
  cash: 'cash',
  espece: 'cash',
  especes: 'cash',
  liquide: 'cash',
  wave: 'wave',
  orangemoney: 'orange_money',
  orange: 'orange_money',
  om: 'orange_money',
};

const parsePaymentType = (raw: unknown): Registration['paymentType'] | null => {
  if (raw === undefined || raw === null || raw === '') return 'cash';
  const k = normalize(String(raw));
  return PAYMENT_VALUES[k] ?? null;
};

const toIsoDate = (raw: unknown): string | null => {
  if (raw === undefined || raw === null || raw === '') return new Date().toISOString().split('T')[0];
  if (raw instanceof Date) return raw.toISOString().split('T')[0];
  const s = String(raw).trim();
  // ISO: 2026-05-15
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
  }
  // French: 15/05/2026 or 15-05-2026
  const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (m) {
    const day = m[1].padStart(2, '0');
    const month = m[2].padStart(2, '0');
    let year = m[3];
    if (year.length === 2) year = (parseInt(year, 10) > 50 ? '19' : '20') + year;
    const iso = `${year}-${month}-${day}`;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : iso;
  }
  return null;
};

const parseAmount = (raw: unknown): number | null => {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
  const s = String(raw).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

const PHONE_DIGITS = /\d/g;

interface ValidateContext {
  activity: Activity;
  existingKeys: Set<string>;
  newKeys: Set<string>;
}

const dupKey = (lastName: string, firstName: string, phone: string): string =>
  `${normalize(lastName)}|${normalize(firstName)}|${phone.replace(/\D/g, '')}`;

const validateRow = (
  raw: Record<string, unknown>,
  rowNumber: number,
  ctx: ValidateContext
): ParsedRow => {
  const lastName = String(findValue(raw, COLUMN_ALIASES.lastName) ?? '').trim();
  const firstName = String(findValue(raw, COLUMN_ALIASES.firstName) ?? '').trim();
  const phone = String(findValue(raw, COLUMN_ALIASES.phone) ?? '').trim();
  const address = String(findValue(raw, COLUMN_ALIASES.address) ?? '').trim();

  if (!lastName) return { rowNumber, raw, error: 'Nom manquant' };
  if (!firstName) return { rowNumber, raw, error: 'Prénoms manquant' };
  if (!phone) return { rowNumber, raw, error: 'Téléphone manquant' };
  const phoneDigits = (phone.match(PHONE_DIGITS) || []).length;
  if (phoneDigits < 8) return { rowNumber, raw, error: 'Téléphone invalide (au moins 8 chiffres)' };
  if (!address) return { rowNumber, raw, error: 'Adresse manquante' };

  const amountRaw = findValue(raw, COLUMN_ALIASES.amount);
  let amount = parseAmount(amountRaw);
  if (amount === null) {
    if (ctx.activity.defaultAmount !== undefined && ctx.activity.defaultAmount > 0) {
      amount = ctx.activity.defaultAmount;
    } else {
      return { rowNumber, raw, error: "Montant manquant (et l'activité n'a pas de montant par défaut)" };
    }
  }
  if (amount <= 0) return { rowNumber, raw, error: 'Montant invalide (doit être positif)' };

  const paymentRaw = findValue(raw, COLUMN_ALIASES.paymentTypeRaw);
  const paymentType = parsePaymentType(paymentRaw);
  if (paymentType === null) {
    return { rowNumber, raw, error: `Type de paiement inconnu: "${String(paymentRaw)}". Valeurs acceptées: cash/espèce, wave, orange money.` };
  }

  const dateRaw = findValue(raw, COLUMN_ALIASES.registrationDate);
  const registrationDate = toIsoDate(dateRaw);
  if (registrationDate === null) {
    return { rowNumber, raw, error: `Date invalide: "${String(dateRaw)}". Formats acceptés: 2026-05-15, 15/05/2026.` };
  }

  const data: ImportableRegistration = {
    lastName,
    firstName,
    phone,
    address,
    amount,
    paymentType,
    registrationDate,
    activityId: ctx.activity.id,
  };

  const key = dupKey(lastName, firstName, phone);
  if (ctx.existingKeys.has(key) || ctx.newKeys.has(key)) {
    return { rowNumber, raw, data, duplicate: true };
  }
  ctx.newKeys.add(key);

  return { rowNumber, raw, data };
};

export const parseFile = async (file: File): Promise<Record<string, unknown>[]> => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
};

export const validateRows = (
  rows: Record<string, unknown>[],
  activity: Activity,
  existingRegistrations: Registration[]
): ParseResult => {
  const existingKeys = new Set(
    existingRegistrations
      .filter(r => r.activityId === activity.id)
      .map(r => dupKey(r.lastName, r.firstName, r.phone))
  );
  const ctx: ValidateContext = { activity, existingKeys, newKeys: new Set() };

  const valid: ParsedRow[] = [];
  const invalid: ParsedRow[] = [];
  const duplicates: ParsedRow[] = [];

  rows.forEach((raw, i) => {
    const result = validateRow(raw, i + 2, ctx); // +2 because row 1 is header in spreadsheet
    if (result.error) invalid.push(result);
    else if (result.duplicate) duplicates.push(result);
    else valid.push(result);
  });

  return { total: rows.length, valid, invalid, duplicates };
};

export const downloadTemplate = (): void => {
  const data = [
    {
      Nom: 'DIOP',
      'Prénoms': 'Aminata',
      'Téléphone': '0707070707',
      Adresse: 'Dakar, Plateau',
      Montant: 5000,
      'Type de paiement': 'wave',
      "Date d'inscription": '2026-05-15',
    },
    {
      Nom: 'SOW',
      'Prénoms': 'Mamadou',
      'Téléphone': '0808080808',
      Adresse: 'Thiès',
      Montant: '',
      'Type de paiement': 'cash',
      "Date d'inscription": '',
    },
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);
  // Column widths
  worksheet['!cols'] = [
    { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 18 }, { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inscriptions');
  XLSX.writeFile(workbook, 'modele_import_inscriptions.xlsx');
};
