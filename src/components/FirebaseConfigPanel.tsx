import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Database,
  KeyRound,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  DEFAULT_FIREBASE_CONFIG,
  parseFirebaseConfigSnippet,
  type FirebaseServices,
} from '../lib/firebaseManager';
import type { FirebaseClientConfig } from '../types/plumbing';

interface FirebaseConfigPanelProps {
  services: FirebaseServices | null;
  onConnect: (config: FirebaseClientConfig) => Promise<void>;
  onDisconnect: () => Promise<void>;
  compact?: boolean;
}

const SAMPLE_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /customers/{customerId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

export const FirebaseConfigPanel: React.FC<FirebaseConfigPanelProps> = ({
  services,
  onConnect,
  onDisconnect,
  compact = false,
}) => {
  const [inputMode, setInputMode] = useState<'snippet' | 'fields'>('snippet');
  const [snippet, setSnippet] = useState('');
  const [fields, setFields] = useState<FirebaseClientConfig>({
    apiKey: services?.config.apiKey ?? '',
    authDomain: services?.config.authDomain ?? '',
    projectId: services?.config.projectId ?? '',
    storageBucket: services?.config.storageBucket ?? '',
    messagingSenderId: services?.config.messagingSenderId ?? '',
    appId: services?.config.appId ?? '',
    firestoreDatabaseId: services?.config.firestoreDatabaseId ?? '',
  });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [copiedRules, setCopiedRules] = useState(false);

  const handleConnectSnippet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setConnecting(true);
    try {
      const parsed = parseFirebaseConfigSnippet(snippet);
      setFields({
        apiKey: parsed.apiKey,
        authDomain: parsed.authDomain,
        projectId: parsed.projectId,
        storageBucket: parsed.storageBucket ?? '',
        messagingSenderId: parsed.messagingSenderId ?? '',
        appId: parsed.appId,
        firestoreDatabaseId: parsed.firestoreDatabaseId ?? '',
      });
      await onConnect(parsed);
      setSuccessMsg(`Connected to Firebase project "${parsed.projectId}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse Firebase configuration.');
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectFields = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setConnecting(true);
    try {
      await onConnect(fields);
      setSuccessMsg(`Connected to Firebase project "${fields.projectId.trim()}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect Firebase configuration.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError(null);
    setSuccessMsg(null);
    await onDisconnect();
    setConfirmReset(false);
    setSnippet('');
    setFields({
      apiKey: DEFAULT_FIREBASE_CONFIG.apiKey,
      authDomain: DEFAULT_FIREBASE_CONFIG.authDomain,
      projectId: DEFAULT_FIREBASE_CONFIG.projectId,
      storageBucket: DEFAULT_FIREBASE_CONFIG.storageBucket ?? '',
      messagingSenderId: DEFAULT_FIREBASE_CONFIG.messagingSenderId ?? '',
      appId: DEFAULT_FIREBASE_CONFIG.appId,
      firestoreDatabaseId: DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId ?? '',
    });
    setSuccessMsg(`Restored default Firebase project "${DEFAULT_FIREBASE_CONFIG.projectId}".`);
  };

  const handleCopyRules = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_RULES);
      setCopiedRules(true);
      setTimeout(() => setCopiedRules(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`${compact ? 'px-5 py-4' : 'px-6 py-5'} border-b border-slate-100 bg-[#F8FBFF]`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Firebase Project Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {services
                  ? `Connected · Project ID: ${services.config.projectId}`
                  : 'Paste your Firebase Web SDK keys to connect Auth & Firestore'}
              </p>
            </div>
          </div>

          {services && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 shrink-0 pt-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Connected</span>
            </div>
          )}
        </div>
      </div>

      <div className={`${compact ? 'p-5' : 'p-6'} space-y-5`}>
        {/* Mode Switcher */}
        <div
          role="tablist"
          aria-label="Firebase configuration input method"
          className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl"
        >
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'snippet'}
            onClick={() => {
              setInputMode('snippet');
              setError(null);
            }}
            className={`min-h-[40px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              inputMode === 'snippet'
                ? 'bg-white text-[#1565C0] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paste Config Snippet
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={inputMode === 'fields'}
            onClick={() => {
              setInputMode('fields');
              setError(null);
            }}
            className={`min-h-[40px] px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              inputMode === 'fields'
                ? 'bg-white text-[#1565C0] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Enter Keys Individually
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {inputMode === 'snippet' ? (
          <form onSubmit={handleConnectSnippet} className="space-y-3.5">
            <div>
              <label
                htmlFor="firebase-snippet-input"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                Firebase SDK Config (JSON or JS object from Firebase Console)
              </label>
              <textarea
                id="firebase-snippet-input"
                rows={6}
                value={snippet}
                onChange={(e) => setSnippet(e.target.value)}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "your-app.firebaseapp.com",\n  projectId: "your-app",\n  storageBucket: "your-app.firebasestorage.app",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-3 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="submit"
                disabled={connecting || !snippet.trim()}
                className="tap-surface flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap"
              >
                <KeyRound className="w-4 h-4" />
                <span>{connecting ? 'Connecting...' : services ? 'Update Connection' : 'Connect Firebase'}</span>
              </button>

              {services && !confirmReset && (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="tap-surface min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleConnectFields} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cfg-apiKey" className="block text-xs font-medium text-slate-700 mb-1">
                  API Key *
                </label>
                <input
                  id="cfg-apiKey"
                  type="text"
                  required
                  value={fields.apiKey}
                  onChange={(e) => setFields({ ...fields, apiKey: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="cfg-projectId" className="block text-xs font-medium text-slate-700 mb-1">
                  Project ID *
                </label>
                <input
                  id="cfg-projectId"
                  type="text"
                  required
                  value={fields.projectId}
                  onChange={(e) => setFields({ ...fields, projectId: e.target.value })}
                  placeholder="my-plumbing-app"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="cfg-authDomain" className="block text-xs font-medium text-slate-700 mb-1">
                  Auth Domain *
                </label>
                <input
                  id="cfg-authDomain"
                  type="text"
                  required
                  value={fields.authDomain}
                  onChange={(e) => setFields({ ...fields, authDomain: e.target.value })}
                  placeholder="my-plumbing-app.firebaseapp.com"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="cfg-appId" className="block text-xs font-medium text-slate-700 mb-1">
                  App ID *
                </label>
                <input
                  id="cfg-appId"
                  type="text"
                  required
                  value={fields.appId}
                  onChange={(e) => setFields({ ...fields, appId: e.target.value })}
                  placeholder="1:123456789:web:abcdef"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="cfg-storageBucket" className="block text-xs font-medium text-slate-700 mb-1">
                  Storage Bucket
                </label>
                <input
                  id="cfg-storageBucket"
                  type="text"
                  value={fields.storageBucket ?? ''}
                  onChange={(e) => setFields({ ...fields, storageBucket: e.target.value })}
                  placeholder="my-plumbing-app.firebasestorage.app"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label htmlFor="cfg-messagingSenderId" className="block text-xs font-medium text-slate-700 mb-1">
                  Messaging Sender ID
                </label>
                <input
                  id="cfg-messagingSenderId"
                  type="text"
                  value={fields.messagingSenderId ?? ''}
                  onChange={(e) => setFields({ ...fields, messagingSenderId: e.target.value })}
                  placeholder="1234567890"
                  className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="cfg-dbId" className="block text-xs font-medium text-slate-700 mb-1">
                Firestore Database ID (optional — leave blank for default)
              </label>
              <input
                id="cfg-dbId"
                type="text"
                value={fields.firestoreDatabaseId ?? ''}
                onChange={(e) => setFields({ ...fields, firestoreDatabaseId: e.target.value })}
                placeholder="(default)"
                className="w-full min-h-[44px] rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-mono text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="submit"
                disabled={connecting}
                className="tap-surface flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <KeyRound className="w-4 h-4" />
                <span>{connecting ? 'Connecting...' : services ? 'Update Connection' : 'Connect Firebase'}</span>
              </button>

              {services && !confirmReset && (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="tap-surface min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Inline reset confirmation */}
        {confirmReset && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <span>Restore default project ({DEFAULT_FIREBASE_CONFIG.projectId}) and clear custom keys?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-amber-200 font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#1565C0] text-white font-semibold hover:bg-[#0D47A1] cursor-pointer"
              >
                Restore Default
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Firebase Console Setup Guide */}
        <div className="border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className="w-full min-h-[40px] flex items-center justify-between text-xs font-medium text-slate-600 hover:text-[#1565C0] cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#1565C0]" />
              <span>Firebase Console checklist (Email/Password Auth & Firestore Rules)</span>
            </span>
            {showGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showGuide && (
            <div className="mt-3 space-y-3 text-xs text-slate-600 leading-relaxed">
              <div>
                <p className="font-semibold text-slate-800">1. Enable Email/Password Sign-In</p>
                <p className="mt-0.5">
                  In Firebase Console, open <span className="font-medium text-slate-800">Authentication → Sign-in method</span>, click{' '}
                  <span className="font-medium text-slate-800">Email/Password</span>, toggle <span className="font-medium text-slate-800">Enable</span>, and save.
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-800">2. Allow Authenticated Access to customers</p>
                  <button
                    type="button"
                    onClick={handleCopyRules}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1565C0] hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedRules ? 'Copied' : 'Copy rules'}</span>
                  </button>
                </div>
                <pre className="mt-1.5 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-normal">
                  {SAMPLE_RULES}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
