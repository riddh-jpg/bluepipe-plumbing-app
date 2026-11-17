import { deleteApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore, type Firestore } from 'firebase/firestore';
import type { FirebaseClientConfig } from '../types/plumbing';

const STORAGE_KEY = 'bluepipe_firebase_config_v1';

export const DEFAULT_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: 'AIzaSyA6894EdePME8RZZPFjLiUYv0KJonRrUvQ',
  authDomain: 'plumbing-service-app-25976.firebaseapp.com',
  projectId: 'plumbing-service-app-25976',
  storageBucket: 'plumbing-service-app-25976.firebasestorage.app',
  messagingSenderId: '241103785911',
  appId: '1:241103785911:web:1d89de6a2ceeac23daa232',
};

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  config: FirebaseClientConfig;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

let activeServices: FirebaseServices | null = null;

export function loadSavedConfig(): FirebaseClientConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FirebaseClientConfig>;
      if (isValidFirebaseConfig(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Fall back to permanent default config
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function saveConfigToStorage(config: FirebaseClientConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors in private/restricted browser contexts
  }
}

export function clearConfigFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors in private/restricted browser contexts
  }
}

export function isValidFirebaseConfig(
  cfg: Partial<FirebaseClientConfig> | null | undefined
): cfg is FirebaseClientConfig {
  if (!cfg) return false;
  return Boolean(
    cfg.apiKey?.trim() &&
      cfg.authDomain?.trim() &&
      cfg.projectId?.trim() &&
      cfg.appId?.trim()
  );
}

/**
 * Parses either strict JSON or a raw JS snippet pasted from the Firebase Console:
 * e.g. `const firebaseConfig = { apiKey: "...", authDomain: "...", ... };`
 */
export function parseFirebaseConfigSnippet(input: string): FirebaseClientConfig {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Paste your Firebase config object or JSON first.');
  }

  // First try direct JSON parse
  try {
    const direct = JSON.parse(trimmed) as Partial<FirebaseClientConfig>;
    if (isValidFirebaseConfig(direct)) {
      return sanitizeConfig(direct);
    }
  } catch {
    // Fall through to JS snippet extraction
  }

  // Extract object body between first { and last }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  const body =
    firstBrace !== -1 && lastBrace > firstBrace
      ? trimmed.slice(firstBrace + 1, lastBrace)
      : trimmed;

  const extracted: Partial<FirebaseClientConfig> = {};
  const knownKeys: (keyof FirebaseClientConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
    'measurementId',
    'firestoreDatabaseId',
  ];

  for (const key of knownKeys) {
    const regex = new RegExp(
      `["']?${key}["']?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`,
      'm'
    );
    const match = body.match(regex);
    if (match?.[1]) {
      extracted[key] = match[1].trim();
    }
  }

  if (!isValidFirebaseConfig(extracted)) {
    throw new Error(
      'Could not find required keys (apiKey, authDomain, projectId, appId). Check the snippet and try again.'
    );
  }

  return sanitizeConfig(extracted);
}

function sanitizeConfig(cfg: FirebaseClientConfig): FirebaseClientConfig {
  return {
    apiKey: cfg.apiKey.trim(),
    authDomain: cfg.authDomain.trim(),
    projectId: cfg.projectId.trim(),
    appId: cfg.appId.trim(),
    storageBucket: cfg.storageBucket?.trim() || undefined,
    messagingSenderId: cfg.messagingSenderId?.trim() || undefined,
    measurementId: cfg.measurementId?.trim() || undefined,
    firestoreDatabaseId: cfg.firestoreDatabaseId?.trim() || undefined,
  };
}

export async function initializeFirebaseServices(
  rawConfig: FirebaseClientConfig
): Promise<FirebaseServices> {
  const config = sanitizeConfig(rawConfig);
  if (!isValidFirebaseConfig(config)) {
    throw new Error('apiKey, authDomain, projectId, and appId are required.');
  }

  // Clean up any existing BluePipe Firebase app instances before re-initializing
  const existingApps = getApps();
  for (const existing of existingApps) {
    if (existing.name.startsWith('bluepipe-')) {
      try {
        await deleteApp(existing);
      } catch {
        // Ignore cleanup errors on already-deleted apps
      }
    }
  }

  const appName = `bluepipe-${Date.now()}`;
  const app = initializeApp(
    {
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId,
      measurementId: config.measurementId,
    },
    appName
  );

  const auth = getAuth(app);
  const db = config.firestoreDatabaseId
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);

  // Verify connectivity in background without blocking initial UI render
  void getDocFromServer(doc(db, 'test', 'connection')).catch((error) => {
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes('the client is offline')
    ) {
      console.warn('Firestore offline check warning:', error.message);
    }
  });

  activeServices = { app, auth, db, config };
  saveConfigToStorage(config);
  return activeServices;
}

export async function disconnectFirebaseServices(): Promise<FirebaseServices> {
  clearConfigFromStorage();
  return initializeFirebaseServices(DEFAULT_FIREBASE_CONFIG);
}

export function getActiveFirebaseServices(): FirebaseServices | null {
  return activeServices;
}

export function formatFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  auth: Auth | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth?.currentUser?.uid ?? null,
      email: auth?.currentUser?.email ?? null,
      emailVerified: auth?.currentUser?.emailVerified ?? null,
      isAnonymous: auth?.currentUser?.isAnonymous ?? null,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

export function getFriendlyFirebaseError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('auth/invalid-credential') || message.includes('auth/wrong-password')) {
    return 'Incorrect email or password. Please check your credentials and try again.';
  }
  if (message.includes('auth/user-not-found')) {
    return 'No account found with this email. Switch to Sign Up to create one.';
  }
  if (message.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Switch to Log In instead.';
  }
  if (message.includes('auth/weak-password')) {
    return 'Password must be at least 6 characters long.';
  }
  if (message.includes('auth/invalid-email')) {
    return 'Please enter a valid email address.';
  }
  if (message.includes('auth/operation-not-allowed')) {
    return 'Email/Password sign-in is disabled in your Firebase project. Enable it in Firebase Console → Authentication → Sign-in method.';
  }
  if (message.includes('auth/invalid-api-key')) {
    return 'Invalid Firebase API key. Please check your Firebase configuration setup.';
  }
  if (message.includes('auth/network-request-failed')) {
    return 'Network error while reaching Firebase. Check your connection and try again.';
  }
  if (message.includes('permission-denied') || message.includes('Missing or insufficient permissions')) {
    return 'Firestore permission denied. Update your Cloud Firestore Rules to allow authenticated reads and writes on the "customers" collection.';
  }
  if (message.includes('not-found') && message.includes('database')) {
    return 'Firestore database not found. Make sure Cloud Firestore is created in your Firebase Console.';
  }

  return message;
}
