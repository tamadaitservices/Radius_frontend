'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, ShoppingBag, CheckCircle, LogOut, ChevronRight, Pencil, X, Save, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-orange-600 bg-orange-50',
  ACCEPTED: 'text-green-700 bg-green-50',
  DECLINED: 'text-red-600 bg-red-50',
  EXPIRED: 'text-gray-500 bg-gray-100',
  COMPLETED: 'text-blue-600 bg-blue-50',
};

export const AVATARS = [
  '🦁', '🐯', '🐻', '🐼', '🦊',
  '🐺', '🦝', '🐮', '🐷', '🐸',
  '🐧', '🦅', '🦋', '🐬', '🦄',
  '🐲', '🤖', '👨‍💻', '🧑‍🚀', '🥷',
];

export const AVATAR_BG: Record<string, string> = {
  '🦁': '#E8A838', '🐯': '#D4701A', '🐻': '#8B6914', '🐼': '#3D3D3D', '🦊': '#D45E1A',
  '🐺': '#6B7280', '🦝': '#5C5C5C', '🐮': '#5B88C0', '🐷': '#E8829A', '🐸': '#4CAF50',
  '🐧': '#1E3A5F', '🦅': '#7B4F2E', '🦋': '#9C27B0', '🐬': '#0288D1', '🦄': '#E91E63',
  '🐲': '#2E7D32', '🤖': '#455A64', '👨‍💻': '#1976D2', '🧑‍🚀': '#37474F', '🥷': '#212121',
};

// level 1 = 0 purchases (starter), level N unlocked at (N-1)*3 purchases
export function avatarLevel(completedCount: number) {
  return Math.min(Math.floor(completedCount / 3) + 1, 20);
}

export function AvatarDisplay({ value, size = 64 }: { value?: string | null; size?: number }) {
  if (value?.startsWith('http')) {
    return <img src={value} alt="" className="rounded-2xl object-cover flex-shrink-0" style={{ width: size, height: size }} />;
  }
  if (value && AVATARS.includes(value)) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl flex-shrink-0"
        style={{ width: size, height: size, backgroundColor: AVATAR_BG[value] || '#16a34a', fontSize: size * 0.5 }}
      >
        {value}
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-2xl flex-shrink-0 text-white font-black"
      style={{ width: size, height: size, backgroundColor: 'var(--ry-green)', fontSize: size * 0.38 }}
    >
      {String.fromCodePoint(0x1F464)}
    </div>
  );
}

