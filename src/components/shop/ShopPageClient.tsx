'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MapPin, Star, Clock, Package, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { useAuthStore } from '@/store/auth';
import ReservationModal from '@/components/shop/ReservationModal';
import ReviewForm from '@/components/shop/ReviewForm';

export default function ShopPageClient({ id }: { id: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const { icons: CATEGORY_ICONS, reservationEnabled: CATEGORY_RESERVATION_ENABLED } = useCategories();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const trackCall = () => { api.post(`/api/shops/${id}/call`).catch(() => {}); };

  const { data: shop, isLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: async () => {
      const res = await api.get(`/api/shops/${id}`);
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

  if (!shop) return <div className="text-center py-20 text-gray-500">Shop not found.</div>;

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

      {/* Shop header */}
      <div className="mb-6">
        <div className="relative h-56 rounded-[32px] overflow-hidden" style={{ background: 'var(--tint-1)', boxShadow: 'var(--shadow-lift)' }}>
          {shop.coverImage ? (
            <Image src={shop.coverImage} alt={shop.name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">
              {CATEGORY_ICONS[shop.category] || '🏪'}
            </div>
          )}
          {shop.isFeatured && (
            <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--brand)', color: 'var(--on-brand)' }}>
              Featured Shop
            </span>
          )}
        </div>

        <div className="px-1 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black" style={{ color: 'var(--foreground)' }}>{shop.name}</h1>
              {shop.description && <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{shop.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-sm flex-wrap" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center gap-1">
                  <Star size={14} style={{ color: 'var(--star)', fill: 'var(--star)' }} />
                  <span className="font-semibold" style={{ color: 'var(--foreground)' }}>{shop.rating.toFixed(1)}</span>
                  <span>({shop.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{shop.area}, {shop.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{shop.openingTime} – {shop.closingTime}</span>
                </div>
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{shop.address}</p>
            </div>

            <div className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold ${shop.isCurrentlyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {shop.isCurrentlyOpen ? '● Open' : '● Closed'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <a
              href={`tel:${shop.phone}`}
              onClick={trackCall}
              className="ry-pill-btn flex-1 min-w-[120px] !py-3"
            >
              <Phone size={18} />
              Call Shop
            </a>
            {shop.whatsapp && (
              <a
                href={`https://wa.me/91${shop.whatsapp}?text=${encodeURIComponent(`Hi! I found *${shop.name}* on RadiuYes and want to check if a product is available.\nShop: ${typeof window !== 'undefined' ? window.location.href : 'https://radiuyes.com/shop/' + (shop.slug || shop.id)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white flex-1 justify-center min-w-[120px]"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </a>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ry-pill-ghost flex-1 min-w-[120px] !py-3"
            >
              <MapPin size={18} />
              Directions
            </a>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {shop.images?.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-extrabold mb-3" style={{ color: 'var(--foreground)' }}>Gallery</h2>
          <div className="grid grid-cols-3 gap-2">
            {shop.images.map((url: string, i: number) => (
              <div key={i} className="relative aspect-square rounded-[24px] overflow-hidden" style={{ background: 'var(--tint-'+((i % 5) + 1)+')' }}>
                <Image src={url} alt={`${shop.name} photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Map */}
      {shop.latitude && shop.longitude && (
        <div className="ry-card overflow-hidden mb-8">
          <iframe
            title={`Map for ${shop.name}`}
            width="100%"
            height="220"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${shop.latitude},${shop.longitude}&z=16&output=embed`}
            className="border-0"
          />
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{shop.address}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold flex-shrink-0 ml-2"
              style={{ color: 'var(--brand-ink)' }}
            >
              Open in Maps →
            </a>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="mb-8">
        <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Package size={20} />
          Products ({shop.products?.length || 0})
        </h2>

        {!shop.products?.length ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--text-subtle)' }}>No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {shop.products.map((product: any, pi: number) => (
              <Link key={product.id} href={`/product/${product.id}`} className="ry-card overflow-hidden !rounded-[26px] hover:-translate-y-0.5 transition-transform">
                <div className="relative h-32" style={{ background: 'var(--tint-'+((pi % 5) + 1)+')' }}>
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="200px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl opacity-40">📦</div>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2.5 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-bold leading-tight" style={{ color: 'var(--foreground)' }}>{product.name}</p>
                  {product.sku && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-subtle)' }}>#{product.sku}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-black" style={{ color: 'var(--foreground)' }}>{formatPrice(product.price)}</p>
                    {product.mrp && product.mrp > product.price && (
                      <p className="text-xs line-through" style={{ color: 'var(--text-subtle)' }}>{formatPrice(product.mrp)}</p>
                    )}
                  </div>
                  <a
                    href={`tel:${shop.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-2 flex items-center justify-center gap-1 py-2 rounded-full text-xs font-semibold transition hover:brightness-95"
                    style={{ background: 'var(--brand-light)', color: 'var(--brand-ink)' }}
                  >
                    <Phone size={12} />
                    Call Shop
                  </a>
                  {product.inStock && shop.isCurrentlyOpen && product.reservationEnabled && (CATEGORY_RESERVATION_ENABLED[shop.category] ?? true) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user) { toast.error('Login to reserve'); return; }
                        setSelectedProduct(product);
                      }}
                      className="w-full mt-1.5 py-2 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--brand)' }}
                    >
                      Reserve for 45 min
                    </button>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      {shop.reviews?.length > 0 && (
        <div>
          <h2 className="text-xl font-extrabold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Star size={18} style={{ color: 'var(--star)', fill: 'var(--star)' }} />
            Verified Reviews
          </h2>
          <div className="space-y-3">
            {shop.reviews.map((review: any) => (
              <div key={review.id} className="border-b pb-3 last:border-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} style={i < review.rating ? { color: 'var(--star)', fill: 'var(--star)' } : { color: 'var(--border)' }} />
                    ))}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{review.user?.name || 'Customer'}</span>
                  {review.isVerified && (
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <CheckCircle size={10} /> Verified Visit
                    </span>
                  )}
                </div>
                {review.comment && <p className="text-sm mt-1" style={{ color: 'var(--foreground)' }}>{review.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reserve modal */}
      {selectedProduct && (
        <ReservationModal
          shopId={shop.id}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
