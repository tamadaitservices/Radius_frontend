'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Landmark, UtensilsCrossed } from 'lucide-react';
import api from '@/lib/api';
import PlaceCard from '@/components/place/PlaceCard';
import RadiusMapControl from '@/components/home/RadiusMapControl';
import { useLocation } from '@/hooks/useLocation';
import { useRadiusStore } from '@/store/radius';
import {
  PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS,
  FOOD_CATEGORY_ICONS, FOOD_CATEGORY_LABELS,
} from '@/lib/utils';
import PromoBanners from '@/components/home/PromoBanners';

interface Props {
  type: 'PLACE' | 'FOOD';
}

export default function PlaceBrowse({ type }: Props) {
  const { location, loading } = useLocation();
  const { radiusKm } = useRadiusStore();
  const [category, setCategory] = useState<string | null>(null);

  const icons = type === 'FOOD' ? FOOD_CATEGORY_ICONS : PLACE_CATEGORY_ICONS;
  const labels = type === 'FOOD' ? FOOD_CATEGORY_LABELS : PLACE_CATEGORY_LABELS;
  const categories = Object.keys(labels);
  const accent = 'var(--brand)';
  const Icon = type === 'FOOD' ? UtensilsCrossed : Landmark;
  const title = type === 'FOOD' ? 'Food' : 'Places';
  const subtitle = type === 'FOOD'
    ? 'Restaurants and eateries near you'
    : 'Landmarks, services and more near you';
  const emptyText = type === 'FOOD' ? 'No food places near you yet' : 'No places near you yet';

  const { data, isLoading } = useQuery({
    queryKey: ['places-nearby', type, location.lat, location.lng, category, radiusKm],
    queryFn: async () => {
      const res = await api.get('/api/places/nearby', {
        params: { lat: location.lat, lng: location.lng, type, radius: radiusKm, category: category || undefined, limit: 40 },
      });
      return res.data.places;
    },
    enabled: !loading,
  });

  return (
    <div className="space-y-6">
      <PromoBanners module={type === 'FOOD' ? 'food' : 'places'} />
      <div>
        <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
          <Icon size={22} style={{ color: 'var(--brand-ink)' }} />
          {title}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>

      <RadiusMapControl />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategory(null)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
          style={!category ? { backgroundColor: accent, borderColor: accent, color: 'var(--on-brand)' } : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? null : c)}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
            style={category === c ? { backgroundColor: accent, borderColor: accent, color: 'var(--on-brand)' } : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            <span>{icons[c]}</span>
            {labels[c]}
          </button>
        ))}
      </div>

      {isLoading || loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin" style={{ color: accent }} size={32} />
        </div>
      ) : data?.length ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {data.map((place: any, i: number) => (
            <PlaceCard key={place.id} place={place} index={i} />
          ))}
        </div>
      ) : (
        <div className="ry-card flex flex-col items-center justify-center gap-3 py-16">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
            <Icon size={26} style={{ color: 'var(--brand-ink)' }} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{emptyText}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Try widening your search radius above.</p>
          </div>
        </div>
      )}
    </div>
  );
}
