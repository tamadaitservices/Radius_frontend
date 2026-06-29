'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Store, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const reset = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/vendor/reset-password', { token, password });
    },
    onSuccess: () => {
      setDone(true);
      setTimeout(() => router.push('/vendor/login'), 3000);
    },
    onError: (err: any) => {
      if (!err.response) { toast.error('Cannot reach the server. Check your connection.'); return; }
      const s = err.response.status;
      if (s === 400) toast.error(err.response?.data?.error || 'This link has expired. Please request a new one.');
      else toast.error('Something went wrong. Please try again.');
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8 text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Invalid Link</h2>
          <p className="text-sm text-gray-500 mb-6">This reset link is missing or malformed.</p>
          <Link href="/vendor/forgot-password" className="text-sm font-semibold" style={{ color: 'var(--ry-green)' }}>
            Request a new link →
          </Link>
        </div>
      </div>
    );
  }

  const valid = password.length >= 8 && password === confirm;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--ry-green-light)' }}>
            <Store size={28} style={{ color: 'var(--ry-green)' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-1">Choose a strong password for your vendor account</p>
        </div>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Password Reset!</h2>
            <p className="text-sm text-gray-500">Redirecting you to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">New Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  autoFocus
                  className="w-full pl-9 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className={`w-full pl-9 pr-4 py-2.5 border-2 rounded-xl focus:outline-none text-sm ${
                    confirm && password !== confirm ? 'border-red-300 focus:border-red-400' : 'border-gray-200 focus:border-green-600'
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && valid && reset.mutate()}
                />
              </div>
              {confirm && password !== confirm && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
              )}
            </div>

            <button
              onClick={() => reset.mutate()}
              disabled={!valid || reset.isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              {reset.isPending ? 'Resetting...' : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link href="/vendor/login" className="text-sm text-gray-500 hover:text-gray-700">
                ← Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-green-600" size={28} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
