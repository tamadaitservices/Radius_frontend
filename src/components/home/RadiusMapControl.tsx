'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { useRadiusStore } from '@/store/radius';
import { loadGoogleMaps } from '@/lib/googleMaps';

const MIN_RADIUS = 1;
const MAX_RADIUS = 100;
const DEBOUNCE_MS = 400;

export default function RadiusMapControl() {
  const { location } = useLocation();
  const { radiusKm, setRadiusKm } = useRadiusStore();
  const mapRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [draftRadius, setDraftRadius] = useState(radiusKm);
  const [mapsError, setMapsError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => setDraftRadius(radiusKm), [radiusKm]);

  // Initialize the inert map once
  useEffect(() => {
    loadGoogleMaps(
      () => {
        if (!mapDivRef.current) return;
        const g = (window as any).google;
        if (!g?.maps) { setMapsError(true); return; }

        let map: any;
        try {
          map = new g.maps.Map(mapDivRef.current, {
            center: { lat: location.lat, lng: location.lng },
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: false,
            gestureHandling: 'none',
            keyboardShortcuts: false,
            clickableIcons: false,
            styles: [
              { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              { featureType: 'transit', stylers: [{ visibility: 'off' }] },
            ],
          });
        } catch { setMapsError(true); return; }

        new g.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#0c831f',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          },
        });

        const circle = new g.maps.Circle({
          center: { lat: location.lat, lng: location.lng },
          radius: radiusKm * 1000,
          map,
          fillColor: '#0c831f',
          fillOpacity: 0.12,
          strokeColor: '#0c831f',
          strokeOpacity: 0.6,
          strokeWeight: 1.5,
          clickable: false,
        });
        map.fitBounds(circle.getBounds());

        mapRef.current = map;
        circleRef.current = circle;
        setReady(true);
      },
      () => setMapsError(true),
    );

    return () => {
      mapRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recenter if the user's location changes
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    mapRef.current.setCenter({ lat: location.lat, lng: location.lng });
    circleRef.current?.setCenter({ lat: location.lat, lng: location.lng });
    mapRef.current.fitBounds(circleRef.current.getBounds());
  }, [ready, location.lat, location.lng]);

  const applyDraft = (km: number) => {
    setDraftRadius(km);
    if (circleRef.current && mapRef.current) {
      circleRef.current.setRadius(km * 1000);
      mapRef.current.fitBounds(circleRef.current.getBounds());
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setRadiusKm(km), DEBOUNCE_MS);
  };

  return (
    <div className="rounded-2xl border overflow-hidden mb-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      {mapsError ? (
        <div className="flex items-center gap-2 px-4 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          <AlertCircle size={16} />
          Map preview unavailable — radius search still works.
        </div>
      ) : (
        <div ref={mapDivRef} className="w-full" style={{ height: 150 }} />
      )}
      <div className="px-4 py-3 flex items-center gap-3">
        <span className="text-xs font-bold flex-shrink-0" style={{ color: 'var(--foreground)' }}>
          {draftRadius} km
        </span>
        <input
          type="range"
          min={MIN_RADIUS}
          max={MAX_RADIUS}
          step={1}
          value={draftRadius}
          onChange={(e) => applyDraft(Number(e.target.value))}
          className="flex-1 radius-slider"
        />
        <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-subtle)' }}>within</span>
      </div>
      <style jsx>{`
        .radius-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          border-radius: 2px;
          background: var(--border);
          outline: none;
        }
        .radius-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--ry-green);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .radius-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--ry-green);
          cursor: pointer;
          border: 2px solid #fff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}
