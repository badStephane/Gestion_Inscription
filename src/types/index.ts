export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  registrationDate: string;
  paymentType: 'wave' | 'cash';
  amount: number;
  activityId: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  name: string;
  color: string;
  eventDate?: string;
  defaultAmount?: number;
  archivedAt?: number;
  createdAt: number;
}

export const DEFAULT_ACTIVITY_ID = '00000000-0000-0000-0000-000000000001';
