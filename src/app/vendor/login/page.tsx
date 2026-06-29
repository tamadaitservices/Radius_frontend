'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Store, Mail, Eye, EyeOff, KeyRound } from 'lucide-react';
import api, { loginErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Step = 'email' | 'otp';
type Mode = 'otp' | 'password';

export default function VendorLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [mode, setMode] = useState<Mode>('password');
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  function handleSuccess(data: any) {
    const vendorUser = {
      id: data.vendor.id,
      phone: data.vendor.phone,
      email: data.vendor.email,
      name: data.vendor.name,
      role: 'VENDOR',
      type: 'vendor' as const,
    };
    setAuth(vendorUser, data.accessToken, data.refreshToken);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    toast.success(`Welcome back, ${data.vendor.name}!`);
    router.push('/vendor/dashboard');
  }

  // OTP flow — step 1: send OTP
  const sendOtp = useMutation({
    mutationFn: async () => {
      await api.post('/api/auth/vendor/send-otp', { email });
    },
    onSuccess: () => {
      setStep('otp');
      toast.success('OTP sent to your email.');
    },
    onError: (err: any) => toast.error(loginErrorMessage(err)),
  });

  // OTP flow — step 2: verify OTP
  const verifyOtp = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/auth/vendor/verify-otp', { email, code: otp });
      return res.data;
    },
    onSuccess: handleSuccess,
    onError: (err: any) => {
      if (!err.response) { toast.error('Cannot reach the server. Check your connection.'); return; }
      const s = err.response.status;
      if (s === 401) toast.error('Invalid or expired OTP. Please try again.');
      else if (s === 429) toast.error('Too many attempts. Please wait and try again.');
      else toast.error(err.response?.data?.error || 'Verification failed.');
    },
  });

  // Password login
  const passwordLogin = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/auth/vendor/login', { email, password });
      return res.data;
    },
    onSuccess: handleSuccess,
    onError: (err: any) => toast.error(loginErrorMessage(err)),
  });

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--ry-green-light)' }}>
            <Store size={28} style={{ color: 'var(--ry-green)' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Vendor Login</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your shop and reservations</p>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-gray-200 p-1 mb-2">
          <button
            onClick={() => { setMode('password'); setStep('email'); setOtp(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'password' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Password
          </button>
          <button
            onClick={() => { setMode('otp'); setStep('email'); setOtp(''); }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'otp' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Email OTP
          </button>
        </div>
        {mode === 'otp' && (
          <p className="text-xs text-center text-gray-400 mb-4">Use this if you forgot your password</p>
        )}

        {mode === 'otp' ? (
          step === 'email' ? (
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
                    className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && validEmail && sendOtp.mutate()}
                  />
                </div>
              </div>
              <button
                onClick={() => sendOtp.mutate()}
                disabled={!validEmail || sendOtp.isPending}
                className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {sendOtp.isPending ? 'Sending...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit OTP sent to <strong>{email}</strong>
                </p>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="• • • • • •"
                    className="w-full pl-9 pr-4 text-center py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-2xl font-bold tracking-[0.5em]"
                    maxLength={6}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && verifyOtp.mutate()}
                  />
                </div>
              </div>
              <button
                onClick={() => verifyOtp.mutate()}
                disabled={otp.length !== 6 || verifyOtp.isPending}
                className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {verifyOtp.isPending ? 'Verifying...' : 'Verify & Login'}
              </button>
              <div className="flex justify-between text-sm">
                <button onClick={() => { setStep('email'); setOtp(''); }} className="text-gray-500 hover:text-gray-700">
                  ← Change email
                </button>
                <button
                  onClick={() => sendOtp.mutate()}
                  disabled={sendOtp.isPending}
                  className="text-green-700 font-semibold hover:underline disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )
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
                  className="w-full pl-9 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="/vendor/forgot-password" className="text-xs font-medium" style={{ color: 'var(--ry-green)' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pl-4 pr-10 py-2.5 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && validEmail && password && passwordLogin.mutate()}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => passwordLogin.mutate()}
              disabled={!validEmail || !password || passwordLogin.isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              {passwordLogin.isPending ? 'Logging in...' : 'Login'}
            </button>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
          New vendor?{' '}
          <Link href="/vendor/register" className="font-semibold" style={{ color: 'var(--ry-green)' }}>
            Register free
          </Link>
        </div>
      </div>
    </div>
  );
}
