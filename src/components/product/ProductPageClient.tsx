'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Phone, ShoppingBag, MapPin, Star, Clock,
  CheckCircle, Loader2, Store, Navigation,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/store/auth';
import ReservationModal from '@/components/shop/ReservationModal';

export default function ProductPageClient({ id }: { id: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { icons: ICONS } = useCategories();
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

            {/* Row 1: Call + Reserve */}
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

            {/* Row 2: WhatsApp + Directions */}
            <div className="flex gap-2 mt-2">
              {shop.whatsapp && (
                <a
                  href={`https://wa.me/91${shop.whatsapp}?text=${encodeURIComponent(`Hi! I found ${product.name} on RadiuYes. Is it available?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-white text-sm"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
              {shop.latitude && shop.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold border text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--ry-border)' }}
                >
                  <Navigation size={15} />
                  Directions
                </a>
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
