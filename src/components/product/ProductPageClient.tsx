'use client';

import { useState, useEffect } from 'react';
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
import GlassCard from '@/components/ui/GlassCard';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/store/auth';
import ReservationModal from '@/components/shop/ReservationModal';

export default function ProductPageClient({ id }: { id: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { icons: ICONS, reservationEnabled: CATEGORY_RESERVATION_ENABLED } = useCategories();
  const [reserving, setReserving] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  useEffect(() => setActiveImageIndex(0), [id]);

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
        <Loader2 className="animate-spin text-[var(--brand)]" size={40} />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-gray-500">Product not found.</div>;

  const { shop, otherProducts = [], ...product } = data;
  const canReserve = !!product.reservationEnabled && (CATEGORY_RESERVATION_ENABLED[shop.category] ?? true);
  const images: string[] = product.images?.length ? product.images : product.image ? [product.image] : [];
  const activeImage = images[Math.min(activeImageIndex, images.length - 1)];

  const discount = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : null;
  const whatsappMessage = [
    'Hi! I found this product on RadiuYes and want to know if it is available:',
    '',
    `*${product.name}*`,
    `Price: ${formatPrice(product.price)}${product.mrp && product.mrp > product.price ? ` (MRP ${formatPrice(product.mrp)}, ${discount}% off)` : ''}`,
    product.sku ? `SKU: #${product.sku}` : '',
    product.description ? `Details: ${String(product.description).replace(/\s+/g, ' ').slice(0, 150)}` : '',
    product.tags?.length > 0 ? `Variants/tags: ${product.tags.join(', ')}` : '',
    `Shop: ${shop.name}`,
    `Link: ${typeof window !== 'undefined' ? window.location.origin : 'https://radiuyes.com'}/product/${product.id}`,
  ].filter(Boolean).join('\n');

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold mb-4 hover:opacity-80 transition-opacity"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Left: Product image */}
        <div>
          <div className="relative aspect-square rounded-[32px] overflow-hidden" style={{ background: 'var(--tint-1)', boxShadow: 'var(--shadow-lift)' }}>
            {activeImage ? (
              <Image src={activeImage} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {ICONS[product.category] || '🛍️'}
              </div>
            )}
            {!product.inStock && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="text-lg font-black text-red-600 bg-red-50 px-5 py-2 rounded-full">Out of Stock</span>
              </div>
            )}
            {discount && (
              <span
                className="absolute top-4 right-4 text-xs font-black px-3.5 py-1.5 rounded-full"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--on-brand)' }}
              >
                {discount}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2.5 pt-4 overflow-x-auto">
              {images.map((url, i) => (
                <button
                  key={url}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden border-2 transition-colors ${i === activeImageIndex ? 'border-[var(--brand)]' : 'border-transparent'}`}
                >
                  <Image src={url} alt={`${product.name} ${i + 1}`} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product info */}
        <div className="flex flex-col gap-5">
          <div className="px-1">
            <h1 className="text-3xl font-black leading-tight" style={{ color: 'var(--foreground)' }}>{product.name}</h1>
            {product.sku && (
              <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-subtle)' }}>SKU: #{product.sku}</p>
            )}

            <div className="flex items-center gap-3 mt-4">
              <span className="text-4xl font-black" style={{ color: 'var(--foreground)' }}>{formatPrice(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-lg line-through" style={{ color: 'var(--text-subtle)' }}>{formatPrice(product.mrp)}</span>
              )}
            </div>

            {product.description && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>{product.description}</p>
            )}

            {product.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {product.tags.map((tag: string) => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{tag}</span>
                ))}
              </div>
            )}

            {/* Row 1: Call + Reserve */}
            <div className="flex gap-2 mt-5">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-base transition hover:brightness-95"
                  style={{ background: 'var(--brand-light)', color: 'var(--brand-ink)' }}
                >
                  <Phone size={18} />
                  Call Shop
                </a>
              )}
              {product.inStock && shop.isCurrentlyOpen && canReserve && (
                <button
                  onClick={() => {
                    if (!user) { toast.error('Login to reserve'); return; }
                    setReserving(true);
                  }}
                  className="ry-pill-btn flex-1 !py-3.5 text-base"
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
                  href={`https://wa.me/91${shop.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-full font-bold text-white text-sm"
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
                  className="ry-pill-ghost flex-1 !py-3.5 text-sm"
                >
                  <Navigation size={15} />
                  Directions
                </a>
              )}
            </div>
          </div>

          {/* Shop info */}
          <div className="px-1 pt-5 border-t" style={{ borderColor: 'var(--border)' }}>
            <h2 className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>Shop</h2>
            <Link href={`/shop/${shop.slug || shop.id}`} className="flex items-start gap-3 group">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'var(--tint-1)' }}>
                {ICONS[shop.category] || '🏪'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black group-hover:text-[var(--brand-ink)] transition-colors" style={{ color: 'var(--foreground)' }}>{shop.name}</p>
                <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={11} />
                  <span>{shop.area}, {shop.city}</span>
                </div>
                {shop.rating > 0 && (
                  <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <Star size={11} style={{ color: 'var(--star)', fill: 'var(--star)' }} />
                    <span>{shop.rating.toFixed(1)} ({shop.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
              <span className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${shop.isCurrentlyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {shop.isCurrentlyOpen ? '● Open' : '● Closed'}
              </span>
            </Link>

            <div className="flex items-center gap-1.5 text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>{shop.openingTime} – {shop.closingTime}</span>
            </div>

            <Link
              href={`/shop/${shop.slug || shop.id}`}
              className="ry-pill-ghost mt-3 w-full !py-3 text-sm"
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
          <h2 className="text-xl font-extrabold mb-4" style={{ color: 'var(--foreground)' }}>More from {shop.name}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {otherProducts.map((p: any, i: number) => (
              <GlassCard
                key={p.id}
                href={`/product/${p.id}`}
                image={p.image}
                fallbackEmoji={ICONS[p.category] || '🛍️'}
                title={p.name}
                price={formatPrice(p.price)}
                tint={i + 1}
                muted={!p.inStock}
              />
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
