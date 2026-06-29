'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState, Suspense } from 'react';
import { Loader2, SlidersHorizontal, MapPin, LocateFixed, X } from 'lucide-react';
import api from '@/lib/api';
import ShopCard from '@/components/shop/ShopCard';
import { useLocation } from '@/hooks/useLocation';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/utils';

const CATEGORIES = Object.keys(CATEGORY_LABELS);

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const [radius, setRadius] = useState(5);
  const { location, loading: locLoading, refresh } = useLocation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['search', query, radius, location.lat, location.lng, categoryParam],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        q: query,
        lat: location.lat,
        lng: location.lng,
        radius,
      };
      if (categoryParam) params.category = categoryParam;
      const res = await api.get('/api/search', { params });
      return res.data;
    },
    enabled: !!query && !locLoading,
  });

  const clearCategory = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    router.push(`/search?${params.toString()}`);
  };

  const setCategory = (cat: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', cat);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search header */}
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {query ? `Results for "${query}"` : 'Search for products'}
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {data && (
              <p className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={12} />
                {data.count} shop{data.count !== 1 ? 's' : ''} within {radius}km
              </p>
            )}
            <button
              onClick={refresh}
              disabled={locLoading}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
              style={{ color: location.isDefault ? 'var(--ry-orange)' : 'var(--ry-green)' }}
            >
              <LocateFixed size={11} />
              {locLoading ? 'Locating...' : location.isDefault ? 'Using Vijayawada (tap to update)' : 'Location detected'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-500" />
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-600"
          >
            <option value={1}>Within 1 km</option>
            <option value={2}>Within 2 km</option>
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
          </select>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        {categoryParam && (
          <button
            onClick={clearCategory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold text-white flex-shrink-0"
            style={{ backgroundColor: 'var(--ry-green)' }}
          >
            {CATEGORY_ICONS[categoryParam]} {CATEGORY_LABELS[categoryParam]}
            <X size={13} />
          </button>
        )}
        {!categoryParam && CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 flex-shrink-0"
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            <span className="text-gray-700">{CATEGORY_LABELS[cat]}</span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {(isLoading || locLoading) && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-green-600" size={40} />
          <p className="text-gray-500 text-sm">{locLoading ? 'Getting your location...' : 'Finding shops near you...'}</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-20">
          <p className="text-red-500">Search failed. Please try again.</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && data && data.count === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No shops found</h2>
          <p className="text-gray-500 mb-4">
            No nearby shops have "{query}" within {radius}km.
            {categoryParam && ` Try removing the ${CATEGORY_LABELS[categoryParam]} filter or`}
            {' '}Try expanding your radius.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            {categoryParam && (
              <button onClick={clearCategory} className="px-5 py-2 rounded-lg border-2 font-semibold text-sm text-gray-700 hover:bg-gray-50">
                Remove Category Filter
              </button>
            )}
            <button
              onClick={() => setRadius(Math.min(radius + 5, 20))}
              className="px-5 py-2 rounded-lg text-white font-semibold text-sm"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              Expand to {Math.min(radius + 5, 20)}km
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && data?.results?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.results.map((shop: any) => (
            <ShopCard key={shop.shopId} shop={shop} />
          ))}
        </div>
      )}

      {/* No query */}
      {!query && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛍️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">What are you looking for?</h2>
          <p className="text-gray-500">Type a product, category, or describe what you need</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>}>
      <SearchResults />
    </Suspense>
  );
}
