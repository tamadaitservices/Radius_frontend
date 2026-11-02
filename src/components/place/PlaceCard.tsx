'use client';

import GlassCard, { Pill } from '@/components/ui/GlassCard';
import { formatDistance } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

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
  index?: number;
}

export default function PlaceCard({ place, index = 0 }: PlaceCardProps) {
  const { icons, labels } = useCategories(place.type === 'FOOD' ? 'food' : 'places');
  const meta = [typeof place.distance === 'number' ? formatDistance(place.distance) : null, place.area]
    .filter(Boolean)
    .join(' · ');

  return (
    <GlassCard
      href={`/place/${place.id}`}
      image={place.images?.[0]}
      fallbackEmoji={icons[place.category] || (place.type === 'FOOD' ? '🍴' : '📍')}
      title={place.name}
      subtitle={meta}
      price={labels[place.category] || place.category}
      badge={
        typeof place.isCurrentlyOpen === 'boolean'
          ? <Pill tone={place.isCurrentlyOpen ? 'success' : 'light'}>{place.isCurrentlyOpen ? 'Open now' : 'Closed'}</Pill>
          : undefined
      }
      tint={index + 1}
    />
  );
}
