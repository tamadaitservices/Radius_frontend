'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { formatDistance, formatPrice, LISTING_CATEGORY_ICONS, LISTING_CONDITION_LABELS } from '@/lib/utils';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    category: string;
    condition: string;
    area: string;
    city: string;
    images: string[];
    distance?: number;
    status?: string;
  };
}

export default function ListingCard({ listing }: ListingCardProps) {
  const cover = listing.images?.[0];

  return (
    <Link
      href={`/listing/${listing.id}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="relative h-36 bg-gray-100">
        {cover ? (
          <Image src={cover} alt={listing.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 300px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {LISTING_CATEGORY_ICONS[listing.category] || '📦'}
          </div>
        )}
        {listing.status === 'SOLD' && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-black px-3 py-1.5 rounded-lg text-white bg-gray-700">Sold</span>
          </div>
        )}
        <span className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-md bg-white/90 text-gray-700">
          {LISTING_CONDITION_LABELS[listing.condition] || listing.condition}
        </span>
      </div>

      <div className="p-3">
        <p className="font-black text-gray-900">{formatPrice(listing.price)}</p>
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mt-0.5 line-clamp-2">{listing.title}</h3>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          {typeof listing.distance === 'number' && (
            <>
              <div className="flex items-center gap-0.5">
                <MapPin size={11} />
                <span>{formatDistance(listing.distance)}</span>
              </div>
              <span>•</span>
            </>
          )}
          <span>{listing.area}</span>
        </div>
      </div>
    </Link>
  );
}
