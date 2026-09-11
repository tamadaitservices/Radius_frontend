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
  const accent = type === 'FOOD' ? 'var(--ry-red)' : 'var(--ry-blue)';
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
      <div>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Icon size={22} style={{ color: accent }} />
          {title}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <RadiusMapControl />

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setCategory(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border ${!category ? 'text-white' : 'text-gray-600 border-gray-200'}`}
          style={!category ? { backgroundColor: accent, borderColor: accent } : {}}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c === category ? null : c)}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border ${category === c ? 'text-white' : 'text-gray-600 border-gray-200'}`}
            style={category === c ? { backgroundColor: accent, borderColor: accent } : {}}
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
          {data.map((place: any) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-gray-100 bg-white">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-50">
            <Icon size={26} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-sm text-gray-800">{emptyText}</p>
            <p className="text-xs mt-1 text-gray-500">Try widening your search radius above.</p>
          </div>
        </div>
      )}
    </div>
  );
}
