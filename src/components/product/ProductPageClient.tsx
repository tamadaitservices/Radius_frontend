'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, ShoppingBag, MapPin, Star, Clock,
  CheckCircle, Loader2, Store,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, CATEGORY_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import ReservationModal from '@/components/shop/ReservationModal';

const ICONS = CATEGORY_ICONS as Record<string, string>;

export default function ProductPageClient({ id }: { id: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [reserving, setReserving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/api/products/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-gray-500">Product not found.</div>;

  const { shop, otherProducts = [], ...product } = data;

  const discount = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Product image */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="relative aspect-square bg-gray-50">
            {product.image ? (
              <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {ICONS[product.category] || '🛍️'}
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="text-lg font-black text-red-600 bg-red-50 px-4 py-2 rounded-xl">Out of Stock</span>
              </div>
            )}
            {discount && (
              <span
                className="absolute top-3 right-3 text-xs font-black px-3 py-1.5 rounded-lg text-white"
                style={{ backgroundColor: 'var(--ry-orange)' }}
              >
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right: Product info */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h1 className="text-2xl font-black text-gray-900 leading-tight">{product.name}</h1>
            {product.sku && (
              <p className="text-xs font-mono text-gray-400 mt-1">SKU: #{product.sku}</p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-black text-gray-900">{formatPrice(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.mrp)}</span>
              )}
            </div>

            {product.description && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{product.description}</p>
            )}

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">{tag}</span>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-5">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold border-2 text-base"
                  style={{ borderColor: 'var(--ry-green)', color: 'var(--ry-green)' }}
                >
                  <Phone size={18} />
                  Call Shop
                </a>
              )}
              {product.inStock && shop.isCurrentlyOpen && (
                <button
                  onClick={() => {
                    if (!user) { toast.error('Login to reserve'); return; }
                    setReserving(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-base"
                  style={{ backgroundColor: 'var(--ry-orange)' }}
                >
                  <ShoppingBag size={18} />
                  Reserve 45 min
                </button>
              )}
            </div>
          </div>

          {/* Shop info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Shop</h2>
            <Link href={`/shop/${shop.slug || shop.id}`} className="flex items-start gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                {ICONS[shop.category] || '🏪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 group-hover:text-green-700 transition-colors">{shop.name}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin size={11} />
                  <span>{shop.area}, {shop.city}</span>
                </div>
                {shop.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <Star size={11} className="fill-yellow-400 text-yellow-400" />
                    <span>{shop.rating.toFixed(1)} ({shop.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
              <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg ${shop.isCurrentlyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {shop.isCurrentlyOpen ? '● Open' : '● Closed'}
              </span>
            </Link>

            <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50">
              <Clock size={12} />
              <span>{shop.openingTime} – {shop.closingTime}</span>
            </div>

            <Link
              href={`/shop/${shop.slug || shop.id}`}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Store size={14} />
              View Full Shop
            </Link>
          </div>
        </div>
      </div>

      {/* Other products */}
      {otherProducts.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-black text-gray-900 mb-3">More from {shop.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {otherProducts.map((p: any) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-green-200 hover:shadow-sm transition-all"
              >
                <div className="relative h-28 bg-gray-50">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" sizes="200px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl">
                      {ICONS[p.category] || '🛍️'}
                    </div>
                  )}
                  {!p.inStock && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-500">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{p.name}</p>
                  <p className="text-sm font-black text-gray-900 mt-1">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {reserving && (
        <ReservationModal
          shopId={shop.id}
          product={product}
          onClose={() => setReserving(false)}
        />
      )}
    </div>
  );
}
