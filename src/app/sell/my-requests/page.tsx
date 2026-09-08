'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { ArrowLeft, Loader2, Phone, Clock, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useCustomerGuard } from '@/hooks/useCustomerGuard';

interface ContactRequest {
  id: string;
  askingPrice: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  listing: { title: string; images: string[]; price: number; status: string };
  sellerPhone: string | null;
  sellerName: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Waiting for seller', color: 'text-orange-600 bg-orange-50' },
  APPROVED: { label: 'Approved', color: 'text-green-700 bg-green-50' },
  REJECTED: { label: 'Offer rejected', color: 'text-red-600 bg-red-50' },
};

export default function MyRequestsPage() {
  const { isCustomer } = useCustomerGuard();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['contact-requests-my'],
    queryFn: async () => { const r = await api.get('/api/listings/contact-requests/my'); return r.data as ContactRequest[]; },
    enabled: isCustomer,
    refetchInterval: 15000,
  });

  if (!isCustomer) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-black text-gray-900 mb-6">My Requests</h1>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
      ) : !data?.length ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">📞</div>
          <p className="font-bold text-gray-900 mb-1">No requests yet</p>
          <p className="text-sm text-gray-500 mb-4">Browse Pre-Owned listings and request contact on something you like.</p>
          <a href="/sell" className="inline-block px-6 py-2 rounded-xl text-white font-semibold text-sm" style={{ backgroundColor: 'var(--ry-orange)' }}>
            Browse Pre-Owned
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((r) => {
            const sc = STATUS_CONFIG[r.status];
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex gap-3">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {r.listing.images?.[0] ? (
                      <Image src={r.listing.images[0]} alt={r.listing.title} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate text-gray-900">{r.listing.title}</p>
                    <p className="text-sm text-gray-500">Your offer: {formatPrice(r.askingPrice)}</p>
                    <span className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${sc.color}`}>{sc.label}</span>
                  </div>
                </div>

                {r.status === 'PENDING' && (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-orange-50 text-orange-700 text-sm">
                    <Clock size={15} className="flex-shrink-0" />
                    Waiting for the seller to respond.
                  </div>
                )}

                {r.status === 'APPROVED' && r.sellerPhone && (
                  <a
                    href={`tel:${r.sellerPhone}`}
                    className="mt-3 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold text-sm"
                    style={{ backgroundColor: 'var(--ry-green)' }}
                  >
                    <Phone size={16} />
                    Call {r.sellerName || 'Seller'} — {r.sellerPhone}
                  </a>
                )}

                {r.status === 'REJECTED' && (
                  <div className="mt-3 flex items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-500 text-sm">
                    <XCircle size={15} className="flex-shrink-0" />
                    The seller declined this offer. No contact details were shared.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
