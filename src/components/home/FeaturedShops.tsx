'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import ShopCard from '@/components/shop/ShopCard';
import { Loader2, MapPin } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useZone } from '@/hooks/useZone';

export default function FeaturedShops() {
  const { location, loading } = useLocation();
  const zone = useZone();

  const { data, isLoading } = useQuery({
    queryKey: ['featured-shops', location.lat, location.lng],
    queryFn: async () => {
      const res = await api.get('/api/search', {
        params: { q: 'shop', lat: location.lat, lng: location.lng, radius: 10 },
      });
      return res.data.results;
    },
    enabled: !loading,
  });

  if (isLoading || loading) {
    return (
      <section>
        <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>Shops Near You</h2>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-green-600" size={32} />
        </div>
      </section>
    );
  }

  if (!data?.length) return null;

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((shop: any) => (
          <ShopCard key={shop.shopId} shop={shop} />
        ))}
      </div>
    </section>
  );
}
