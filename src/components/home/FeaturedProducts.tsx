'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Sparkles, Package } from 'lucide-react';
import GlassCard, { Pill } from '@/components/ui/GlassCard';
import { useLocation } from '@/hooks/useLocation';

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  mrp: number | null;
  image: string | null;
  category: string | null;
  shop: {
    id: string;
    name: string;
    area: string;
    slug: string;
    category: string;
  };
}

export default function FeaturedProducts() {
  const { location, loading } = useLocation();

  const { data, isLoading } = useQuery<FeaturedProduct[]>({
    queryKey: ['featured-products', location.lat, location.lng],
    queryFn: async () => {
      const res = await api.get('/api/products/featured', {
        params: { lat: location.lat, lng: location.lng, radius: 10 },
      });
      return res.data;
    },
    enabled: !loading,
  });

  if (isLoading || loading) return null;

  const locationLabel = location.label || (location.isDefault ? 'Vijayawada' : 'your area');

  const discount = (p: FeaturedProduct) =>
    p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={22} style={{ color: 'var(--star)' }} />
        <h2 className="text-xl font-extrabold" style={{ color: 'var(--foreground)' }}>Featured Products</h2>
      </div>

      {data && data.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {data.map((product, i) => {
            const pct = discount(product);
            return (
              <GlassCard
                key={product.id}
                href={`/product/${product.id}`}
                image={product.image}
                fallbackEmoji="📦"
                title={product.name}
                subtitle={product.shop.name}
                price={`₹${product.price.toLocaleString('en-IN')}`}
                badge={pct ? <Pill tone="brand">-{pct}%</Pill> : undefined}
                tint={i + 1}
              />
            );
          })}
        </div>
      ) : (
        <div
          className="ry-card flex flex-col items-center justify-center gap-3 py-12"
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface-2)' }}
          >
            <Package size={26} style={{ color: 'var(--text-subtle)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>No featured products near {locationLabel}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>Vendors in this area haven't added featured items yet</p>
          </div>
        </div>
      )}
    </section>
  );
}
