import { Registration } from '../types';

const REGISTRATIONS_KEY = 'registrations';

// Get all registrations
export const getRegistrations = (): Registration[] => {
  const registrations = localStorage.getItem(REGISTRATIONS_KEY);
  return registrations ? JSON.parse(registrations) : [];
};

// Add a new registration
export const addRegistration = (registration: Omit<Registration, 'id' | 'createdAt'>): Registration => {
  const registrations = getRegistrations();
  const newRegistration: Registration = {
    ...registration,
    id: crypto.randomUUID(),
    createdAt: Date.now()
  };
  
  registrations.push(newRegistration);
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(registrations));
  
  return newRegistration;
};

// Delete a registration
export const deleteRegistration = (id: string): void => {
  const registrations = getRegistrations();
  const updatedRegistrations = registrations.filter(reg => reg.id !== id);
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(updatedRegistrations));
};