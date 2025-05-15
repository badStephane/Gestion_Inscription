import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, FileSpreadsheet } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Système de Gestion des Inscriptions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Un outil simple et efficace pour gérer vos inscriptions
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl shadow-sm border border-blue-100 transition-all duration-300 hover:shadow-md">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600 text-white rounded-lg mb-4">
                <ClipboardList className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Gestion des Inscriptions</h2>
              <p className="text-gray-600">
                Enregistrez facilement les nouvelles inscriptions avec toutes les informations nécessaires.
              </p>
            </div>
            <Link
              to="/add"
              className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800 transition-colors group"
            >
              Ajouter une inscription
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl shadow-sm border border-purple-100 transition-all duration-300 hover:shadow-md">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-purple-600 text-white rounded-lg mb-4">
                <FileSpreadsheet className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Exportation Excel</h2>
              <p className="text-gray-600">
                Générez et téléchargez facilement des rapports Excel pour toutes vos inscriptions.
              </p>
            </div>
            <Link
              to="/registrations"
              className="inline-flex items-center text-purple-600 font-medium hover:text-purple-800 transition-colors group"
            >
              Voir les inscriptions
              <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Fonctionnalités</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                </div>
                <p className="ml-3 text-gray-600">Formulaire d'inscription complet et intuitif</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                </div>
                <p className="ml-3 text-gray-600">Suivi des modes de paiement (Wave ou espèce)</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                </div>
                <p className="ml-3 text-gray-600">Exportation des données au format Excel</p>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                </div>
                <p className="ml-3 text-gray-600">Recherche et filtrage avancés</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;