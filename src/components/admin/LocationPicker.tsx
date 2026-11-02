'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { loadGoogleMaps } from '@/lib/googleMaps';

interface SearchResult {
  googlePlaceId: string;
  name: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  suggestedCategory: string;
}

export interface PickedLocation {
  latitude: number;
  longitude: number;
  // Only set when the position came from a search result (not a map click/drag).
  name?: string;
  address?: string;
  area?: string;
  suggestedCategory?: string;
}

interface Props {
  type: 'PLACE' | 'FOOD';
  latitude: string;
  longitude: string;
  onPick: (loc: PickedLocation) => void;
}

// Vijayawada — shown until a position is chosen
const DEFAULT_CENTER = { lat: 16.5062, lng: 80.648 };

const toNum = (v: string) => (v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

// Search for a location, or click/drag the pin on the map, to fill latitude and longitude.
// Must be rendered with a stable identity (not inside another component defined per-render),
// otherwise the map would be rebuilt on every keystroke.
export default function LocationPicker({ type, latitude, longitude, onPick }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [mapsError, setMapsError] = useState(false);

  const lat = toNum(latitude);
  const lng = toNum(longitude);

  // Build the map once.
  useEffect(() => {
    loadGoogleMaps(
      () => {
        const g = (window as any).google;
        if (!mapDivRef.current || !g?.maps) { setMapsError(true); return; }
        const start = lat !== null && lng !== null ? { lat, lng } : DEFAULT_CENTER;
        try {
          const map = new g.maps.Map(mapDivRef.current, {
            center: start,
            zoom: lat !== null && lng !== null ? 16 : 12,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            clickableIcons: false,
          });
          const marker = new g.maps.Marker({ position: start, map, draggable: true, visible: lat !== null && lng !== null });
          const set = (pos: { lat: () => number; lng: () => number }) => {
            marker.setVisible(true);
            marker.setPosition(pos);
            onPickRef.current({ latitude: Number(pos.lat().toFixed(6)), longitude: Number(pos.lng().toFixed(6)) });
          };
          map.addListener('click', (e: any) => e.latLng && set(e.latLng));
          marker.addListener('dragend', (e: any) => e.latLng && set(e.latLng));
          mapRef.current = map;
          markerRef.current = marker;
        } catch { setMapsError(true); }
      },
      () => setMapsError(true),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the pin in sync when latitude/longitude are typed or filled from a search result.
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker || lat === null || lng === null) return;
    const cur = marker.getPosition?.();
    if (cur && Math.abs(cur.lat() - lat) < 1e-7 && Math.abs(cur.lng() - lng) < 1e-7 && marker.getVisible()) return;
    marker.setPosition({ lat, lng });
    marker.setVisible(true);
    map.panTo({ lat, lng });
  }, [lat, lng]);

  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const center = mapRef.current?.getCenter?.();
      const r = await api.post('/api/admin/places/google-search', {
        type,
        lat: center ? center.lat() : lat ?? DEFAULT_CENTER.lat,
        lng: center ? center.lng() : lng ?? DEFAULT_CENTER.lng,
        radiusKm: 30,
        query: query.trim(),
      }, { timeout: 30000 });
      const list = r.data.results as SearchResult[];
      setResults(list);
      if (list.length === 0) toast('No matches. Try a more specific name, or click the map to place the pin.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Search failed.');
    } finally {
      setSearching(false);
    }
  };

  const choose = (r: SearchResult) => {
    setResults(null);
    onPickRef.current({
      latitude: Number(r.latitude.toFixed(6)),
      longitude: Number(r.longitude.toFixed(6)),
      name: r.name,
      address: r.address,
      area: r.area,
      suggestedCategory: r.suggestedCategory,
    });
  };

  const inputCls = 'flex-1 min-w-0 px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800';

  return (
    <div className="mb-4 space-y-3">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
          placeholder="Search a location to fill the address and coordinates (e.g. Kanaka Durga Temple)"
          className={inputCls}
        />
        <button
          type="button"
          onClick={search}
          disabled={searching || !query.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50 flex-shrink-0"
        >
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />} Search
        </button>
      </div>

      {results && results.length > 0 && (
        <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 max-h-60 overflow-y-auto bg-white">
          {results.map((r) => (
            <button
              type="button"
              key={r.googlePlaceId}
              onClick={() => choose(r)}
              className="w-full text-left px-3 py-2.5 hover:bg-gray-50 flex items-start gap-2"
            >
              <MapPin size={15} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900 truncate">{r.name}</span>
                <span className="block text-xs text-gray-500 truncate">{r.address}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {mapsError ? (
        <p className="text-xs text-red-500">The map couldn&apos;t load. You can still search above or type the coordinates.</p>
      ) : (
        <>
          <div ref={mapDivRef} className="w-full h-64 rounded-xl border border-gray-200 bg-gray-50" />
          <p className="text-xs text-gray-500">Click the map or drag the pin to fine-tune the position — latitude and longitude update automatically.</p>
        </>
      )}
    </div>
  );
}
