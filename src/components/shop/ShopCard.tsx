'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Phone, BadgeCheck, Footprints } from 'lucide-react';
import { formatDistance, formatPrice } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

interface ShopCardProps {
  shop: {
    shopId: string;
    slug: string;
    shopName: string;
    area: string;
    distance: number;
    phone: string;
    isOpen: boolean;
    isFeatured: boolean;
    rating: number;
    reviewCount: number;
    coverImage: string | null;
    category: string;
    products: Array<{ id: string; name: string; price: number; image: string | null; inStock: boolean }>;
  };
}

const hashTint = (s: string) => (Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0) % 5) + 1;

export default function ShopCard({ shop }: ShopCardProps) {
  const { icons: CATEGORY_ICONS } = useCategories();
  return (
    <div
      className="ry-card relative p-2 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ borderRadius: 28 }}
    >
      {/* Card-wide link; the product chips below sit above it */}
      <Link href={`/shop/${shop.slug}`} aria-label={shop.shopName} className="absolute inset-0 z-0 rounded-[28px]" />

      {/* Cover image */}
      <div className="relative h-40 rounded-[22px] overflow-hidden" style={{ background: `var(--tint-${hashTint(shop.shopId)})` }}>
        {shop.coverImage ? (
          <Image src={shop.coverImage} alt={shop.shopName} fill className="object-cover" sizes="(max-width: 640px) 100vw, 300px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl">
            {CATEGORY_ICONS[shop.category] || '🏪'}
          </div>
        )}
        <span
          className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90"
          style={{ color: shop.isOpen ? 'var(--success)' : '#dc2626' }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: shop.isOpen ? 'var(--success)' : '#dc2626' }} />
          {shop.isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full text-white" style={{ background: 'rgba(15,27,61,0.72)' }}>
          <Footprints size={11} />
          {formatDistance(shop.distance)}
        </span>
      </div>

      <div className="px-2.5 pt-3 pb-1.5 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-[15px] leading-tight truncate" style={{ color: 'var(--foreground)' }}>{shop.shopName}</h3>
            {shop.isFeatured && <BadgeCheck size={15} style={{ color: 'var(--brand-ink)' }} className="flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={12} className="flex-shrink-0" />
            <span className="truncate">{shop.area}</span>
            {shop.reviewCount > 0 && (
              <>
                <Star size={12} className="flex-shrink-0 ml-1" style={{ color: 'var(--star)', fill: 'var(--star)' }} />
                <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{shop.rating.toFixed(1)}</span>
                <span>({shop.reviewCount})</span>
              </>
            )}
          </div>
        </div>
        {shop.phone && (
          <span className="ry-round-btn" aria-hidden="true">
            <Phone size={16} />
          </span>
        )}
      </div>

      {/* Product previews */}
      {shop.products.length > 0 && (
        <div className="mt-2 px-2.5 pb-1.5 flex gap-2 overflow-x-auto no-scrollbar">
          {shop.products.slice(0, 3).map((p) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              className="relative z-10 flex-shrink-0 flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:brightness-95 transition"
              style={{ background: 'var(--surface-2)' }}
            >
              <span className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 bg-white">
                {p.image ? (
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="28px" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs">📦</span>
                )}
              </span>
              <span className="text-[11px] font-semibold truncate max-w-[88px]" style={{ color: 'var(--foreground)' }}>{p.name}</span>
              <span className="text-[11px] font-black" style={{ color: 'var(--foreground)' }}>{formatPrice(p.price)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
