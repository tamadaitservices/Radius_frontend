'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Home, Shield, ArrowLeft, Loader2, LocateFixed, ChevronRight, Mail } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Step = 'email' | 'otp' | 'profile' | 'location';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingRefresh, setPendingRefresh] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const [isNewUser, setIsNewUser] = useState(false);

  const handleSendOtp = async () => {
    if (!email.includes('@')) return;
    setSending(true);
    try {
      const res = await api.post('/api/auth/send-otp', { email });
      setIsNewUser(res.data.isNewUser);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to send OTP. Try again.');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setVerifying(true);
    try {
      const res = await api.post('/api/auth/verify-otp', { email, code: otp });
      const { accessToken, refreshToken, user } = res.data;

      setPendingToken(accessToken);
      setPendingRefresh(refreshToken);
      setPendingUser(user);

      if (isNewUser) {
        setStep('profile');
      } else {
        finishLogin(user, accessToken, refreshToken);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Wrong OTP. Try again.');
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const res = await api.post('/api/auth/google', { credential: credentialResponse.credential });
      const { accessToken, refreshToken, user, isNewUser: newUser } = res.data;

      if (newUser && !user.name) {
        setPendingToken(accessToken);
        setPendingRefresh(refreshToken);
        setPendingUser(user);
        setIsNewUser(true);
        setStep('profile');
      } else {
        finishLogin(user, accessToken, refreshToken);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Google login failed. Try again.');
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error('Please enter your name.'); return; }
    setSavingProfile(true);
    try {
      await api.patch(
        '/api/users/me',
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${pendingToken}` } }
      );
      setStep('location');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to save. Try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveLocation = async (skip = false) => {
    if (skip) {
      finishLogin({ ...pendingUser, name }, pendingToken!, pendingRefresh!);
      return;
    }
    setSavingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      await api.patch(
        '/api/users/me',
        { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
        { headers: { Authorization: `Bearer ${pendingToken}` } }
      );
    } catch {
      // location optional; continue
    } finally {
      setSavingLocation(false);
      finishLogin({ ...pendingUser, name }, pendingToken!, pendingRefresh!);
    }
  };

  const finishLogin = (user: any, accessToken: string, refreshToken: string) => {
    setAuth(user, accessToken, refreshToken);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    toast.success(`Welcome${user.name ? `, ${user.name}` : ''}!`);
    router.push('/');
  };

  const goBack = () => {
    if (step === 'otp') { setStep('email'); setOtp(''); }
    else if (step === 'profile') setStep('otp');
    else if (step === 'location') setStep('profile');
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        {step !== 'email' ? (
          <button onClick={goBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={18} /> Back
          </button>
        ) : <div />}

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}
        >
          <Home size={14} /> Home
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm space-y-6">

          {/* Logo */}
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight">
              <span style={{ color: 'var(--foreground)' }}>Radiu</span>
              <span style={{ color: 'var(--ry-green)' }}>Yes</span>
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {step === 'email' && 'Sign in to continue'}
              {step === 'otp' && `Check your email — ${email}`}
              {step === 'profile' && 'Tell us a bit about yourself'}
              {step === 'location' && 'Allow location for nearby shops'}
            </p>
          </div>

          {/* ── Email ── */}
          {step === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--foreground)' }}>Email address</label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ color: 'var(--text-subtle)' }}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-12 pl-9 pr-4 rounded-xl border-2 focus:outline-none text-base"
                    style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && email.includes('@') && !sending && handleSendOtp()}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={!email.includes('@') || sending}
                className="w-full py-3 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Continue with Email <ChevronRight size={16} /></>}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--text-subtle)' }}>or</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* Google login */}
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast.error('Google login failed. Try again.')}
                  theme="outline"
                  size="large"
                  width="100%"
                  text="continue_with"
                  shape="rectangular"
                />
              </div>

              <p className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                <Shield size={12} className="flex-shrink-0 mt-0.5" />
                Your information is used only for login and is never shared.
              </p>
            </div>
          )}

          {/* ── OTP ── */}
          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--foreground)' }}>6-Digit OTP</label>
                <input
                  type="tel"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  className="w-full text-center py-3 px-4 border-2 rounded-xl focus:outline-none text-2xl font-bold tracking-[0.5em]"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  maxLength={6}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && otp.length === 6 && !verifying && handleVerifyOtp()}
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || verifying}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {verifying ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify OTP'}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={sending}
                className="w-full text-sm text-center"
                style={{ color: 'var(--text-subtle)' }}
              >
                {sending ? 'Resending…' : 'Resend OTP'}
              </button>
            </div>
          )}

          {/* ── Profile (new users) ── */}
          {step === 'profile' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-4xl">👋</span>
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Your Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ravi Kumar"
                  autoFocus
                  className="w-full px-4 py-3 border-2 rounded-xl focus:outline-none text-base"
                  style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                  onKeyDown={(e) => e.key === 'Enter' && !savingProfile && handleSaveProfile()}
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={!name.trim() || savingProfile}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {savingProfile ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <>Continue <ChevronRight size={16} /></>}
              </button>
            </div>
          )}

          {/* ── Location (new users) ── */}
          {step === 'location' && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <span className="text-4xl">📍</span>
              </div>

              <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>
                We use your location to show the nearest shops first.
              </p>

              <button
                onClick={() => handleSaveLocation(false)}
                disabled={savingLocation}
                className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {savingLocation
                  ? <><Loader2 size={16} className="animate-spin" /> Getting location...</>
                  : <><LocateFixed size={16} /> Use My Location</>
                }
              </button>

              <button
                onClick={() => handleSaveLocation(true)}
                disabled={savingLocation}
                className="w-full py-2 text-sm"
                style={{ color: 'var(--text-subtle)' }}
              >
                Skip for now
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
