'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, Loader2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, LISTING_CATEGORY_ICONS, LISTING_CATEGORY_LABELS, LISTING_CONDITION_LABELS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import ContactRequestModal from '@/components/listing/ContactRequestModal';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const router = useRouter();
  const [requestingContact, setRequestingContact] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const res = await api.get(`/api/listings/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={40} />
      </div>
    );
  }

  if (!listing) return <div className="text-center py-20 text-gray-500">Listing not found.</div>;

  const images: string[] = listing.images || [];
  const isOwnListing = user && (user as any).type !== 'vendor' && listing.sellerId === user.id;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Images */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="relative aspect-square bg-gray-50">
            {images.length > 0 ? (
              <Image src={images[activeImage]} alt={listing.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" priority />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-7xl">
                {LISTING_CATEGORY_ICONS[listing.category] || '📦'}
              </div>
            )}
            {listing.status === 'SOLD' && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="text-lg font-black text-gray-700 bg-gray-100 px-4 py-2 rounded-xl">
                  Sold
                </span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 p-3 overflow-x-auto no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 ${i === activeImage ? 'border-orange-500' : 'border-transparent'}`}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
              {LISTING_CONDITION_LABELS[listing.condition] || listing.condition}
            </span>
            <h1 className="text-2xl font-black text-gray-900 leading-tight mt-2">{listing.title}</h1>
            <p className="text-3xl font-black text-gray-900 mt-3">{formatPrice(listing.price)}</p>

            {listing.description && (
              <p className="text-sm text-gray-600 mt-3 leading-relaxed">{listing.description}</p>
            )}

            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-3">
              <span>{LISTING_CATEGORY_ICONS[listing.category]}</span>
              <span>{LISTING_CATEGORY_LABELS[listing.category]}</span>
              <span>•</span>
              <span>{listing.area}, {listing.city}</span>
            </div>

            {listing.status === 'AVAILABLE' && !isOwnListing && (
              <button
                onClick={() => {
                  if (!user) { toast.error('Login to request contact'); router.push('/login'); return; }
                  if ((user as any).type === 'vendor') { toast.error('Vendor accounts cannot contact sellers.'); return; }
                  setRequestingContact(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white text-base mt-5"
                style={{ backgroundColor: 'var(--ry-orange)' }}
              >
                <Phone size={18} />
                Request Contact
              </button>
            )}
            {isOwnListing && (
              <p className="text-xs text-gray-400 mt-5 text-center">This is your own listing.</p>
            )}
          </div>

          {/* Seller info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Seller</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <User size={22} className="text-gray-400" />
              </div>
              <div>
                <p className="font-black text-gray-900">{listing.seller?.name || 'RadiuYes User'}</p>
                <p className="text-xs text-gray-500 mt-0.5">Request contact to get their number and arrange a meet-up</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {requestingContact && (
        <ContactRequestModal listing={listing} onClose={() => setRequestingContact(false)} />
      )}
    </div>
  );
}
