import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import RegistrationForm from './components/RegistrationForm';
import RegistrationList from './components/RegistrationList';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<RegistrationForm />} />
            <Route path="/registrations" element={<RegistrationList />} />
          </Routes>
        </main>
        <footer className="bg-gray-800 text-white mt-auto">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">À propos</h3>
                <p className="text-gray-300">
                  Système de gestion des inscriptions simple et efficace pour vos besoins administratifs.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact</h3>
                <p className="text-gray-300">
                  Pour toute assistance, n'hésitez pas à nous contacter.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="/" className="text-gray-300 hover:text-white transition-colors">
                      Accueil
                    </a>
                  </li>
                  <li>
                    <a href="/add" className="text-gray-300 hover:text-white transition-colors">
                      Nouvelle inscription
                    </a>
                  </li>
                  <li>
                    <a href="/registrations" className="text-gray-300 hover:text-white transition-colors">
                      Liste des inscriptions
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-300">
                Système de Gestion des Inscriptions © {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;