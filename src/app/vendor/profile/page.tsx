'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, Store, Phone, ShieldCheck, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import api from '@/lib/api';
import { useVendorGuard } from '@/hooks/useVendorGuard';

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-100 text-blue-700',
  PRO: 'bg-purple-100 text-purple-700',
  BUSINESS: 'bg-yellow-100 text-yellow-700',
};

export default function VendorProfilePage() {
  const { isVendor } = useVendorGuard();
  const router = useRouter();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', next: '' });

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor-profile'],
    queryFn: async () => { const r = await api.get('/api/vendor/profile'); return r.data; },
  });

  const changePassword = useMutation({
    mutationFn: async () =>
      api.post('/api/vendor/change-password', { currentPassword: passwords.current, newPassword: passwords.next }),
    onSuccess: () => {
      toast.success('Password changed.');
      setPasswords({ current: '', next: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to change password.'),
  });

  if (!isVendor) return null;
  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" size={36} /></div>;
  if (!vendor) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/vendor/dashboard" className="p-2 hover:bg-gray-100 rounded-xl text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-black text-gray-900">Vendor Account</h1>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{ backgroundColor: 'var(--ry-green)' }}>
            {(vendor.name?.[0] ?? '?').toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900">{vendor.name}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Store size={13} /> {vendor.shopName}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${PLAN_COLORS[vendor.plan] || ''}`}>
                {vendor.plan} Plan
              </span>
              {vendor.isVerified && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-semibold">
                  <ShieldCheck size={11} /> Verified
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Phone size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Phone</p>
              <p className="text-sm font-semibold text-gray-900">+91 {vendor.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <Store size={16} className="text-gray-400" />
            <div>
              <p className="text-xs text-gray-400 font-medium">Registered Shop Name</p>
              <p className="text-sm font-semibold text-gray-900">{vendor.shopName}</p>
            </div>
          </div>
          {vendor.planExpiry && (
            <div className="p-3 bg-yellow-50 rounded-xl text-sm text-yellow-800">
              Plan valid until {new Date(vendor.planExpiry).toLocaleDateString('en-IN')}
            </div>
          )}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">Change Password</h3>
        <div className="space-y-3">
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={passwords.current}
              onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))}
              placeholder="Current password"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm pr-11"
            />
            <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={passwords.next}
              onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))}
              placeholder="New password (min 8 characters)"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm pr-11"
            />
            <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            onClick={() => changePassword.mutate()}
            disabled={passwords.current.length < 1 || passwords.next.length < 8 || changePassword.isPending}
            className="w-full py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--ry-green)' }}
          >
            {changePassword.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        <Link href="/vendor/dashboard" className="flex items-center gap-3 p-4 hover:bg-gray-50 text-sm font-medium text-gray-700">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
