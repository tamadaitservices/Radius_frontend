'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { Tag, Store } from 'lucide-react';

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
  const { data, isLoading } = useQuery<FeaturedProduct[]>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const res = await api.get('/api/products/featured');
      return res.data;
    },
  });

  if (isLoading || !data || data.length === 0) return null;

  const discount = (p: FeaturedProduct) =>
    p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Tag size={20} style={{ color: 'var(--ry-orange)' }} />
        <h2 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>Featured Products</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {data.map((product) => {
          const pct = discount(product);
          return (
            <Link
              key={product.id}
              href={`/shop/${product.shop.slug}`}
              className="group rounded-xl overflow-hidden border transition-shadow hover:shadow-md"
              style={{ background: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              {/* Image */}
              <div className="relative w-full aspect-square overflow-hidden" style={{ background: 'var(--input-bg)' }}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-4xl select-none opacity-30">📦</div>
                )}
                {pct && (
                  <span
                    className="absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: 'var(--ry-orange)' }}
                  >
                    -{pct}%
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-semibold leading-tight line-clamp-2" style={{ color: 'var(--foreground)' }}>
                  {product.name}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-bold" style={{ color: 'var(--ry-green)' }}>
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.mrp && product.mrp > product.price && (
                    <span className="text-xs line-through" style={{ color: 'var(--text-subtle)' }}>
                      ₹{product.mrp.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Store size={11} style={{ color: 'var(--text-muted)' }} />
                  <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {product.shop.name}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
