'use client';

import GlassCard, { Pill } from '@/components/ui/GlassCard';
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
  index?: number;
}

export default function PlaceCard({ place, index = 0 }: PlaceCardProps) {
  const icons = place.type === 'FOOD' ? FOOD_CATEGORY_ICONS : PLACE_CATEGORY_ICONS;
  const labels = place.type === 'FOOD' ? FOOD_CATEGORY_LABELS : PLACE_CATEGORY_LABELS;
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
