export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

export interface CustomerFormInput {
  name: string;
  phoneNo: string;
  dob: string;
  email: string;
  address: string;
}

export interface CustomerRecord extends CustomerFormInput {
  id: string;
  createdAtMs: number | null;
  createdByUid?: string;
  createdByEmail?: string;
  source?: 'form' | 'dummy';
}
