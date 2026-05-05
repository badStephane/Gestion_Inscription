import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRegistrations, deleteRegistration } from '../utils/storage';
import { exportToExcel } from '../utils/excelExport';
import { exportDatabase, importDatabase } from '../utils/dbBackup';
import { Registration } from '../types';
import {
  Download,
  Search,
  Trash2,
  Filter,
  Save,
  Upload,
  Pencil,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

type SortKey = 'name' | 'date' | 'amount' | 'payment';
type SortDirection = 'asc' | 'desc';

const formatAmount = (amount: number): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} F`;

const compareRegistrations = (
  a: Registration,
  b: Registration,
  key: SortKey
): number => {
  switch (key) {
    case 'name': {
      const an = `${a.lastName} ${a.firstName}`.toLowerCase();
      const bn = `${b.lastName} ${b.firstName}`.toLowerCase();
      return an.localeCompare(bn, 'fr');
    }
    case 'date':
      return a.registrationDate.localeCompare(b.registrationDate);
    case 'amount':
      return a.amount - b.amount;
    case 'payment':
      return a.paymentType.localeCompare(b.paymentType);
  }
};

const RegistrationList: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<Registration[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPayment, sortKey, sortDirection, pageSize]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getRegistrations();
        if (cancelled) return;
        setRegistrations(data);
        setFilteredRegistrations(data);
      } catch (error) {
        console.error('Error loading registrations:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterPayment, registrations, sortKey, sortDirection]);

  const applyFilters = () => {
    let filtered = [...registrations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(reg =>
        reg.firstName.toLowerCase().includes(term) ||
        reg.lastName.toLowerCase().includes(term) ||
        reg.phone.toLowerCase().includes(term) ||
        (reg.email?.toLowerCase().includes(term) ?? false) ||
        reg.address.toLowerCase().includes(term)
      );
    }

    if (filterPayment) {
      filtered = filtered.filter(reg => reg.paymentType === filterPayment);
    }

    if (sortKey) {
      const dir = sortDirection === 'asc' ? 1 : -1;
      filtered.sort((a, b) => compareRegistrations(a, b, sortKey) * dir);
    }

    setFilteredRegistrations(filtered);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon: React.FC<{ column: SortKey }> = ({ column }) => {
    if (sortKey !== column) {
      return <ChevronsUpDown className="h-3 w-3 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1 text-gray-700" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1 text-gray-700" />
    );
  };

  const handleExport = () => {
    if (filteredRegistrations.length > 0) {
      exportToExcel(filteredRegistrations);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette inscription?')) {
      try {
        await deleteRegistration(id);
        setRegistrations(prev => prev.filter(reg => reg.id !== id));
      } catch (error) {
        console.error('Error deleting registration:', error);
      }
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterPayment('');
    setShowFilters(false);
  };

  const handleBackup = async () => {
    try {
      const ok = await exportDatabase();
      if (ok) alert('Base de données sauvegardée avec succès.');
    } catch (error) {
      console.error('Error exporting database:', error);
      alert('Erreur lors de la sauvegarde de la base de données.');
    }
  };

  const handleRestore = async () => {
    const confirmed = window.confirm(
      'Restaurer une base de données va REMPLACER toutes les inscriptions actuelles. Continuer ?'
    );
    if (!confirmed) return;
    try {
      const ok = await importDatabase();
      if (ok) {
        alert('Base de données restaurée. L\'application va redémarrer.');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error importing database:', error);
      alert('Erreur lors de la restauration de la base de données.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredRegistrations.length);
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 my-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-3 sm:mb-0">Liste des Inscriptions</h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtres
          </button>

          <button
            onClick={handleExport}
            disabled={filteredRegistrations.length === 0}
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              filteredRegistrations.length === 0
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download className="h-4 w-4 mr-1" />
            Exporter Excel
          </button>

          <button
            onClick={handleBackup}
            title="Sauvegarder la base de données dans un fichier .db"
            className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Save className="h-4 w-4 mr-1" />
            Sauvegarder BD
          </button>

          <button
            onClick={handleRestore}
            title="Restaurer la base de données depuis un fichier .db"
            className="flex items-center px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            <Upload className="h-4 w-4 mr-1" />
            Restaurer BD
          </button>
        </div>
      </div>
      
      <div className={`mb-6 ${showFilters ? 'block' : 'hidden'}`}>
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Recherche
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Nom, prénom, téléphone, email, adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="paymentFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Type de paiement
              </label>
              <select
                id="paymentFilter"
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="cash">Espèce</option>
                <option value="wave">Wave</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end mt-3">
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>
      
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg">Aucune inscription trouvée</p>
          {(searchTerm || filterPayment) && (
            <button
              onClick={resetFilters}
              className="mt-2 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center hover:text-gray-700"
                  >
                    Inscrit <SortIcon column="name" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adresse
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort('date')}
                    className="inline-flex items-center hover:text-gray-700"
                  >
                    Date <SortIcon column="date" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center hover:text-gray-700"
                  >
                    Montant <SortIcon column="amount" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    type="button"
                    onClick={() => toggleSort('payment')}
                    className="inline-flex items-center hover:text-gray-700"
                  >
                    Paiement <SortIcon column="payment" />
                  </button>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRegistrations.map(registration => (
                <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {registration.lastName} {registration.firstName}
                    </div>
                    <div className="text-sm text-gray-500">{registration.phone}</div>
                    {registration.email && (
                      <div className="text-xs text-gray-400 truncate max-w-xs">{registration.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="truncate max-w-xs" title={registration.address}>
                      {registration.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(registration.registrationDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    {formatAmount(registration.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      registration.paymentType === 'wave'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {registration.paymentType === 'wave' ? 'Wave' : 'Espèce'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/edit/${registration.id}`}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <Pencil className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(registration.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {filteredRegistrations.length > 0 && (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
          <div>
            Affichage de <span className="font-medium">{startIndex + 1}</span>–<span className="font-medium">{endIndex}</span> sur{' '}
            <span className="font-medium">{filteredRegistrations.length}</span>
            {filteredRegistrations.length !== registrations.length && (
              <> (sur {registrations.length} au total)</>
            )}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <span>Lignes par page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {PAGE_SIZE_OPTIONS.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">
                Page <span className="font-medium">{safePage}</span> / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationList;