'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { loginErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Phone, Shield } from 'lucide-react';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);

  const sendOtp = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/auth/send-otp', { phone });
      return res.data;
    },
    onSuccess: (data) => {
      setIsNewUser(!!data.isNewUser);
      setStep('otp');
      toast.success(data.isNewUser ? 'Welcome! OTP sent to your number.' : 'OTP sent to your number');
    },
    onError: (err: any) => {
      if (!err.response) { toast.error('Cannot reach the server. Check your internet connection.'); return; }
      const status = err.response.status;
      if (status === 404) toast.error('No account found with this number. Please register first.');
      else if (status === 429) toast.error('Too many attempts. Please wait a minute and try again.');
      else if (status >= 500) toast.error('Server error. Please try again in a moment.');
      else toast.error(err.response?.data?.error || 'Failed to send OTP. Try again.');
    },
  });

  const verifyOtp = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/auth/verify-otp', { phone, code: otp });
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      toast.success('Welcome to RadiuYes!');
      router.push('/');
    },
    onError: (err: any) => {
      if (!err.response) { toast.error('Cannot reach the server. Check your connection.'); return; }
      const status = err.response.status;
      if (status === 400) toast.error('Invalid or expired OTP. Please try again.');
      else if (status === 429) toast.error('Too many attempts. Please wait and try again.');
      else if (status >= 500) toast.error('Server error. Please try again in a moment.');
      else toast.error(err.response?.data?.error || 'Verification failed. Please try again.');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm shadow-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">
            <span className="text-gray-900">Radiu</span>
            <span style={{ color: 'var(--ry-green)' }}>Yes</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Shop within your radius</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">+91</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-lg font-medium tracking-wider"
                  maxLength={10}
                />
              </div>
            </div>

            <button
              onClick={() => sendOtp.mutate()}
              disabled={phone.length !== 10 || sendOtp.isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              {sendOtp.isPending ? 'Sending...' : 'Get OTP'}
            </button>

            <div className="flex items-start gap-2 text-xs text-gray-400 pt-2">
              <Shield size={12} className="flex-shrink-0 mt-0.5" />
              <span>Your number is only used for login. We never share it with anyone.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {isNewUser && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-medium">
                🎉 Creating your new RadiuYes account!
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit OTP sent to <strong>+91 {phone}</strong>
              </p>
              <input
                type="tel"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full text-center py-3 border-2 border-gray-200 rounded-xl focus:border-green-600 focus:outline-none text-2xl font-bold tracking-[0.5em]"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              onClick={() => verifyOtp.mutate()}
              disabled={otp.length !== 6 || verifyOtp.isPending}
              className="w-full py-3 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-50"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              {verifyOtp.isPending ? 'Verifying...' : isNewUser ? 'Create Account' : 'Verify & Login'}
            </button>

            <button
              onClick={() => { setStep('phone'); setOtp(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              ← Change number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
