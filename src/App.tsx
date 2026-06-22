import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { getVersion } from '@tauri-apps/api/app';
import { ClipboardList, PlusCircle, Home as HomeIcon, Lock, KeyRound, LifeBuoy, CalendarDays, Menu, X, Settings, History } from 'lucide-react';
import Home from './pages/Home';
import Activities from './pages/Activities';
import ActivityStats from './pages/ActivityStats';
import Audit from './pages/Audit';
import RegistrationForm from './components/RegistrationForm';
import RegistrationList from './components/RegistrationList';
import AuthGate, { useAuth } from './components/AuthGate';
import ChangePasswordModal from './components/ChangePasswordModal';
import RecoveryCodeModal from './components/RecoveryCodeModal';
import PreferencesModal from './components/PreferencesModal';
import UpdateChecker from './components/UpdateChecker';
import DemoBanner from './components/DemoBanner';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded text-sm transition-colors duration-100 ${
    isActive
      ? 'bg-gray-700/60 text-white font-medium border-l-2 border-blue-400 -ml-px'
      : 'text-gray-300 hover:bg-gray-700/40 hover:text-white border-l-2 border-transparent -ml-px'
  }`;

const accountActionClass =
  'w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] rounded text-sm text-gray-300 hover:bg-gray-700/40 hover:text-white transition-colors';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/add': 'Nouvelle inscription',
  '/registrations': 'Liste des inscriptions',
  '/activities': 'Activités',
  '/audit': 'Historique',
};

function PageHeader() {
  const location = useLocation();
  const path = location.pathname;
  let title = '';
  if (path.startsWith('/edit/')) title = "Modifier l'inscription";
  else if (path.startsWith('/activities/') && path.endsWith('/stats')) title = '';
  else title = PAGE_TITLES[path] || '';

  if (!title) return null;

  return (
    <div className="px-6 pt-5 pb-0">
      <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
    </div>
  );
}

function AppShell() {
  const { lock } = useAuth();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [recoveryCodeOpen, setRecoveryCodeOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    getVersion()
      .then(setVersion)
      .catch(() => setVersion(''));
  }, []);

  return (
    <Router>
      <div className="h-full flex">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-52 bg-gray-900 flex flex-col border-r border-gray-800
          transform transition-transform duration-200 ease-out
          lg:relative lg:translate-x-0 lg:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          {/* App title */}
          <div className="px-4 py-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo-mark.svg" alt="Actio" className="h-6 w-6 rounded" />
              <h1 className="text-sm font-semibold text-white tracking-tight">Actio</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-3 space-y-0.5">
            <NavLink to="/" end className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <HomeIcon className="h-4 w-4" />
              Accueil
            </NavLink>
            <NavLink to="/add" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <PlusCircle className="h-4 w-4" />
              Nouvelle inscription
            </NavLink>
            <NavLink to="/registrations" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <ClipboardList className="h-4 w-4" />
              Liste
            </NavLink>
            <NavLink to="/activities" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <CalendarDays className="h-4 w-4" />
              Activités
            </NavLink>
            <NavLink to="/audit" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <History className="h-4 w-4" />
              Historique
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
            <button onClick={() => setPreferencesOpen(true)} className={accountActionClass}>
              <Settings className="h-4 w-4" />
              Préférences
            </button>
            <button onClick={lock} className={accountActionClass}>
              <Lock className="h-4 w-4" />
              Verrouiller
            </button>
          </div>

          {/* Version footer */}
          <div className="px-4 py-3 border-t border-gray-800">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              Actio{version ? ` v${version}` : ''}
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-100 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <img src="/logo-mark.svg" alt="Actio" className="h-6 w-6 rounded" />
              <span className="text-sm font-semibold text-gray-800">Actio</span>
            </div>
          </div>

          <PageHeader />

          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/add" element={<RegistrationForm />} />
              <Route path="/edit/:id" element={<RegistrationForm />} />
              <Route path="/registrations" element={<RegistrationList />} />
              <Route path="/activities" element={<Activities />} />
              <Route path="/activities/:id/stats" element={<ActivityStats />} />
              <Route path="/audit" element={<Audit />} />
            </Routes>
          </div>
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

      <PreferencesModal
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
      />

      <UpdateChecker />
      <DemoBanner />
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
