import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, PlusCircle, Home } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <ClipboardList className="h-8 w-8 mr-2" />
            <h1 className="text-2xl font-bold">Système d'Inscriptions</h1>
          </div>
          
          <nav className="flex space-x-1 sm:space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-lg flex items-center transition-all duration-200 ${
                location.pathname === '/' 
                  ? 'bg-white text-indigo-700 font-medium' 
                  : 'hover:bg-indigo-600'
              }`}
            >
              <Home className="h-5 w-5 mr-1" />
              <span>Accueil</span>
            </Link>
            
            <Link 
              to="/registrations" 
              className={`px-3 py-2 rounded-lg flex items-center transition-all duration-200 ${
                location.pathname === '/registrations' 
                  ? 'bg-white text-indigo-700 font-medium' 
                  : 'hover:bg-indigo-600'
              }`}
            >
              <ClipboardList className="h-5 w-5 mr-1" />
              <span>Inscriptions</span>
            </Link>
            
            <Link 
              to="/add" 
              className={`px-3 py-2 rounded-lg flex items-center transition-all duration-200 ${
                location.pathname === '/add' 
                  ? 'bg-white text-indigo-700 font-medium' 
                  : 'hover:bg-indigo-600'
              }`}
            >
              <PlusCircle className="h-5 w-5 mr-1" />
              <span>Nouvelle</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;