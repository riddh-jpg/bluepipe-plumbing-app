import React, { useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import {
  AlertCircle,
  CheckCircle2,
  DatabaseZap,
  MapPin,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { DUMMY_CUSTOMERS } from '../data/dummyCustomers';
import {
  formatFirestoreError,
  getFriendlyFirebaseError,
  OperationType,
  type FirebaseServices,
} from '../lib/firebaseManager';
import type { CustomerRecord } from '../types/plumbing';

interface CustomerListPanelProps {
  services: FirebaseServices;
  customers: CustomerRecord[];
  loading: boolean;
  loadError: string | null;
  userUid: string;
  userEmail: string;
}

export const CustomerListPanel: React.FC<CustomerListPanelProps> = ({
  services,
  customers,
  loading,
  loadError,
  userUid,
  userEmail,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNo.includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  const handleLoadDummyCustomers = async () => {
    setActionError(null);
    setActionSuccess(null);
    setSeeding(true);

    const collectionPath = 'customers';
    try {
      const batch = writeBatch(services.db);
      for (const dummy of DUMMY_CUSTOMERS) {
        const newDocRef = doc(collection(services.db, collectionPath));
        batch.set(newDocRef, {
          name: dummy.name,
          phoneNo: dummy.phoneNo,
          dob: dummy.dob,
          email: dummy.email,
          address: dummy.address,
          source: 'dummy',
          createdByUid: userUid,
          createdByEmail: userEmail,
          createdAt: serverTimestamp(),
        });
      }
      await batch.commit();
      setActionSuccess(
        'Inserted 5 dummy customers into Cloud Firestore (customers collection).'
      );
    } catch (err) {
      formatFirestoreError(err, OperationType.WRITE, collectionPath, services.auth);
      setActionError(getFriendlyFirebaseError(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setDeletingId(customerId);
    const docPath = `customers/${customerId}`;
    try {
      await deleteDoc(doc(services.db, 'customers', customerId));
      setConfirmDeleteId(null);
    } catch (err) {
      formatFirestoreError(err, OperationType.DELETE, docPath, services.auth);
      setActionError(getFriendlyFirebaseError(err));
    } finally {
      setDeletingId(null);
    }
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const formatTimestamp = (ms: number | null) => {
    if (!ms) return 'Just now';
    return new Date(ms).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-[#F8FBFF]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Saved Customers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
              {customers.length} {customers.length === 1 ? 'record' : 'records'} · Live Firestore sync
            </p>
          </div>

          <button
            type="button"
            onClick={handleLoadDummyCustomers}
            disabled={seeding}
            className="tap-surface min-h-[44px] px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#1565C0] text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <DatabaseZap className="w-4 h-4 shrink-0" />
            <span>{seeding ? 'Inserting 5...' : 'Load 5 Dummy Customers'}</span>
          </button>
        </div>

        {/* Search Filter */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, 10-digit phone, email, or address..."
            aria-label="Search saved customers"
            className="w-full min-h-[44px] pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Feedback alerts */}
      {(loadError || actionError || actionSuccess) && (
        <div className="px-5 sm:px-6 pt-4 space-y-2.5">
          {loadError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{loadError}</span>
            </div>
          )}
          {actionError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}
          {actionSuccess && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{actionSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* List Content */}
      <div className="divide-y divide-slate-100">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 w-44 bg-slate-200 rounded" />
                <div className="h-3 w-64 bg-slate-100 rounded" />
                <div className="h-3 w-52 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1565C0] flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              {searchQuery ? 'No matching customers' : 'No customers saved yet'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Try clearing your search filter to see all Firestore records.'
                : 'Submit the Customer Application Form or tap "Load 5 Dummy Customers" above.'}
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => {
            const initials = customer.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase() ?? '')
              .join('');

            return (
              <article
                key={customer.id}
                className="px-5 sm:px-6 py-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full bg-[#E3F2FD] text-[#1565C0] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      {initials || 'CU'}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {customer.name}
                      </h3>

                      {/* Unboxed clean metadata with typographic separators */}
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 font-mono tabular-nums">
                        <span>{formatPhone(customer.phoneNo)}</span>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span>DOB {customer.dob}</span>
                      </div>

                      <div className="text-xs text-slate-600 truncate">
                        {customer.email}
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-slate-500 pt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{customer.address}</span>
                      </div>

                      <div className="text-[11px] text-slate-400 pt-0.5">
                        <span>Added {formatTimestamp(customer.createdAtMs)}</span>
                        {customer.source === 'dummy' && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span>Sample record</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete control with safe 2-step inline confirmation */}
                  <div className="shrink-0">
                    {confirmDeleteId === customer.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={deletingId === customer.id}
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="min-h-[36px] px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-semibold hover:bg-red-700 cursor-pointer"
                        >
                          {deletingId === customer.id ? '...' : 'Delete'}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        aria-label={`Delete ${customer.name}`}
                        onClick={() => setConfirmDeleteId(customer.id)}
                        className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
