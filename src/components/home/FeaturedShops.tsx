'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ShopCard from '@/components/shop/ShopCard';
import { Loader2, MapPin, Store } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useZone } from '@/hooks/useZone';
import { useRadiusStore } from '@/store/radius';
import RadiusMapControl from '@/components/home/RadiusMapControl';

export default function FeaturedShops() {
  const { location, loading } = useLocation();
  const zone = useZone();
  const { radiusKm } = useRadiusStore();

  const { data, isLoading } = useQuery({
    queryKey: ['featured-shops', location.lat, location.lng, radiusKm],
    queryFn: async () => {
      const res = await api.get('/api/search', {
        params: { q: 'shop', lat: location.lat, lng: location.lng, radius: radiusKm },
      });
      return res.data.results;
    },
    enabled: !loading,
  });

  if (isLoading || loading) {
    return (
      <section>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>Shops Near You</h2>
        <RadiusMapControl />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      </section>
    );
  }

  const locationLabel = location.label || (location.isDefault ? 'Vijayawada' : 'your area');

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Shops Near You</h2>
        {zone && (
          <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'var(--ry-green-light)', color: 'var(--ry-green)' }}>
            <MapPin size={11} />
            {zone.name}
          </span>
        )}
      </div>
      <RadiusMapControl />
      {data?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((shop: any) => (
            <ShopCard key={shop.shopId} shop={shop} />
          ))}
        </div>
      ) : (
        <div
          className="flex flex-col items-center justify-center gap-3 py-12 rounded-2xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface-2)' }}
          >
            <Store size={26} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>No shops near {locationLabel}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Try expanding your radius or changing location</p>
          </div>
        </div>
      )}
    </section>
  );
}
