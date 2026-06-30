'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Loader2, Phone } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, getTimeLeft } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import ReviewForm from '@/components/shop/ReviewForm';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Waiting for shop', color: 'text-orange-600 bg-orange-50' },
  ACCEPTED: { label: 'Confirmed — Walk in!', color: 'text-green-700 bg-green-50' },
  DECLINED: { label: 'Declined by shop', color: 'text-red-600 bg-red-50' },
  EXPIRED: { label: 'Expired', color: 'text-gray-500 bg-gray-100' },
  COMPLETED: { label: 'Completed', color: 'text-blue-600 bg-blue-50' },
};

function CountdownBadge({ expiresAt, status }: { expiresAt: string; status: string }) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!['PENDING', 'ACCEPTED'].includes(status)) return;
    const t = setInterval(() => setTimeLeft(getTimeLeft(expiresAt)), 1000);
    setTimeLeft(getTimeLeft(expiresAt));
    return () => clearInterval(t);
  }, [expiresAt, status]);

  if (!['PENDING', 'ACCEPTED'].includes(status)) return null;
  return (
    <div className="flex items-center gap-1 text-xs font-mono font-bold text-orange-600">
      <Clock size={12} />
      {timeLeft}
    </div>
  );
}

export default function ReservationsPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  useEffect(() => { if (!user) router.push('/login'); }, [user]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-reservations'],
    queryFn: async () => { const res = await api.get('/api/reservations/my'); return res.data; },
    enabled: !!user,
  });

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-green-600" size={40} /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-black text-gray-900 mb-6">My Reservations</h1>

      {!data?.length ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No reservations yet</h2>
          <p className="text-gray-500 mb-4">Find a product, call the shop to confirm availability, then reserve.</p>
          <button onClick={() => router.push('/')} className="px-6 py-2 rounded-lg text-white font-semibold" style={{ backgroundColor: 'var(--ry-green)' }}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((res: any) => {
            const sc = STATUS_CONFIG[res.status] || STATUS_CONFIG.EXPIRED;
            return (
              <div key={res.id} className="rounded-2xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {res.product?.image ? (
                      <Image src={res.product.image} alt={res.product.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate" style={{ color: 'var(--foreground)' }}>{res.product?.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{res.shop?.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                      <CountdownBadge expiresAt={res.expiresAt} status={res.status} />
                    </div>
                    {res.agreedPrice && (
                      <p className="text-sm font-bold mt-1" style={{ color: 'var(--foreground)' }}>Agreed: {formatPrice(res.agreedPrice)}</p>
                    )}
                  </div>
                </div>

                {['PENDING', 'ACCEPTED'].includes(res.status) && res.shop?.phone && (
                  <a
                    href={`tel:${res.shop.phone}`}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold border"
                    style={{ borderColor: 'var(--ry-green)', color: 'var(--ry-green)', background: 'var(--ry-green-light)' }}
                  >
                    <Phone size={14} />
                    Call Shop
                  </a>
                )}
                {res.status === 'ACCEPTED' && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(res.shop?.address || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-bold"
                    style={{ backgroundColor: 'var(--ry-green)' }}
                  >
                    <MapPin size={14} />
                    Get Directions Now
                  </a>
                )}
                {['ACCEPTED', 'COMPLETED'].includes(res.status) && (
                  <ReviewForm
                    reservationId={res.id}
                    shopName={res.shop?.name || 'Shop'}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
