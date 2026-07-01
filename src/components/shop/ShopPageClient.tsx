'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Phone, MapPin, Star, Clock, Package, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, CATEGORY_ICONS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import ReservationModal from '@/components/shop/ReservationModal';
import ReviewForm from '@/components/shop/ReviewForm';

export default function ShopPageClient({ id }: { id: string }) {
  const { user } = useAuthStore();
  const router = useRouter();
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
        <Loader2 className="animate-spin text-green-600" size={40} />
      </div>
    );
  }

  if (!shop) return <div className="text-center py-20 text-gray-500">Shop not found.</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Shop header */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
        <div className="relative h-48 bg-gray-100">
          {shop.coverImage ? (
            <Image src={shop.coverImage} alt={shop.name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">
              {CATEGORY_ICONS[shop.category] || '🏪'}
            </div>
          )}
          {shop.isFeatured && (
            <span className="absolute top-3 left-3 text-xs font-bold px-2 py-1 rounded-md text-white" style={{ backgroundColor: 'var(--ry-orange)' }}>
              Featured Shop
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-gray-900">{shop.name}</h1>
              {shop.description && <p className="text-sm text-gray-500 mt-0.5">{shop.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-800">{shop.rating.toFixed(1)}</span>
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
              <p className="text-sm text-gray-600 mt-1">{shop.address}</p>
            </div>

            <div className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-bold ${shop.isCurrentlyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {shop.isCurrentlyOpen ? '● Open' : '● Closed'}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <a
              href={`tel:${shop.phone}`}
              onClick={trackCall}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white flex-1 justify-center min-w-[120px]"
              style={{ backgroundColor: 'var(--ry-green)' }}
            >
              <Phone size={18} />
              Call Shop
            </a>
            {shop.whatsapp && (
              <a
                href={`https://wa.me/91${shop.whatsapp}?text=${encodeURIComponent('Hi! I found your shop on RadiuYes. Is the product available?')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white flex-1 justify-center min-w-[120px]"
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
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold border-2 text-gray-700 flex-1 justify-center min-w-[120px] hover:bg-gray-50"
              style={{ borderColor: 'var(--ry-border)' }}
            >
              <MapPin size={18} />
              Directions
            </a>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {shop.images?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">Gallery</h2>
          <div className="grid grid-cols-3 gap-2">
            {shop.images.map((url: string, i: number) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image src={url} alt={`${shop.name} photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Embedded Map */}
      {shop.latitude && shop.longitude && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
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
            <p className="text-xs text-gray-500 truncate">{shop.address}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold flex-shrink-0 ml-2"
              style={{ color: 'var(--ry-green)' }}
            >
              Open in Maps →
            </a>
          </div>
        </div>
      )}

      {/* Products */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={18} />
          Products ({shop.products?.length || 0})
        </h2>

        {!shop.products?.length ? (
          <p className="text-gray-400 text-sm py-4 text-center">No products listed yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shop.products.map((product: any) => (
              <Link key={product.id} href={`/product/${product.id}`} className="border border-gray-100 rounded-xl overflow-hidden hover:border-green-200 hover:shadow-sm transition-all">
                <div className="relative h-28 bg-gray-50">
                  {product.image ? (
                    <Image src={product.image} alt={product.name} fill className="object-cover" sizes="200px" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-3xl text-gray-200">📦</div>
                  )}
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                      <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">{product.name}</p>
                  {product.sku && (
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-subtle)' }}>#{product.sku}</p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm font-black text-gray-900">{formatPrice(product.price)}</p>
                    {product.mrp && product.mrp > product.price && (
                      <p className="text-xs text-gray-400 line-through">{formatPrice(product.mrp)}</p>
                    )}
                  </div>
                  <a
                    href={`tel:${shop.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                    style={{ borderColor: 'var(--ry-green)', color: 'var(--ry-green)' }}
                  >
                    <Phone size={12} />
                    Call Shop
                  </a>
                  {product.inStock && shop.isCurrentlyOpen && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (!user) { toast.error('Login to reserve'); return; }
                        setSelectedProduct(product);
                      }}
                      className="w-full mt-1.5 py-1.5 rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: 'var(--ry-orange)' }}
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
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star size={18} className="text-yellow-400" />
            Verified Reviews
          </h2>
          <div className="space-y-3">
            {shop.reviews.map((review: any) => (
              <div key={review.id} className="border-b border-gray-50 pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{review.user?.name || 'Customer'}</span>
                  {review.isVerified && (
                    <span className="text-xs text-green-600 flex items-center gap-0.5">
                      <CheckCircle size={10} /> Verified Visit
                    </span>
                  )}
                </div>
                {review.comment && <p className="text-sm text-gray-700 mt-1">{review.comment}</p>}
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
