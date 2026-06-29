'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Mail, Store, CheckCircle } from 'lucide-react';
import api from '@/lib/api';

export default function VendorForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const forgot = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/vendor/forgot-password', { email });
    },
    onSuccess: () => setSent(true),
    onError: (err: any) => {
      if (!err.response) { toast.error('Cannot reach the server. Check your connection.'); return; }
      toast.error(err.response?.data?.error || 'Something went wrong. Please try again.');
    },
  });

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--ry-green-light)' }}>
            <Store size={28} style={{ color: 'var(--ry-green)' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-1">We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h2>
            <p className="text-sm text-gray-500 mb-6">
              If <strong>{email}</strong> is registered, you'll receive a reset link shortly. Check your spam folder if you don't see it.
            </p>
            <Link
              href="/vendor/login"
              className="text-sm font-semibold"
              style={{ color: 'var(--ry-green)' }}
            >
              ← Back to Login
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  placeholder="you@example.com"
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && validEmail && forgot.mutate()}
                />
              </div>
            </div>

            <button
              onClick={() => forgot.mutate()}
              disabled={!validEmail || forgot.isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              {forgot.isPending ? 'Sending...' : 'Send Reset Link'}
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
