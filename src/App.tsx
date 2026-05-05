import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, Home as HomeIcon, Database } from 'lucide-react';
import Home from './pages/Home';
import RegistrationForm from './components/RegistrationForm';
import RegistrationList from './components/RegistrationList';

function App() {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-100 ${
      isActive
        ? 'bg-gray-700/60 text-white font-medium'
        : 'text-gray-300 hover:bg-gray-700/40 hover:text-white'
    }`;

  return (
    <Router>
      <div className="h-full flex">
        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 bg-gray-900 flex flex-col border-r border-gray-800">
          {/* App title */}
          <div className="px-4 py-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-400" />
              <h1 className="text-sm font-semibold text-white tracking-tight">Inscriptions</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            <NavLink to="/" end className={navLinkClass}>
              <HomeIcon className="h-4 w-4" />
              Accueil
            </NavLink>
            <NavLink to="/add" className={navLinkClass}>
              <PlusCircle className="h-4 w-4" />
              Nouvelle inscription
            </NavLink>
            <NavLink to="/registrations" className={navLinkClass}>
              <ClipboardList className="h-4 w-4" />
              Liste
            </NavLink>
          </nav>

          {/* Version footer */}
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gestion Inscription v1.0</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-100">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<RegistrationForm />} />
            <Route path="/edit/:id" element={<RegistrationForm />} />
            <Route path="/registrations" element={<RegistrationList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
