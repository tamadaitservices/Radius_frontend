'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Phone, ShoppingBag, CheckCircle, LogOut, ChevronRight, Pencil, X, Save, Mail } from 'lucide-react';
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

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore();
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditEmail((user as any).email || '');
    }
  }, [user]);

  const { data: reservations } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => { const r = await api.get('/api/reservations/my'); return r.data; },
    enabled: !!user,
  });

  const saveProfile = useMutation({
    mutationFn: async () => api.patch('/api/users/me', {
      name: editName.trim() || undefined,
      email: editEmail.trim() || undefined,
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

  const avatarLetter = user.name ? user.name[0].toUpperCase() : user.phone?.[0] || '?';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {!editing ? (
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{ backgroundColor: 'var(--ry-green)' }}>
              {avatarLetter}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-gray-900 truncate">
                {user.name || <span className="text-gray-400 font-medium text-base">No name set</span>}
              </h1>
              {(user as any).email && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                  <Mail size={13} />
                  <span>{(user as any).email}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <Phone size={13} />
                <span>+91 {user.phone}</span>
              </div>
              {user.role === 'CUSTOMER' && (
                <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1.5">
                  <CheckCircle size={11} /> Verified Customer
                </span>
              )}
            </div>
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600"
            >
              <Pencil size={13} /> Edit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Email <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Mobile</label>
              <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                <Phone size={13} /> +91 {user.phone}
                <span className="ml-auto text-xs text-gray-400">Cannot change</span>
              </div>
            </div>

            <button
              onClick={() => saveProfile.mutate()}
              disabled={saveProfile.isPending}
              className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              <Save size={14} /> {saveProfile.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Reservations', value: stats.total, icon: '🔒' },
          { label: 'Walk-ins', value: stats.accepted, icon: '🛍️' },
          { label: 'Shops visited', value: stats.shops, icon: '🏪' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent reservations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag size={16} /> Recent Reservations
          </h2>
          <Link href="/reservations" className="text-sm font-semibold" style={{ color: 'var(--ry-green)' }}>
            View all
          </Link>
        </div>

        {!reservations?.length ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No reservations yet. Start browsing!</p>
            <Link href="/" className="mt-3 inline-block px-5 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: 'var(--ry-green)' }}>
              Browse Shops
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {reservations.slice(0, 5).map((res: any) => (
              <div key={res.id} className="flex gap-3 items-center p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {res.product?.image
                    ? <Image src={res.product.image} alt="" fill className="object-cover" sizes="40px" />
                    : <div className="absolute inset-0 flex items-center justify-center text-lg">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{res.product?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{res.shop?.name}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[res.status] || ''}`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {[
          { href: '/reservations', label: 'All Reservations', icon: '🔒' },
          { href: '/', label: 'Browse Shops', icon: '🔍' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
            <span className="text-xl">{item.icon}</span>
            <span className="flex-1 text-sm font-medium text-gray-700">{item.label}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>
        ))}
        <button onClick={handleLogout} className="flex items-center gap-3 p-4 w-full hover:bg-red-50 transition-colors text-left">
          <LogOut size={18} className="text-red-500" />
          <span className="flex-1 text-sm font-medium text-red-600">Log out</span>
        </button>
      </div>

    </div>
  );
}