export default function ProfilePage() {
  const { user, setAuth, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState<string>('');

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail((user as any).email || '');
      setEditAvatar((user as any).avatar || '');
    }
  }, [user]);

  const { data: reservations } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => { const r = await api.get('/api/reservations/my'); return r.data; },
    enabled: !!user,
  });

  const completedCount = reservations?.filter((r: any) => r.status === 'COMPLETED').length || 0;
  const level = avatarLevel(completedCount);
  const purchasesInCurrentLevel = completedCount % 3;
  const purchasesToNextLevel = level < 20 ? 3 - purchasesInCurrentLevel : 0;

  const saveProfile = useMutation({
    mutationFn: async () => api.patch('/api/users/me', {
      ...(editName.trim() ? { name: editName.trim() } : {}),
      ...(editEmail.trim() ? { email: editEmail.trim() } : {}),
      ...(editAvatar ? { avatar: editAvatar } : {}),
    }),
    onSuccess: (res) => {
      const updated = res.data;
      const token = localStorage.getItem('accessToken') || '';
      const refresh = localStorage.getItem('refreshToken') || '';
      setAuth(updated, token, refresh);
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated.');
      setEditing(false);
    },
    onError: () => toast.error('Failed to save. Try again.'),
  });

  const stats = {
    total: reservations?.length || 0,
    accepted: reservations?.filter((r: any) => ['ACCEPTED', 'COMPLETED'].includes(r.status)).length || 0,
    shops: new Set(reservations?.map((r: any) => r.shopId)).size || 0,
  };

  const handleLogout = () => {
    clearAuth();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    toast.success('Logged out.');
    router.push('/');
  };

  if (!user) return null;

  const currentAvatar = (user as any).avatar;

  const card = 'rounded-2xl border p-4';
  const cardStyle = { background: 'var(--surface)', borderColor: 'var(--border)' };
  const labelCls = 'text-xs font-semibold uppercase tracking-wide block mb-1';
  const labelStyle = { color: 'var(--text-subtle)' };
  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none border';
  const inputStyle = { background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--foreground)' };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Profile card */}
      <div className={card} style={cardStyle}>
        {!editing ? (
          <div className="flex items-start gap-4">
            <AvatarDisplay value={currentAvatar} size={64} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black truncate" style={{ color: 'var(--foreground)' }}>
                  {user.name || <span className="font-medium text-base italic" style={{ color: 'var(--text-subtle)' }}>No name set</span>}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: 'var(--ry-green-light)', color: 'var(--ry-green)' }}>
                  Lv.{level}
                </span>
              </div>
              {(user as any).email && (
                <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <Mail size={13} /><span className="truncate">{(user as any).email}</span>
                </div>
              )}
              {(user as any).phone && (
                <div className="flex items-center gap-1 text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={13} /><span>+91 {(user as any).phone}</span>
                </div>
              )}
              {user.role === 'CUSTOMER' && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mt-1.5" style={{ color: 'var(--ry-green)', background: 'var(--ry-green-light)' }}>
                  <CheckCircle size={11} /> Verified Customer
                </span>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors flex-shrink-0"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--surface-2)' }}
            >
              <Pencil size={13} /> Edit
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold" style={{ color: 'var(--foreground)' }}>Edit Profile</h2>
              <button onClick={() => setEditing(false)} style={{ color: 'var(--text-subtle)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Avatar picker */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls} style={labelStyle}>Choose Avatar</label>
                <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
                  {level < 20 ? `${purchasesToNextLevel} more to unlock next` : 'All unlocked!'}
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {AVATARS.map((av, i) => {
                  const unlocked = i < level;
                  return (
                    <button
                      key={av}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => unlocked && setEditAvatar(av)}
                      className="relative flex items-center justify-center rounded-xl transition-all"
                      style={{
                        width: 44, height: 44, fontSize: 22,
                        backgroundColor: !unlocked ? 'var(--surface-2)' : editAvatar === av ? AVATAR_BG[av] || '#16a34a' : 'var(--surface-2)',
                        outline: editAvatar === av && unlocked ? `3px solid ${AVATAR_BG[av] || '#16a34a'}` : '3px solid transparent',
                        outlineOffset: 2,
                        opacity: unlocked ? 1 : 0.4,
                        cursor: unlocked ? 'pointer' : 'not-allowed',
                        filter: unlocked ? 'none' : 'grayscale(1)',
                      }}
                    >
                      {!unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)' }}>
                          <Lock size={12} style={{ color: 'var(--text-subtle)' }} />
                        </div>
                      )}
                      <span style={{ visibility: unlocked ? 'visible' : 'hidden' }}>{av}</span>
                    </button>
                  );
                })}
              </div>
              {editAvatar && (
                <button type="button" onClick={() => setEditAvatar('')} className="mt-1.5 text-xs underline" style={{ color: 'var(--text-subtle)' }}>
                  Clear avatar
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className={labelCls} style={labelStyle}>Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name" className={inputCls} style={inputStyle} />
            </div>

            {/* Email */}
            <div>
              <label className={labelCls} style={labelStyle}>
                Email <span className="normal-case font-normal">(optional)</span>
              </label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                placeholder="you@example.com" className={inputCls} style={inputStyle} />
            </div>

            {/* Phone readonly */}
            <div>
              <label className={labelCls} style={labelStyle}>Mobile</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                <Phone size={13} />
                <span>{(user as any).phone ? `+91 ${(user as any).phone}` : 'Not set'}</span>
                <span className="ml-auto text-xs" style={{ color: 'var(--text-subtle)' }}>Cannot change</span>
              </div>
            </div>

            <button
              onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}
              className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              <Save size={14} /> {saveProfile.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Level progress */}
      {level < 20 && (
        <div className={card} style={cardStyle}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>Level {level} → {level + 1}</span>
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{purchasesInCurrentLevel}/3 purchases</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(purchasesInCurrentLevel / 3) * 100}%`, backgroundColor: 'var(--ry-green)' }} />
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--text-subtle)' }}>
            {purchasesToNextLevel} more confirmed purchase{purchasesToNextLevel !== 1 ? 's' : ''} to unlock <strong>{AVATARS[level]}</strong>
          </p>
        </div>
      )}
      {level === 20 && (
        <div className="rounded-2xl p-4 text-center border" style={{ background: 'var(--ry-green-light)', borderColor: 'rgba(12,131,31,0.2)' }}>
          <p className="font-bold text-sm" style={{ color: 'var(--ry-green)' }}>🏆 Max level reached! All avatars unlocked.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Reservations', value: stats.total, icon: '🔒' },
          { label: 'Purchases', value: completedCount, icon: '✅' },
          { label: 'Shops visited', value: stats.shops, icon: '🏪' },
        ].map((s) => (
          <div key={s.label} className={card + ' text-center'} style={cardStyle}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-2xl font-black" style={{ color: 'var(--foreground)' }}>{s.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent reservations */}
      <div className={card} style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <ShoppingBag size={16} /> Recent Reservations
          </h2>
          <Link href="/reservations" className="text-sm font-semibold" style={{ color: 'var(--ry-green)' }}>View all</Link>
        </div>

        {!reservations?.length ? (
          <div className="text-center py-8">
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>No reservations yet. Start browsing!</p>
            <Link href="/" className="mt-3 inline-block px-5 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: 'var(--ry-green)' }}>
              Browse Shops
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {reservations.slice(0, 5).map((res: any) => (
              <div key={res.id} className="p-3 rounded-xl transition-colors" style={{ background: 'var(--surface)' }}>
                <div className="flex gap-3 items-center">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
                    {res.product?.image
                      ? <Image src={res.product.image} alt="" fill className="object-cover" sizes="40px" />
                      : <div className="absolute inset-0 flex items-center justify-center text-lg">📦</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{res.product?.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-subtle)' }}>{res.shop?.name}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[res.status] || ''}`}>
                    {res.status}
                  </span>
                </div>
                {res.status === 'ACCEPTED' && res.pin && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: 'var(--ry-green-light)', border: '1px solid rgba(12,131,31,0.15)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--ry-green)' }}>Show to vendor:</span>
                    <span className="text-xl font-black tracking-[0.3em]" style={{ color: 'var(--ry-green)' }}>{res.pin}</span>
                    <span className="ml-auto text-xs" style={{ color: 'var(--ry-green)' }}>Purchase PIN</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        {[
          { href: '/reservations', label: 'All Reservations', icon: '🔒' },
          { href: '/', label: 'Browse Shops', icon: '🔍' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 p-4 border-b transition-colors"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1 text-sm font-medium">{item.label}</span>
            <ChevronRight size={16} style={{ color: 'var(--text-subtle)' }} />
          </Link>
        ))}
        <button onClick={handleLogout}
          className="flex items-center gap-3 p-4 w-full transition-colors text-left"
          style={{ background: 'var(--surface)', color: '#ef4444' }}
        >
          <LogOut size={18} />
          <span className="flex-1 text-sm font-medium">Log out</span>
        </button>
      </div>

    </div>
  );
}
