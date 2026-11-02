'use client';

import GlassCard, { Pill } from '@/components/ui/GlassCard';
import { formatDistance, formatPrice, LISTING_CONDITION_LABELS } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';

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
  index?: number;
}

export default function ListingCard({ listing, index = 0 }: ListingCardProps) {
  const { icons } = useCategories('preowned');
  const sold = listing.status === 'SOLD';
  const meta = [typeof listing.distance === 'number' ? formatDistance(listing.distance) : null, listing.area]
    .filter(Boolean)
    .join(' · ');

  return (
    <GlassCard
      href={`/listing/${listing.id}`}
      image={listing.images?.[0]}
      fallbackEmoji={icons[listing.category] || '📦'}
      title={listing.title}
      subtitle={meta}
      price={formatPrice(listing.price)}
      badge={<Pill>{LISTING_CONDITION_LABELS[listing.condition] || listing.condition}</Pill>}
      badgeRight={sold ? <Pill tone="dark">Sold</Pill> : undefined}
      tint={index + 1}
      muted={sold}
    />
  );
}
