'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { formatDistance, PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS, FOOD_CATEGORY_ICONS, FOOD_CATEGORY_LABELS } from '@/lib/utils';

interface PlaceCardProps {
  place: {
    id: string;
    type: 'PLACE' | 'FOOD';
    name: string;
    category: string;
    area: string;
    city: string;
    images: string[];
    distance?: number;
    isCurrentlyOpen?: boolean;
  };
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const cover = place.images?.[0];
  const icons = place.type === 'FOOD' ? FOOD_CATEGORY_ICONS : PLACE_CATEGORY_ICONS;
  const labels = place.type === 'FOOD' ? FOOD_CATEGORY_LABELS : PLACE_CATEGORY_LABELS;
  const accent = place.type === 'FOOD' ? 'var(--ry-red)' : 'var(--ry-blue)';

  return (
    <Link
      href={`/place/${place.id}`}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow block"
    >
      <div className="relative h-36 bg-gray-100">
        {cover ? (
          <Image src={cover} alt={place.name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 300px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            {icons[place.category] || (place.type === 'FOOD' ? '🍴' : '📍')}
          </div>
        )}
        {typeof place.isCurrentlyOpen === 'boolean' && (
          <span
            className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-md text-white"
            style={{ backgroundColor: place.isCurrentlyOpen ? 'var(--ry-green)' : '#6b7280' }}
          >
            {place.isCurrentlyOpen ? 'Open now' : 'Closed'}
          </span>
        )}
      </div>

      <div className="p-3">
        <span className="text-xs font-semibold" style={{ color: accent }}>{labels[place.category] || place.category}</span>
        <h3 className="font-semibold text-gray-800 text-sm leading-tight mt-0.5 line-clamp-2">{place.name}</h3>

        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          {typeof place.distance === 'number' && (
            <>
              <div className="flex items-center gap-0.5">
                <MapPin size={11} />
                <span>{formatDistance(place.distance)}</span>
              </div>
              <span>•</span>
            </>
          )}
          <span>{place.area}</span>
        </div>
      </div>
    </Link>
  );
}
