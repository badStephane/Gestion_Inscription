import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { ClipboardList, PlusCircle, Home as HomeIcon, Database, Lock, KeyRound, LifeBuoy, CalendarDays } from 'lucide-react';
import Home from './pages/Home';
import Activities from './pages/Activities';
import RegistrationForm from './components/RegistrationForm';
import RegistrationList from './components/RegistrationList';
import AuthGate, { useAuth } from './components/AuthGate';
import ChangePasswordModal from './components/ChangePasswordModal';
import RecoveryCodeModal from './components/RecoveryCodeModal';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors duration-100 ${
    isActive
      ? 'bg-gray-700/60 text-white font-medium'
      : 'text-gray-300 hover:bg-gray-700/40 hover:text-white'
  }`;

const accountActionClass =
  'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-gray-300 hover:bg-gray-700/40 hover:text-white transition-colors';

function AppShell() {
  const { lock } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [recoveryCodeOpen, setRecoveryCodeOpen] = useState(false);

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
            <NavLink to="/activities" className={navLinkClass}>
              <CalendarDays className="h-4 w-4" />
              Activités
            </NavLink>
          </nav>

          {/* Account actions */}
          <div className="border-t border-gray-800 px-2 py-2 space-y-0.5">
            <button onClick={() => setChangePasswordOpen(true)} className={accountActionClass}>
              <KeyRound className="h-4 w-4" />
              Mot de passe
            </button>
            <button onClick={() => setRecoveryCodeOpen(true)} className={accountActionClass}>
              <LifeBuoy className="h-4 w-4" />
              Code de récupération
            </button>
            <button onClick={lock} className={accountActionClass}>
              <Lock className="h-4 w-4" />
              Verrouiller
            </button>
          </div>

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
            <Route path="/activities" element={<Activities />} />
          </Routes>
        </main>
      </div>

      <ChangePasswordModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
      />

      <RecoveryCodeModal
        open={recoveryCodeOpen}
        onClose={() => setRecoveryCodeOpen(false)}
      />
    </Router>
  );
}

function App() {
  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}

export default App;
