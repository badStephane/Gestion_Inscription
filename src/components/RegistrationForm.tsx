import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addRegistration, getRegistrationById, updateRegistration } from '../utils/storage';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface FormState {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  registrationDate: string;
  paymentType: 'wave' | 'cash';
  amount: string;
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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [notFound, setNotFound] = useState(false);

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

    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';

    const phoneDigits = (formData.phone.match(PHONE_DIGITS_RE) || []).length;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    } else if (phoneDigits < 8) {
      newErrors.phone = 'Numéro de téléphone invalide (au moins 8 chiffres)';
    }

    if (formData.email.trim() && !EMAIL_RE.test(formData.email.trim())) {
      newErrors.email = 'Adresse email invalide';
    }

    if (!formData.address.trim()) newErrors.address = "L'adresse est requise";
    if (!formData.registrationDate) newErrors.registrationDate = "La date d'inscription est requise";

    const amountNum = parseFloat(formData.amount.replace(',', '.'));
    if (!formData.amount.trim()) {
      newErrors.amount = 'Le montant est requis';
    } else if (Number.isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Le montant doit être un nombre positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

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
        }, 1500);
      } catch (error) {
        console.error('Error saving registration:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      hasError ? 'border-red-500' : 'border-gray-300'
    }`;

  if (isLoadingExisting) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 my-8 text-center">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Inscription introuvable</h2>
        <p className="text-gray-600 mb-6">L'inscription demandée n'existe pas ou a été supprimée.</p>
        <button
          onClick={() => navigate('/registrations')}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md p-6 my-8 transition-all duration-300">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">
        {isEditMode ? "Modifier l'Inscription" : 'Nouvelle Inscription'}
      </h2>

      {isSuccess ? (
        <div className="flex flex-col items-center justify-center py-8 text-center text-green-600 space-y-3 animate-appear">
          <CheckCircle className="h-16 w-16" />
          <p className="text-xl font-medium">
            {isEditMode ? 'Inscription modifiée avec succès!' : 'Inscription enregistrée avec succès!'}
          </p>
          <p className="text-gray-600">Vous serez redirigé vers la liste des inscriptions...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={fieldClass(!!errors.lastName)}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Prénoms <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={fieldClass(!!errors.firstName)}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="07 07 07 07 07"
                className={fieldClass(!!errors.phone)}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-gray-400 text-xs">(optionnel)</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="exemple@email.com"
                className={fieldClass(!!errors.email)}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
              Adresse <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className={fieldClass(!!errors.address)}
            />
            {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="registrationDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date d'inscription <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="registrationDate"
                name="registrationDate"
                value={formData.registrationDate}
                onChange={handleChange}
                className={fieldClass(!!errors.registrationDate)}
              />
              {errors.registrationDate && <p className="mt-1 text-sm text-red-500">{errors.registrationDate}</p>}
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
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
                className={fieldClass(!!errors.amount)}
              />
              {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de paiement <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="paymentCash"
                  name="paymentType"
                  value="cash"
                  checked={formData.paymentType === 'cash'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="paymentCash" className="ml-2 block text-sm text-gray-700">
                  Espèce
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="paymentWave"
                  name="paymentType"
                  value="wave"
                  checked={formData.paymentType === 'wave'}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="paymentWave" className="ml-2 block text-sm text-gray-700">
                  Wave
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/registrations')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 bg-blue-600 text-white rounded-lg ${
                isSubmitting
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-blue-700 active:bg-blue-800'
              } transition-colors shadow-sm`}
            >
              {isSubmitting
                ? isEditMode ? 'Mise à jour...' : 'Enregistrement...'
                : isEditMode ? 'Mettre à jour' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RegistrationForm;
