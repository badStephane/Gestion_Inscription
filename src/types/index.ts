export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string;
  registrationDate: string;
  paymentType: 'wave' | 'cash';
  amount: number;
  createdAt: number;
}
