export interface Registration {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  registrationDate: string;
  paymentType: 'wave' | 'cash';
  createdAt: number;
}