'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Home, Shield, ArrowLeft, Loader2, LocateFixed, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';

type Step = 'phone' | 'otp' | 'profile' | 'location';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [pendingRefresh, setPendingRefresh] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<any>(null);

  const confirmationRef = useRef<any>(null);
  const recaptchaVerifierRef = useRef<any>(null);

  const setupRecaptcha = async () => {
    const { RecaptchaVerifier } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
    }
    return recaptchaVerifierRef.current;
  };

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setSending(true);
    try {
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      const verifier = await setupRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      confirmationRef.current = confirmation;
      setStep('otp');
      toast.success('OTP sent!');
    } catch (e: any) {
      const code = e?.code ?? '';
      console.error('[OTP Error]', code, e?.message, e);
      if (code === 'auth/invalid-phone-number') toast.error('Invalid phone number.');
      else if (code === 'auth/too-many-requests') toast.error('Too many attempts. Try later.');
      else if (code.includes('app-not-configured') || code.includes('api-key')) toast.error('Firebase not configured. Contact support.');
      else toast.error(`OTP failed (${code || 'unknown'}). Check console.`);
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || !confirmationRef.current) return;
    setVerifying(true);
    try {
      const result = await confirmationRef.current.confirm(otp);
      const idToken = await result.user.getIdToken();

      const res = await api.post('/api/auth/firebase-phone-verify', { idToken });
      const { accessToken, refreshToken, isNewUser, user } = res.data;

      setPendingToken(accessToken);
      setPendingRefresh(refreshToken);
      setPendingUser(user);

      if (isNewUser) {
        setStep('profile');
      } else {
        finishLogin(user, accessToken, refreshToken);
      }
    } catch (e: any) {
      const code = e?.code ?? '';
      if (code === 'auth/invalid-verification-code') toast.error('Wrong OTP. Try again.');
      else if (code === 'auth/code-expired') toast.error('OTP expired. Go back and request a new one.');
      else toast.error(e?.response?.data?.error || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) { toast.error('Please enter your name.'); return; }
    setSavingProfile(true);
    try {
      await api.patch(
        '/api/users/me',
        { name: name.trim(), ...(email.trim() ? { email: email.trim() } : {}) },
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
    if (step === 'otp') {
      setStep('phone');
      setOtp('');
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } else if (step === 'profile') {
      setStep('otp');
    } else if (step === 'location') {
      setStep('profile');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] overflow-y-auto flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        {step !== 'phone' ? (
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
              {step === 'phone' && 'Enter your mobile number to continue'}
              {step === 'otp' && `OTP sent to +91 ${phone}`}
              {step === 'profile' && 'Tell us a bit about yourself'}
              {step === 'location' && 'Allow location for nearby shops'}
            </p>
          </div>

          {/* ── Phone ── */}
          {step === 'phone' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold block mb-2" style={{ color: 'var(--foreground)' }}>Mobile Number</label>
                <div className="flex rounded-xl border-2 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                  <span className="flex items-center px-3 text-sm font-medium border-r" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--input-bg)' }}>+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    className="flex-1 px-3 py-3 focus:outline-none text-lg font-medium tracking-wider"
                    style={{ background: 'var(--input-bg)', color: 'var(--foreground)' }}
                    maxLength={10}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && phone.length === 10 && !sending && handleSendOtp()}
                  />
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length !== 10 || sending}
                className="w-full py-3 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                {sending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <>Get OTP <ChevronRight size={16} /></>}
              </button>

              <p className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-subtle)' }}>
                <Shield size={12} className="flex-shrink-0 mt-0.5" />
                Your number is used only for login and is never shared.
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
                />
              </div>

              <div>
                <label className="text-sm font-semibold block mb-1.5" style={{ color: 'var(--foreground)' }}>
                  Email{' '}
                  <span className="text-sm font-normal" style={{ color: 'var(--text-subtle)' }}>(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
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

      {/* Always-mounted reCAPTCHA anchor — must stay outside conditional rendering */}
      <div id="recaptcha-container" style={{ position: 'fixed', bottom: 0, left: 0 }} />
    </div>
  );
}
