'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Phone, Star, ShoppingBag, CheckCircle, LogOut, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'text-orange-600 bg-orange-50',
  ACCEPTED: 'text-green-700 bg-green-50',
  DECLINED: 'text-red-600 bg-red-50',
  EXPIRED: 'text-gray-500 bg-gray-100',
  COMPLETED: 'text-blue-600 bg-blue-50',
};

export default function ProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  const { data: reservations } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => { const r = await api.get('/api/reservations/my'); return r.data; },
    enabled: !!user,
  });

  const updateName = useMutation({
    mutationFn: async (name: string) => api.patch('/api/users/me', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Name updated.');
    },
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Profile card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0" style={{ backgroundColor: 'var(--ry-green)' }}>
            {user.name ? user.name[0].toUpperCase() : user.phone[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-gray-900 truncate">{user.name || 'Your Profile'}</h1>
            <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
              <Phone size={13} />
              <span>+91 {user.phone}</span>
            </div>
            {user.role === 'CUSTOMER' && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                <CheckCircle size={11} /> Verified Customer
              </span>
            )}
          </div>
        </div>
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
