'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Store, Phone, User, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import FieldError, { fieldBorder } from '@/components/vendor/FieldError';
import { requiredText, mobileError, emailError, passwordError, visibleError, firstProblem } from '@/lib/validators';

export default function VendorRegisterPage() {
  const router = useRouter();
  const { setAuth, user: customerUser } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    phone: customerUser?.type !== 'vendor' ? (customerUser?.phone ?? '') : '',
    email: '',
    name: customerUser?.type !== 'vendor' ? (customerUser?.name ?? '') : '',
    shopName: '',
    password: '',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const register = useMutation({
    mutationFn: async () => {
      const res = await api.post('/api/auth/vendor/register', form);
      return res.data;
    },
    onSuccess: (data) => {
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
      toast.success('Account created! Add your shop next.');
      router.push('/vendor/dashboard');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Registration failed.'),
  });

  const [submitted, setSubmitted] = useState(false);
  const errors = {
    phone: mobileError(form.phone),
    email: emailError(form.email),
    name: requiredText(form.name, 'Your name', { min: 2, max: 100 }),
    shopName: requiredText(form.shopName, 'Shop name', { min: 2, max: 200 }),
    password: passwordError(form.password),
  };
  const shown = (key: keyof typeof errors) => visibleError(errors[key], form[key], submitted);

  const submit = () => {
    setSubmitted(true);
    const problem = firstProblem(Object.values(errors));
    if (problem) {
      toast.error(problem.more ? `${problem.message} (${problem.more} more to fix — see the red fields)` : problem.message, { duration: 6000 });
      return;
    }
    register.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: 'var(--ry-green-light)' }}>
            <Store size={28} style={{ color: 'var(--ry-green)' }} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">List your shop on RadiuYes</h1>
          <p className="text-sm text-gray-500 mt-1">Free for 6 months. 0% commission. Ever.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Mobile Number</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                placeholder="9876543210"
                className={`w-full pl-9 pr-4 py-2.5 border-2 ${fieldBorder(shown('phone'))} rounded-xl focus:outline-none text-sm`}
              />
            </div>
            <FieldError message={shown('phone')} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className={`w-full pl-9 pr-4 py-2.5 border-2 ${fieldBorder(shown('email'))} rounded-xl focus:outline-none text-sm`}
              />
            </div>
            <FieldError message={shown('email')} />
            <p className="text-xs text-gray-400 mt-1">Used for OTP login and important notifications.</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Your Name</label>
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Raju Sharma"
                className={`w-full pl-9 pr-4 py-2.5 border-2 ${fieldBorder(shown('name'))} rounded-xl focus:outline-none text-sm`}
              />
            </div>
            <FieldError message={shown('name')} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Shop Name</label>
            <div className="relative">
              <Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.shopName}
                onChange={set('shopName')}
                placeholder="Raju Electronics"
                className={`w-full pl-9 pr-4 py-2.5 border-2 ${fieldBorder(shown('shopName'))} rounded-xl focus:outline-none text-sm`}
              />
            </div>
            <FieldError message={shown('shopName')} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Min 8 characters"
                className={`w-full pl-9 pr-10 py-2.5 border-2 ${fieldBorder(shown('password'))} rounded-xl focus:outline-none text-sm`}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <FieldError message={shown('password')} />
            <p className="text-xs text-gray-400 mt-1">Backup login method if OTP email is unavailable.</p>
          </div>

          <button
            onClick={submit}
            disabled={register.isPending}
            className="w-full py-3 rounded-xl text-white font-bold text-base disabled:opacity-50 transition-opacity mt-2"
            style={{ backgroundColor: 'var(--ry-green)' }}
          >
            {register.isPending ? 'Creating account...' : 'Create Free Account'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            By registering you agree to RadiuYes vendor terms. No payment required.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/vendor/login" className="font-semibold" style={{ color: 'var(--ry-green)' }}>
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
