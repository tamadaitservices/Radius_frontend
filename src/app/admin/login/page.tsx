'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { loginErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.role === 'ADMIN') router.replace('/admin');
  }, [user]);

  const login = useMutation({
    mutationFn: async (vars: { email: string; password: string }) => {
      const res = await api.post('/api/auth/admin/login', vars);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      toast.success('Welcome, Admin.');
      router.push('/admin');
    },
    onError: (err: any) => toast.error(loginErrorMessage(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Read straight from the DOM — browser autofill/password managers set the
    // input value directly without always firing React's onChange, so `email`
    // and `password` state can lag behind what's actually in the fields.
    const currentEmail = emailRef.current?.value ?? email;
    const currentPassword = passwordRef.current?.value ?? password;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail) && currentPassword) {
      login.mutate({ email: currentEmail, password: currentPassword });
    }
  };

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen w-full flex" style={{ background: '#0f1a14' }}>

      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: '#0f3d2e' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl"
            style={{ background: '#16a34a' }}>R</div>
          <span className="text-white font-black text-xl tracking-tight">RadiuYes</span>
        </div>

        <div>
          <h1 className="text-5xl font-black text-white leading-tight mb-4">
            Admin<br />Control<br />Panel
          </h1>
          <p className="text-green-300 text-lg font-medium mb-12">
            Manage vendors, shops, products<br />and the entire RadiuYes platform.
          </p>

          <div className="space-y-4">
            {[
              { n: '13', label: 'Active Shops' },
              { n: '3', label: 'Verified Vendors' },
              { n: '61', label: 'Products Listed' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="text-2xl font-black text-green-400">{s.n}</span>
                <span className="text-green-200 text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-green-700 text-xs">
          © {new Date().getFullYear()} RadiuYes · Vijayawada
        </p>
      </div>

      {/* Right — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black"
              style={{ background: '#16a34a' }}>R</div>
            <span className="text-white font-black text-lg">RadiuYes Admin</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-1">Sign in</h2>
          <p className="text-sm mb-8" style={{ color: '#6b7280' }}>
            Authorised administrators only
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#9ca3af' }}>
                Email address
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="admin@radiuyes.com"
                required
                autoFocus
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
                style={{
                  background: '#1a2d22',
                  border: '1.5px solid #2d4a38',
                  color: '#f1f5f9',
                  caretColor: '#4ade80',
                }}
                onFocus={e => (e.target.style.borderColor = '#16a34a')}
                onBlur={e => (e.target.style.borderColor = '#2d4a38')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#9ca3af' }}>
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm font-medium focus:outline-none transition-all"
                  style={{
                    background: '#1a2d22',
                    border: '1.5px solid #2d4a38',
                    color: '#f1f5f9',
                    caretColor: '#4ade80',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#16a34a')}
                  onBlur={e => (e.target.style.borderColor = '#2d4a38')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#4b5563' }}
                  onMouseEnter={e => ((e.target as HTMLElement).style.color = '#9ca3af')}
                  onMouseLeave={e => ((e.target as HTMLElement).style.color = '#4b5563')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3.5 rounded-xl text-white font-extrabold text-base tracking-wide transition-all disabled:opacity-40 mt-2"
              style={{
                background: login.isPending ? '#16a34a' : '#22c55e',
                border: '1.5px solid #4ade80',
                boxShadow: '0 0 24px rgba(34,197,94,0.45)',
              }}
            >
              {login.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #1f2f25' }}>
            <a href="/"
              className="text-sm font-medium transition-colors"
              style={{ color: '#4b5563' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = '#9ca3af')}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = '#4b5563')}
            >
              ← Back to RadiuYes
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
