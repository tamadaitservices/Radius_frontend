'use client';

import { useEffect, useRef, useState } from 'react';

type Point = { lat: number; lng: number };

interface Props {
  polygon: Point[];
  onChange: (polygon: Point[]) => void;
  existingZones?: { name: string; polygon: Point[] }[];
}

export default function ZoneMap({ polygon, onChange, existingZones = [] }: Props) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const polygonRef = useRef<Point[]>(polygon); // always current
  const [pointCount, setPointCount] = useState(polygon.length);

  // Keep ref in sync with prop
  useEffect(() => {
    polygonRef.current = polygon;
    setPointCount(polygon.length);
  }, [polygon]);

  // Init map once
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current) return;

    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;

      const map = L.map(mapContainerRef.current!, { center: [16.5062, 80.648], zoom: 13 });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = { map, L };

      // Draw existing zones as grey polygons
      existingZones.forEach((zone) => {
        if (zone.polygon.length >= 3) {
          L.polygon(zone.polygon.map((p) => [p.lat, p.lng] as [number, number]), {
            color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.15, weight: 1.5, dashArray: '5,5',
          }).addTo(map).bindTooltip(zone.name);
        }
      });

      const dotIcon = () => L.divIcon({
        className: '',
        html: '<div style="width:12px;height:12px;border-radius:50%;background:#16a34a;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.5)"></div>',
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });

      map.on('click', (e: any) => {
        const point: Point = { lat: e.latlng.lat, lng: e.latlng.lng };
        const current = polygonRef.current;
        const next = [...current, point];

        // Add dot marker
        const marker = L.marker([point.lat, point.lng], { icon: dotIcon() }).addTo(map);
        markersRef.current.push(marker);

        // Update polygon line/fill
        if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
          polylineRef.current = null;
        }
        const coords = next.map((p) => [p.lat, p.lng] as [number, number]);
        if (next.length >= 3) {
          polylineRef.current = L.polygon(coords, {
            color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.2, weight: 2,
          }).addTo(map);
        } else if (next.length >= 2) {
          polylineRef.current = L.polyline(coords, { color: '#16a34a', weight: 2 }).addTo(map);
        }

        polygonRef.current = next;
        onChange(next);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.map.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const undoLast = () => {
    if (!mapRef.current || markersRef.current.length === 0) return;
    const { map, L } = mapRef.current;
    const last = markersRef.current.pop();
    map.removeLayer(last);

    const next = polygonRef.current.slice(0, -1);

    if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }
    if (next.length >= 3) {
      const coords = next.map((p: Point) => [p.lat, p.lng] as [number, number]);
      polylineRef.current = L.polygon(coords, { color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.2, weight: 2 }).addTo(map);
    } else if (next.length >= 2) {
      const coords = next.map((p: Point) => [p.lat, p.lng] as [number, number]);
      polylineRef.current = L.polyline(coords, { color: '#16a34a', weight: 2 }).addTo(map);
    }

    polygonRef.current = next;
    onChange(next);
  };

  const clearAll = () => {
    if (!mapRef.current) return;
    const { map } = mapRef.current;
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];
    if (polylineRef.current) { map.removeLayer(polylineRef.current); polylineRef.current = null; }
    polygonRef.current = [];
    onChange([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-gray-600">
          {pointCount === 0
            ? 'Click on the map to add boundary points'
            : pointCount < 3
            ? `${pointCount} point${pointCount > 1 ? 's' : ''} — need at least 3`
            : `${pointCount} points — polygon ready ✓`}
        </span>
        <button type="button" onClick={undoLast} disabled={pointCount === 0}
          className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40">
          Undo Last
        </button>
        <button type="button" onClick={clearAll} disabled={pointCount === 0}
          className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-40">
          Clear All
        </button>
      </div>

      <div ref={mapContainerRef}
        style={{ height: '400px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #e5e7eb' }} />

      <p className="text-xs text-gray-400">Map © OpenStreetMap · Centered on Vijayawada</p>
    </div>
  );
}
