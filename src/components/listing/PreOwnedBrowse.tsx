'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Tag, Store, Plus, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import ListingCard from '@/components/listing/ListingCard';
import { useLocation } from '@/hooks/useLocation';
import { useAuthStore } from '@/store/auth';
import { LISTING_CATEGORY_ICONS, LISTING_CATEGORY_LABELS } from '@/lib/utils';

const CATEGORIES = Object.keys(LISTING_CATEGORY_LABELS);

export default function PreOwnedBrowse() {
  const { location, loading } = useLocation();
  const { user } = useAuthStore();
  const isVendor = (user as any)?.type === 'vendor';
  const [category, setCategory] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['listings-nearby', location.lat, location.lng, category],
    queryFn: async () => {
      const res = await api.get('/api/listings/nearby', {
        params: { lat: location.lat, lng: location.lng, radius: 15, category: category || undefined, limit: 40 },
      });
      return res.data.listings;
    },
    enabled: !loading,
  });

  return (
    <div className="space-y-6">
      {/* Header + Post CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Tag size={22} style={{ color: 'var(--ry-orange)' }} />
            Pre-Owned
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Buy and sell used items with people near you</p>
        </div>
        {user && !isVendor && (
          <Link
            href="/sell/new"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: 'var(--ry-orange)' }}
          >
            <Plus size={16} />
            Post a listing
          </Link>
        )}
      </div>

      {/* Become a Seller banner — shop owners with lots of stock */}
      {user && !isVendor && (
        <Link
          href="/vendor/register"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl border hover:shadow-sm transition-shadow"
          style={{ background: 'var(--ry-green-light)', borderColor: 'var(--ry-green)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
              <Store size={20} style={{ color: 'var(--ry-green)' }} />
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--ry-green)' }}>Have a shop with lots of stock?</p>
              <p className="text-xs" style={{ color: 'var(--ry-green)' }}>Become a Seller — list unlimited products, 0% commission.</p>
            </div>
          </div>
          <ArrowRight size={18} style={{ color: 'var(--ry-green)' }} className="flex-shrink-0" />
        </Link>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${!category ? 'text-white' : 'text-gray-600 border-gray-200'}`}
          style={!category ? { backgroundColor: 'var(--ry-orange)', borderColor: 'var(--ry-orange)' } : {}}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? null : c)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${category === c ? 'text-white' : 'text-gray-600 border-gray-200'}`}
            style={category === c ? { backgroundColor: 'var(--ry-orange)', borderColor: 'var(--ry-orange)' } : {}}
          >
            <span>{LISTING_CATEGORY_ICONS[c]}</span>
            {LISTING_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {isLoading || loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-orange-500" size={32} />
        </div>
      ) : data?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((listing: any) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-gray-100 bg-white">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
            <Tag size={26} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-gray-800">No listings near you yet</p>
            <p className="text-xs mt-1 text-gray-500">Be the first to post something for sale.</p>
          </div>
        </div>
      )}
    </div>
  );
}
