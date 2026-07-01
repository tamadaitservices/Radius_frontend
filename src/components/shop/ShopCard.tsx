'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import { formatDistance, formatPrice, CATEGORY_ICONS } from '@/lib/utils';

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

export default function ShopCard({ shop }: ShopCardProps) {
  return (
    <Link
      href={`/shop/${shop.slug}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow block"
    >
      {/* Cover image */}
      <div className="relative h-36 bg-gray-100">
        {shop.coverImage ? (
          <Image src={shop.coverImage} alt={shop.shopName} fill className="object-cover" sizes="(max-width: 640px) 100vw, 300px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {CATEGORY_ICONS[shop.category] || '🏪'}
          </div>
        )}
        {shop.isFeatured && (
          <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: 'var(--ry-orange)' }}>
            Featured
          </span>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-md ${
            shop.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {shop.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight">{shop.shopName}</h3>

        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <div className="flex items-center gap-0.5">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="font-medium text-gray-700">{shop.rating.toFixed(1)}</span>
            <span>({shop.reviewCount})</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-0.5">
            <MapPin size={11} />
            <span>{formatDistance(shop.distance)}</span>
          </div>
          <span>•</span>
          <span>{shop.area}</span>
        </div>

        {/* Product previews */}
        {shop.products.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
            {shop.products.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                onClick={(e) => e.stopPropagation()}
                className="flex-shrink-0 w-20 text-center hover:opacity-80 transition-opacity"
              >
                <div className="w-20 h-16 bg-gray-50 rounded-lg overflow-hidden relative">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-xl">📦</div>
                  )}
                </div>
                <p className="text-xs text-gray-700 mt-1 leading-tight truncate">{p.name}</p>
                <p className="text-xs font-bold text-gray-900">{formatPrice(p.price)}</p>
              </Link>
            ))}
          </div>
        )}

      </div>
    </Link>
  );
}
