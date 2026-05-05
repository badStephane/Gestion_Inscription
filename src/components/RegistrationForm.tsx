import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRegistration, getRegistrationById, updateRegistration } from '../utils/storage';
import { getActivities } from '../utils/activities';
import { Activity, DEFAULT_ACTIVITY_ID } from '../types';
import { CheckCircle, AlertCircle, Save, X } from 'lucide-react';

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  registrationDate: string;
  paymentType: 'wave' | 'cash';
  amount: string;
  activityId: string;
}

const PHONE_DIGITS_RE = /\d/g;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEditMode = Boolean(editId);

  const [formData, setFormData] = useState<FormState>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    registrationDate: new Date().toISOString().split('T')[0],
    paymentType: 'cash',
    amount: '',
    activityId: DEFAULT_ACTIVITY_ID,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getActivities(false);
        if (!cancelled) setActivities(list);
      } catch (error) {
        console.error('Error loading activities:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await getRegistrationById(editId);
        if (cancelled) return;
        if (!existing) {
          setNotFound(true);
        } else {
          setFormData({
            firstName: existing.firstName,
            lastName: existing.lastName,
            phone: existing.phone,
            email: existing.email ?? '',
            address: existing.address,
            registrationDate: existing.registrationDate,
            paymentType: existing.paymentType,
            amount: String(existing.amount),
            activityId: existing.activityId,
          });
        }
      } catch (error) {
        console.error('Error loading registration:', error);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.activityId) newErrors.activityId = "L'activite est requise";
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prenom est requis';

    const phoneDigits = (formData.phone.match(PHONE_DIGITS_RE) || []).length;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le telephone est requis';
    } else if (phoneDigits < 8) {
      newErrors.phone = 'Au moins 8 chiffres';
    }

    if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) {
      newErrors.email = 'Adresse email invalide';
    }

    if (!formData.address.trim()) newErrors.address = "L'adresse est requise";
    if (!formData.registrationDate) newErrors.registrationDate = 'La date est requise';

    const amountNum = parseFloat(formData.amount.replace(',', '.'));
    if (!formData.amount.trim()) {
      newErrors.amount = 'Le montant est requis';
    } else if (Number.isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Montant invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'activityId' && !isEditMode) {
        const picked = activities.find(a => a.id === value);
        if (picked?.defaultAmount !== undefined && (prev.amount === '' || prev.amount === '0')) {
          next.amount = String(picked.defaultAmount);
        }
      }
      return next;
    });

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      setIsSubmitting(true);

      try {
        const trimmedEmail = formData.email.trim();
        const payload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
          email: trimmedEmail || undefined,
          address: formData.address.trim(),
          registrationDate: formData.registrationDate,
          paymentType: formData.paymentType,
          amount: parseFloat(formData.amount.replace(',', '.')),
          activityId: formData.activityId,
        };

        if (isEditMode && editId) {
          await updateRegistration({ id: editId, ...payload });
        } else {
          await addRegistration(payload);
        }
        setIsSuccess(true);

        setTimeout(() => {
          setIsSuccess(false);
          navigate('/registrations');
        }, 1200);
      } catch (error) {
        console.error('Error saving registration:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isLoadingExisting) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="p-6">
        <div className="panel p-8 text-center max-w-md mx-auto">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-base font-semibold text-gray-800 mb-1">Inscription introuvable</h2>
          <p className="text-sm text-gray-500 mb-4">L'inscription demandee n'existe pas ou a ete supprimee.</p>
          <button onClick={() => navigate('/registrations')} className="btn btn-primary">
            Retour a la liste
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Page header */}
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-gray-800">
          {isEditMode ? "Modifier l'inscription" : 'Nouvelle inscription'}
        </h1>
      </div>

      {isSuccess ? (
        <div className="panel p-8 text-center">
          <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
          <p className="text-base font-medium text-emerald-700">
            {isEditMode ? 'Inscription modifiee!' : 'Inscription enregistree!'}
          </p>
          <p className="text-xs text-gray-500 mt-1">Redirection...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="panel">
          <div className="p-4 space-y-4">
            {/* Activity */}
            <div>
              <label htmlFor="activityId" className="block text-xs font-medium text-gray-600 mb-1">
                Activite <span className="text-red-500">*</span>
              </label>
              <select
                id="activityId"
                name="activityId"
                value={formData.activityId}
                onChange={handleChange}
                className={`input-field ${errors.activityId ? 'has-error' : ''}`}
              >
                {activities.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.eventDate ? ` — ${new Date(a.eventDate).toLocaleDateString('fr-FR')}` : ''}
                  </option>
                ))}
              </select>
              {errors.activityId && <p className="mt-0.5 text-xs text-red-500">{errors.activityId}</p>}
            </div>

            {/* Row: Nom + Prenom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="lastName" className="block text-xs font-medium text-gray-600 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`input-field ${errors.lastName ? 'has-error' : ''}`}
                />
                {errors.lastName && <p className="mt-0.5 text-xs text-red-500">{errors.lastName}</p>}
              </div>
              <div>
                <label htmlFor="firstName" className="block text-xs font-medium text-gray-600 mb-1">
                  Prenoms <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`input-field ${errors.firstName ? 'has-error' : ''}`}
                />
                {errors.firstName && <p className="mt-0.5 text-xs text-red-500">{errors.firstName}</p>}
              </div>
            </div>

            {/* Row: Phone + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="phone" className="block text-xs font-medium text-gray-600 mb-1">
                  Telephone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="07 07 07 07 07"
                  className={`input-field ${errors.phone ? 'has-error' : ''}`}
                />
                {errors.phone && <p className="mt-0.5 text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1">
                  Email <span className="text-gray-400">(optionnel)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  className={`input-field ${errors.email ? 'has-error' : ''}`}
                />
                {errors.email && <p className="mt-0.5 text-xs text-red-500">{errors.email}</p>}
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-xs font-medium text-gray-600 mb-1">
                Adresse <span className="text-red-500">*</span>
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                className={`input-field resize-none ${errors.address ? 'has-error' : ''}`}
              />
              {errors.address && <p className="mt-0.5 text-xs text-red-500">{errors.address}</p>}
            </div>

            {/* Row: Date + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="registrationDate" className="block text-xs font-medium text-gray-600 mb-1">
                  Date d'inscription <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="registrationDate"
                  name="registrationDate"
                  value={formData.registrationDate}
                  onChange={handleChange}
                  className={`input-field ${errors.registrationDate ? 'has-error' : ''}`}
                />
                {errors.registrationDate && <p className="mt-0.5 text-xs text-red-500">{errors.registrationDate}</p>}
              </div>
              <div>
                <label htmlFor="amount" className="block text-xs font-medium text-gray-600 mb-1">
                  Montant (F CFA) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  min="0"
                  step="any"
                  placeholder="0"
                  className={`input-field ${errors.amount ? 'has-error' : ''}`}
                />
                {errors.amount && <p className="mt-0.5 text-xs text-red-500">{errors.amount}</p>}
              </div>
            </div>

            {/* Payment type */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Type de paiement <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="cash"
                    checked={formData.paymentType === 'cash'}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Espece</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="wave"
                    checked={formData.paymentType === 'wave'}
                    onChange={handleChange}
                    className="h-3.5 w-3.5 text-blue-600 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Wave</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form actions toolbar */}
          <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b">
            <button
              type="button"
              onClick={() => navigate('/registrations')}
              className="btn btn-default"
            >
              <X className="h-3.5 w-3.5" />
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn btn-primary ${isSubmitting ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <Save className="h-3.5 w-3.5" />
              {isSubmitting
                ? isEditMode ? 'Mise a jour...' : 'Enregistrement...'
                : isEditMode ? 'Mettre a jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegistrationForm;
