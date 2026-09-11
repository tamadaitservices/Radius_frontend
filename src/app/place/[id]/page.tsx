'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Phone, MapPin, Clock, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import {
  PLACE_CATEGORY_ICONS, PLACE_CATEGORY_LABELS,
  FOOD_CATEGORY_ICONS, FOOD_CATEGORY_LABELS,
} from '@/lib/utils';

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: place, isLoading } = useQuery({
    queryKey: ['place', id],
    queryFn: async () => {
      const res = await api.get(`/api/places/${id}`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  if (!place) return <div className="text-center py-20 text-gray-500">Not found.</div>;

  const isFood = place.type === 'FOOD';
  const icons = isFood ? FOOD_CATEGORY_ICONS : PLACE_CATEGORY_ICONS;
  const labels = isFood ? FOOD_CATEGORY_LABELS : PLACE_CATEGORY_LABELS;
  const accent = isFood ? 'var(--ry-red)' : 'var(--ry-blue)';
  const images: string[] = place.images || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
        <div className="relative h-48 bg-gray-100">
          {images[0] ? (
            <Image src={images[0]} alt={place.name} fill className="object-cover" sizes="100vw" priority />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl">
              {icons[place.category] || (isFood ? '🍴' : '📍')}
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-semibold" style={{ color: accent }}>{labels[place.category] || place.category}</span>
              <h1 className="text-xl font-black text-gray-900">{place.name}</h1>
              {place.description && <p className="text-sm text-gray-500 mt-0.5">{place.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{place.area}, {place.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>{place.openingTime} – {place.closingTime}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{place.address}</p>
            </div>

            <div className={`flex-shrink-0 px-3 py-1 rounded-lg text-sm font-bold ${place.isCurrentlyOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {place.isCurrentlyOpen ? '● Open' : '● Closed'}
            </div>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white flex-1 justify-center min-w-[120px]"
                style={{ backgroundColor: accent }}
              >
                <Phone size={18} />
                Call
              </a>
            )}
            {place.whatsapp && (
              <a
                href={`https://wa.me/91${place.whatsapp}?text=${encodeURIComponent(`Hi! I found ${place.name} on RadiuYes.`)}`}
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
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
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

      {images.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <h2 className="font-bold text-gray-900 mb-3">Gallery</h2>
          <div className="grid grid-cols-3 gap-2">
            {images.map((url: string, i: number) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image src={url} alt={`${place.name} photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 768px) 33vw, 200px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {place.latitude && place.longitude && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
          <iframe
            title={`Map for ${place.name}`}
            width="100%"
            height="220"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${place.latitude},${place.longitude}&z=16&output=embed`}
            className="border-0"
          />
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-xs text-gray-500 truncate">{place.address}</p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold flex-shrink-0 ml-2"
              style={{ color: accent }}
            >
              Open in Maps →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
