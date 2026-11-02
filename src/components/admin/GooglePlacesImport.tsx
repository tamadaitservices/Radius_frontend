'use client';

import { useState } from 'react';
import { Loader2, Search, MapPinned } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface GoogleResult {
  googlePlaceId: string;
  name: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  suggestedCategory: string;
  alreadyAdded: boolean;
}

interface Props {
  type: 'PLACE' | 'FOOD';
  icons: Record<string, string>;
  labels: Record<string, string>;
  onImported: () => void;
}

// Vijayawada — default search centre
const DEFAULT_CENTER = { lat: '16.5062', lng: '80.648' };

export default function GooglePlacesImport({ type, icons, labels, onImported }: Props) {
  const noun = type === 'FOOD' ? 'food spot' : 'place';
  const [query, setQuery] = useState('');
  const [radiusKm, setRadiusKm] = useState('10');
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<GoogleResult[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [categoryById, setCategoryById] = useState<Record<string, string>>({});

  const categoryKeys = Object.keys(labels);
  const inputCls = 'px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:border-green-600 focus:outline-none text-gray-800';

  const search = async () => {
    setSearching(true);
    try {
      const r = await api.post('/api/admin/places/google-search', {
        type,
        lat: Number(center.lat),
        lng: Number(center.lng),
        radiusKm: Number(radiusKm) || 10,
        query: query.trim() || undefined,
      }, { timeout: 30000 });
      const list = r.data.results as GoogleResult[];
      setResults(list);
      setSelected(new Set(list.filter((x) => !x.alreadyAdded).map((x) => x.googlePlaceId)));
      setCategoryById(Object.fromEntries(list.map((x) => [x.googlePlaceId, x.suggestedCategory])));
      if (list.length === 0) toast('No results found. Try a different search or a larger radius.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Google search failed.');
    } finally {
      setSearching(false);
    }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return toast.error('Location is not available in this browser.');
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) }),
      () => toast.error('Could not get your location.'),
    );
  };

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const importSelected = async () => {
    const chosen = (results ?? []).filter((x) => selected.has(x.googlePlaceId));
    if (chosen.length === 0) return;
    setImporting(true);
    let created = 0;
    const failed: string[] = [];
    for (const p of chosen) {
      try {
        await api.post('/api/admin/places', {
          type,
          category: categoryById[p.googlePlaceId] || p.suggestedCategory,
          name: p.name,
          address: p.address || p.area,
          area: p.area,
          city: 'Vijayawada',
          latitude: p.latitude,
          longitude: p.longitude,
        });
        created += 1;
      } catch (err: any) {
        failed.push(`${p.name}: ${err.response?.data?.error || 'failed'}`);
      }
    }
    setImporting(false);
    if (created > 0) {
      onImported();
      setResults((prev) => prev?.map((x) => (selected.has(x.googlePlaceId) && !failed.some((f) => f.startsWith(`${x.name}:`)) ? { ...x, alreadyAdded: true } : x)) ?? null);
      setSelected(new Set());
    }
    if (failed.length === 0) toast.success(`Imported ${created} ${noun}${created === 1 ? '' : 's'}.`);
    else toast.error(`Imported ${created}, ${failed.length} failed. ${failed[0]}`, { duration: 6000 });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <MapPinned size={18} className="text-red-500" /> Find {type === 'FOOD' ? 'Food Spots' : 'Places'} on Google
      </h2>
      <p className="text-xs text-gray-500 mb-3">
        Search Google near a point, pick the ones you want, and import them. Photos, phone and timings aren&apos;t
        imported — add them afterward. Review names and categories before importing.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={type === 'FOOD' ? 'Search (optional, e.g. biryani)' : 'Search (optional, e.g. temples)'} className={inputCls + ' sm:col-span-2'} />
        <input value={center.lat} onChange={(e) => setCenter((c) => ({ ...c, lat: e.target.value }))} placeholder="Latitude" className={inputCls} />
        <input value={center.lng} onChange={(e) => setCenter((c) => ({ ...c, lng: e.target.value }))} placeholder="Longitude" className={inputCls} />
        <input value={radiusKm} onChange={(e) => setRadiusKm(e.target.value.replace(/[^\d.]/g, ''))} placeholder="Radius km" className={inputCls} />
        <button onClick={useMyLocation} type="button" className="text-xs font-bold px-3 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
          Use my location
        </button>
        <button
          onClick={search}
          disabled={searching || !center.lat || !center.lng}
          className="sm:col-span-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm bg-red-500 hover:bg-red-600 disabled:opacity-50"
        >
          {searching ? <><Loader2 size={15} className="animate-spin" /> Searching…</> : <><Search size={15} /> Search Google</>}
        </button>
      </div>

      {results && results.length > 0 && (
        <div className="mt-4">
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {results.map((r) => (
              <label
                key={r.googlePlaceId}
                className={`flex items-center gap-3 p-3 rounded-xl border border-gray-100 ${r.alreadyAdded ? 'opacity-50' : 'cursor-pointer hover:bg-gray-50'}`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(r.googlePlaceId)}
                  disabled={r.alreadyAdded}
                  onChange={() => toggle(r.googlePlaceId)}
                  className="w-4 h-4 accent-green-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">
                    {r.name}
                    {r.alreadyAdded && <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full text-white bg-gray-400">Already added</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{r.address}</p>
                </div>
                <select
                  value={categoryById[r.googlePlaceId] ?? r.suggestedCategory}
                  disabled={r.alreadyAdded}
                  onChange={(e) => setCategoryById((prev) => ({ ...prev, [r.googlePlaceId]: e.target.value }))}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 max-w-[170px]"
                >
                  {categoryKeys.map((c) => <option key={c} value={c}>{icons[c]} {labels[c]}</option>)}
                </select>
              </label>
            ))}
          </div>
          <button
            onClick={importSelected}
            disabled={importing || selected.size === 0}
            className="mt-4 flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50 bg-green-600 hover:bg-green-700"
          >
            {importing ? <><Loader2 size={15} className="animate-spin" /> Importing…</> : `Import ${selected.size} selected`}
          </button>
        </div>
      )}
    </div>
  );
}
