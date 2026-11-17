import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Settings2,
  Wrench,
} from 'lucide-react';
import {
  getFriendlyFirebaseError,
  type FirebaseServices,
} from '../lib/firebaseManager';
import type { FirebaseClientConfig } from '../types/plumbing';
import { FirebaseConfigPanel } from './FirebaseConfigPanel';
import { PlumbingBrandMark } from './PlumbingBrandMark';

interface AuthScreenProps {
  services: FirebaseServices | null;
  onConnectFirebase: (config: FirebaseClientConfig) => Promise<void>;
  onDisconnectFirebase: () => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  services,
  onConnectFirebase,
  onDisconnectFirebase,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfigOnMobile, setShowConfigOnMobile] = useState(!services);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!services) {
      setShowConfigOnMobile(true);
      setError('Connect your Firebase project configuration first before signing in.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(services.auth, trimmedEmail, password);
      } else {
        await createUserWithEmailAndPassword(services.auth, trimmedEmail, password);
      }
      // App.tsx listens to onAuthStateChanged and automatically navigates to Page 2
    } catch (err) {
      setError(getFriendlyFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex flex-col">
      {/* Android Material Blue Top Hero Strip */}
      <header className="bg-[#1565C0] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate">
                BluePipe Plumbing Service
              </h1>
              <p className="text-xs text-blue-100 truncate">
                Field Technician & Customer Registration Portal
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigOnMobile((prev) => !prev)}
            className="lg:hidden tap-surface min-h-[44px] px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
          >
            <Settings2 className="w-4 h-4" />
            <span>{showConfigOnMobile ? 'Hide Setup' : 'Firebase Setup'}</span>
          </button>
        </div>
      </header>

      {/* Main Content: Single clean responsive grid */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Login / Sign Up Card (First on mobile for quick access) */}
          <section className="lg:col-span-5 order-1">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-7">
              <div className="flex items-center gap-3.5 mb-6">
                <PlumbingBrandMark size="md" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                    {mode === 'login' ? 'Technician Sign In' : 'Create Staff Account'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {services
                      ? `Project: ${services.config.projectId}`
                      : 'Firebase setup required below'}
                  </p>
                </div>
              </div>

              {/* Login / Sign Up Toggle */}
              <div
                role="tablist"
                aria-label="Authentication mode"
                className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl mb-5"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'login'
                      ? 'bg-[#1565C0] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  onClick={() => {
                    setMode('signup');
                    setError(null);
                  }}
                  className={`min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'signup'
                      ? 'bg-[#1565C0] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Connection status banner */}
              {services ? (
                <div className="mb-5 flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-blue-50/80 border border-blue-100 text-xs text-[#0D47A1]">
                  <span className="flex items-center gap-2 font-medium min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-[#1565C0] shrink-0" />
                    <span className="truncate">Firebase connected ({services.config.projectId})</span>
                  </span>
                </div>
              ) : (
                <div className="mb-5 flex items-start gap-2.5 px-3.5 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Paste your Firebase config keys in the setup panel to enable Login and Cloud Firestore.
                  </span>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tech@bluepipeplumbing.com"
                      className="w-full min-h-[48px] pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full min-h-[48px] pl-10 pr-12 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="tap-surface w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-blue-300 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-900/15 cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>
                    {submitting
                      ? mode === 'login'
                        ? 'Signing In...'
                        : 'Creating Account...'
                      : mode === 'login'
                      ? 'Log In & Open Registration Form'
                      : 'Sign Up & Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center mt-5">
                {mode === 'login' ? "Don't have an account yet?" : 'Already registered?'}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === 'login' ? 'signup' : 'login');
                    setError(null);
                  }}
                  className="font-semibold text-[#1565C0] hover:underline cursor-pointer"
                >
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </section>

          {/* Firebase Configuration Setup Panel */}
          <section
            className={`lg:col-span-7 order-2 ${
              showConfigOnMobile ? 'block' : 'hidden lg:block'
            }`}
          >
            <FirebaseConfigPanel
              services={services}
              onConnect={async (cfg) => {
                await onConnectFirebase(cfg);
                setError(null);
              }}
              onDisconnect={onDisconnectFirebase}
            />
          </section>
        </div>
      </main>
    </div>
  );
};
