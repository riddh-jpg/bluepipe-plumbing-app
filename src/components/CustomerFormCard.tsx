import React, { useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Send,
  User,
} from 'lucide-react';
import {
  formatFirestoreError,
  getFriendlyFirebaseError,
  OperationType,
  type FirebaseServices,
} from '../lib/firebaseManager';
import type { CustomerFormInput } from '../types/plumbing';

interface CustomerFormCardProps {
  services: FirebaseServices;
  userUid: string;
  userEmail: string;
  onSubmitted?: (customerName: string) => void;
}

const INITIAL_FORM: CustomerFormInput = {
  name: '',
  phoneNo: '',
  dob: '',
  email: '',
  address: '',
};

export const CustomerFormCard: React.FC<CustomerFormCardProps> = ({
  services,
  userUid,
  userEmail,
  onSubmitted,
}) => {
  const [form, setForm] = useState<CustomerFormInput>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const todayIso = new Date().toISOString().split('T')[0];

  const handlePhoneChange = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 10);
    setForm((prev) => ({ ...prev, phoneNo: digitsOnly }));
  };

  const validate = (): string | null => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      return 'Please enter the customer full name (at least 2 characters).';
    }
    if (!/^\d{10}$/.test(form.phoneNo)) {
      return 'Phone number must be exactly 10 digits.';
    }
    if (!form.dob) {
      return 'Please select the customer date of birth (DOB).';
    }
    if (form.dob > todayIso) {
      return 'Date of birth cannot be in the future.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Please enter a valid customer email address.';
    }
    if (!form.address.trim() || form.address.trim().length < 5) {
      return 'Please enter the full service address.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const collectionPath = 'customers';
    try {
      const payload = {
        name: form.name.trim().slice(0, 100),
        phoneNo: form.phoneNo,
        dob: form.dob,
        email: form.email.trim().toLowerCase().slice(0, 120),
        address: form.address.trim().slice(0, 250),
        source: 'form',
        createdByUid: userUid,
        createdByEmail: userEmail,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(services.db, collectionPath), payload);
      const savedName = payload.name;
      setForm(INITIAL_FORM);
      setSuccessMessage(`Saved "${savedName}" to Cloud Firestore (customers).`);
      onSubmitted?.(savedName);
    } catch (err) {
      formatFirestoreError(err, OperationType.CREATE, collectionPath, services.auth);
      setError(getFriendlyFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-[#F8FBFF]">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          Customer Application Form
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Register a plumbing service customer directly into Cloud Firestore
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4" noValidate>
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="cust-name"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="cust-name"
              type="text"
              required
              maxLength={100}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Rajesh Kumar"
              className="w-full min-h-[48px] pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Phone No & DOB side-by-side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="cust-phone"
                className="block text-xs font-semibold text-slate-700"
              >
                Phone No (10 digits)
              </label>
              <span
                className={`text-[11px] font-mono tabular-nums ${
                  form.phoneNo.length === 10 ? 'text-emerald-700 font-semibold' : 'text-slate-400'
                }`}
              >
                {form.phoneNo.length}/10
              </span>
            </div>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cust-phone"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                maxLength={10}
                required
                value={form.phoneNo}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="9876543210"
                className="w-full min-h-[48px] pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm font-mono tabular-nums text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="cust-dob"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              DOB (Date of Birth)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="cust-dob"
                type="date"
                required
                max={todayIso}
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="w-full min-h-[48px] pl-10 pr-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm font-mono tabular-nums text-slate-900 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="cust-email"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="cust-email"
              type="email"
              required
              maxLength={120}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="customer@example.com"
              className="w-full min-h-[48px] pl-10 pr-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label
            htmlFor="cust-address"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Address
          </label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <textarea
              id="cust-address"
              rows={3}
              required
              maxLength={250}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="House/Flat No, Street, Locality, City & ZIP"
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#1565C0] focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={submitting}
          className="tap-surface w-full min-h-[48px] px-5 py-3 rounded-2xl bg-[#1565C0] hover:bg-[#0D47A1] disabled:bg-blue-300 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm shadow-blue-900/15 cursor-pointer disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          <span>{submitting ? 'Saving to Firestore...' : 'Submit Customer Application'}</span>
        </button>
      </form>
    </div>
  );
};
