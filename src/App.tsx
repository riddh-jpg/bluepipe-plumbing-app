import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { collection, onSnapshot, type Timestamp } from 'firebase/firestore';
import {
  ClipboardPlus,
  Database,
  LogOut,
  Users,
  X,
} from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { CustomerFormCard } from './components/CustomerFormCard';
import { CustomerListPanel } from './components/CustomerListPanel';
import { FirebaseConfigPanel } from './components/FirebaseConfigPanel';
import { PlumbingBrandMark } from './components/PlumbingBrandMark';
import {
  disconnectFirebaseServices,
  formatFirestoreError,
  getFriendlyFirebaseError,
  initializeFirebaseServices,
  loadSavedConfig,
  OperationType,
  type FirebaseServices,
} from './lib/firebaseManager';
import type { CustomerRecord, FirebaseClientConfig } from './types/plumbing';

type MobileTab = 'form' | 'customers' | 'config';

export default function App() {
  const [services, setServices] = useState<FirebaseServices | null>(null);
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);

  const [mobileTab, setMobileTab] = useState<MobileTab>('form');
  const [showDesktopConfigModal, setShowDesktopConfigModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Boot: restore saved Firebase config from localStorage if present
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      const initialConfig = loadSavedConfig();
      try {
        const initialized = await initializeFirebaseServices(initialConfig);
        if (!cancelled) {
          setServices(initialized);
        }
      } catch (err) {
        console.error('Failed to initialize Firebase config:', err);
      }
      if (!cancelled) {
        setBooting(false);
      }
    }
    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auth listener: automatically routes to Page 2 when logged in
  useEffect(() => {
    if (!services) {
      setUser(null);
      setAuthReady(true);
      return;
    }

    setAuthReady(false);
    const unsubscribe = onAuthStateChanged(services.auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (firebaseUser) {
        setMobileTab('form');
      }
    });

    return () => unsubscribe();
  }, [services]);

  // Live Cloud Firestore listener on `customers` collection when authenticated
  useEffect(() => {
    if (!services || !user) {
      setCustomers([]);
      setCustomersLoading(false);
      setCustomersError(null);
      return;
    }

    setCustomersLoading(true);
    setCustomersError(null);

    const collectionPath = 'customers';
    const unsubscribe = onSnapshot(
      collection(services.db, collectionPath),
      (snapshot) => {
        const records: CustomerRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const ts = data.createdAt as Timestamp | undefined;
          const createdAtMs =
            ts && typeof ts.toMillis === 'function' ? ts.toMillis() : null;

          return {
            id: docSnap.id,
            name: String(data.name ?? ''),
            phoneNo: String(data.phoneNo ?? ''),
            dob: String(data.dob ?? ''),
            email: String(data.email ?? ''),
            address: String(data.address ?? ''),
            source: data.source === 'dummy' ? 'dummy' : 'form',
            createdByUid: typeof data.createdByUid === 'string' ? data.createdByUid : undefined,
            createdByEmail:
              typeof data.createdByEmail === 'string' ? data.createdByEmail : undefined,
            createdAtMs,
          };
        });

        // Sort newest first; newly written pending timestamps stay at top
        records.sort((a, b) => {
          const aTime = a.createdAtMs ?? Number.MAX_SAFE_INTEGER;
          const bTime = b.createdAtMs ?? Number.MAX_SAFE_INTEGER;
          return bTime - aTime;
        });

        setCustomers(records);
        setCustomersLoading(false);
        setCustomersError(null);
      },
      (error) => {
        formatFirestoreError(error, OperationType.LIST, collectionPath, services.auth);
        setCustomersError(getFriendlyFirebaseError(error));
        setCustomersLoading(false);
      }
    );

    return () => unsubscribe();
  }, [services, user]);

  const handleConnectFirebase = async (config: FirebaseClientConfig) => {
    const initialized = await initializeFirebaseServices(config);
    setServices(initialized);
  };

  const handleDisconnectFirebase = async () => {
    const defaultServices = await disconnectFirebaseServices();
    setServices(defaultServices);
    setUser(null);
    setCustomers([]);
    setShowDesktopConfigModal(false);
  };

  const handleLogout = async () => {
    if (!services) return;
    setLoggingOut(true);
    try {
      await signOut(services.auth);
    } finally {
      setLoggingOut(false);
    }
  };

  if (booting || (services && !authReady)) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <PlumbingBrandMark size="lg" />
          <p className="text-sm font-medium text-slate-600">
            Connecting BluePipe Service...
          </p>
        </div>
      </div>
    );
  }

  // Page 1: Login / Sign Up + Firebase Configuration Setup
  if (!services || !user) {
    return (
      <AuthScreen
        services={services}
        onConnectFirebase={handleConnectFirebase}
        onDisconnectFirebase={handleDisconnectFirebase}
      />
    );
  }

  // Page 2: Customer Application Form + Live Customer List (opens automatically after login)
  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col pb-20 lg:pb-10">
      {/* Compact Sticky Android Top App Bar (52px height) */}
      <header className="sticky top-0 z-30 h-[52px] bg-[#1565C0] text-white shadow-sm">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <PlumbingBrandMark size="sm" className="bg-white/15 shadow-none" />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
                BluePipe Service
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline-block text-xs text-blue-100 max-w-[220px] truncate">
              {user.email} · {services.config.projectId}
            </span>

            <button
              type="button"
              onClick={() => setShowDesktopConfigModal(true)}
              className="hidden lg:inline-flex min-h-[38px] px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Firebase Config</span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="tap-surface min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white text-[#1565C0] hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? 'Signing out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Signed-in operator context bar on mobile */}
      <div className="lg:hidden bg-white border-b border-slate-200/80 px-4 py-2 text-xs text-slate-600 flex items-center justify-between gap-2">
        <span className="truncate">{user.email}</span>
        <span className="font-mono text-[11px] text-[#1565C0] shrink-0">
          {services.config.projectId}
        </span>
      </div>

      {/* Main Responsive Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Customer Application Form */}
          <section
            className={`lg:col-span-5 ${
              mobileTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
          >
            <CustomerFormCard
              services={services}
              userUid={user.uid}
              userEmail={user.email ?? 'unknown'}
            />
          </section>

          {/* Live Customer List & Load 5 Dummy Customers */}
          <section
            className={`lg:col-span-7 ${
              mobileTab === 'customers' ? 'block' : 'hidden lg:block'
            }`}
          >
            <CustomerListPanel
              services={services}
              customers={customers}
              loading={customersLoading}
              loadError={customersError}
              userUid={user.uid}
              userEmail={user.email ?? 'unknown'}
            />
          </section>

          {/* Mobile-only Firebase Config Tab */}
          {mobileTab === 'config' && (
            <section className="lg:hidden">
              <FirebaseConfigPanel
                services={services}
                onConnect={handleConnectFirebase}
                onDisconnect={handleDisconnectFirebase}
                compact
              />
            </section>
          )}
        </div>
      </main>

      {/* Mobile-First Android Bottom Navigation Bar (58px height) */}
      <nav
        aria-label="Primary navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[58px] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 items-center"
      >
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
            mobileTab === 'form' ? 'text-[#1565C0]' : 'text-slate-500'
          }`}
        >
          <ClipboardPlus className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight">Register</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('customers')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
            mobileTab === 'customers' ? 'text-[#1565C0]' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight tabular-nums">
            Customers ({customers.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('config')}
          className={`h-full flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
            mobileTab === 'config' ? 'text-[#1565C0]' : 'text-slate-500'
          }`}
        >
          <Database className="w-5 h-5" />
          <span className="text-[11px] font-semibold tracking-tight">Firebase</span>
        </button>
      </nav>

      {/* Desktop Firebase Config Modal */}
      {showDesktopConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Firebase Project Configuration"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <button
              type="button"
              aria-label="Close Firebase configuration dialog"
              onClick={() => setShowDesktopConfigModal(false)}
              className="absolute top-4 right-4 z-10 min-w-[40px] min-h-[40px] rounded-xl bg-white/90 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <FirebaseConfigPanel
              services={services}
              onConnect={handleConnectFirebase}
              onDisconnect={handleDisconnectFirebase}
            />
          </div>
        </div>
      )}
    </div>
  );
}
