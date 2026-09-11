'use client';

import { useEffect, useRef, useState } from 'react';
import { X, LocateFixed, Loader2, MapPin, Search, AlertCircle } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';
import { loadGoogleMaps } from '@/lib/googleMaps';

interface Props {
  onClose: () => void;
}

export default function LocationPicker({ onClose }: Props) {
  const { location, setManual, refresh, loading } = useLocation();
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [detecting, setDetecting] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapsError, setMapsError] = useState(false);
  const [label, setLabel] = useState(
    location.label ?? (location.isDefault ? 'Vijayawada' : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
  );

  useEffect(() => {
    const handleMapsError = (e: ErrorEvent) => {
      if (e.message?.includes('ApiTargetBlockedMapError') || e.message?.includes('MapsRequestError')) {
        setMapsError(true);
      }
    };
    window.addEventListener('error', handleMapsError);

    loadGoogleMaps(
      () => {
        if (!mapDivRef.current) return;
        const g = (window as any).google;
        if (!g?.maps) { setMapsError(true); return; }

        let map: any;
        try { map = new g.maps.Map(mapDivRef.current, {
          center: { lat: location.lat, lng: location.lng },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          ],
        }); } catch { setMapsError(true); return; }

        let marker: any;
        try { marker = new g.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
          draggable: true,
          animation: g.maps.Animation.DROP,
          icon: {
            path: g.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#0c831f',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
        }); } catch { setMapsError(true); return; }

        marker.addListener('dragend', () => {
          const pos = marker.getPosition();
          reverseGeocode(pos.lat(), pos.lng(), g);
        });

        map.addListener('click', (e: any) => {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          marker.setPosition({ lat, lng });
          reverseGeocode(lat, lng, g);
        });

        if (inputRef.current && g.maps.places?.Autocomplete) {
          const ac = new g.maps.places.Autocomplete(inputRef.current, {
            componentRestrictions: { country: 'in' },
            fields: ['geometry', 'name', 'formatted_address'],
          });
          ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.geometry?.location) return;
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const lbl = place.name || place.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            marker.setPosition({ lat, lng });
            map.panTo({ lat, lng });
            map.setZoom(15);
            setLabel(lbl);
            setManual(lat, lng, lbl);
          });
        }

        mapRef.current = map;
        markerRef.current = marker;
      },
      () => setMapsError(true),
    );

    return () => {
      window.removeEventListener('error', handleMapsError);
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverseGeocode = (lat: number, lng: number, google: any) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
      if (status === 'OK' && results[0]) {
        const parts = results[0].address_components;
        const locality = parts.find((p: any) => p.types.includes('locality') || p.types.includes('sublocality'))?.long_name;
        const city = parts.find((p: any) => p.types.includes('administrative_area_level_2'))?.long_name;
        const lbl = locality || city || results[0].formatted_address.split(',')[0];
        setLabel(lbl);
        setManual(lat, lng, lbl);
      } else {
        setManual(lat, lng);
      }
    });
  };

  const detectGPS = async () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('GPS is not supported by your browser.');
      return;
    }

    // Check permission state first if API available
    if (navigator.permissions) {
      const perm = await navigator.permissions.query({ name: 'geolocation' });
      if (perm.state === 'denied') {
        setGpsError('Location blocked. Click the 🔒 icon in the address bar to allow access.');
        return;
      }
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapRef.current && markerRef.current) {
          markerRef.current.setPosition({ lat, lng });
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(15);
        }
        const google = (window as any).google;
        if (google) reverseGeocode(lat, lng, google);
        else setManual(lat, lng);
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location blocked. Click the 🔒 icon in the address bar to allow access.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('Location timed out. Try again or search manually.');
        } else {
          setGpsError('Could not get location. Try searching manually.');
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    if (!loading) setDetecting(false);
  }, [loading]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-md mx-0 sm:mx-4 rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--background)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
          maxHeight: '92dvh',
        }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--ry-green-light)' }}
            >
              <MapPin size={16} style={{ color: 'var(--ry-green)' }} />
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--foreground)' }}>
              Set your location
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
          {/* Search input */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-subtle)' }}
            />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search area, locality, landmark…"
              className="w-full h-11 pl-9 pr-4 rounded-2xl border text-sm focus:outline-none transition-all"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--foreground)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--ry-green)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(12,131,31,0.08)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Map */}
          {mapsError ? (
            <div
              className="w-full rounded-2xl flex flex-col items-center justify-center gap-2 flex-shrink-0"
              style={{
                height: 240,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <span className="text-3xl">🗺️</span>
              <p className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Map unavailable</p>
              <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>Use GPS or search to set your location</p>
            </div>
          ) : (
            <div
              ref={mapDivRef}
              className="w-full rounded-2xl overflow-hidden flex-shrink-0"
              style={{ height: 240, border: '1px solid var(--border)' }}
            />
          )}

          {/* Current location pill */}
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
            style={{ background: 'var(--ry-green-light)', border: '1px solid rgba(12,131,31,0.12)' }}
          >
            <MapPin size={14} style={{ color: 'var(--ry-green)', flexShrink: 0 }} />
            <span className="text-sm font-medium truncate" style={{ color: 'var(--ry-green)' }}>
              {label}
            </span>
          </div>

          {/* GPS error */}
          {gpsError && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 rounded-2xl text-xs"
              style={{ background: '#fff1f0', border: '1px solid #fecaca', color: '#b91c1c' }}
            >
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{gpsError}</span>
            </div>
          )}

          {/* GPS button */}
          <button
            onClick={detectGPS}
            disabled={detecting}
            className="flex items-center justify-center gap-2 h-11 rounded-2xl border text-sm font-semibold transition-all"
            style={{
              borderColor: 'var(--ry-green)',
              color: 'var(--ry-green)',
              background: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--ry-green-light)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {detecting
              ? <><Loader2 size={15} className="animate-spin" /> Detecting location…</>
              : <><LocateFixed size={15} /> Use my current location</>
            }
          </button>

          {/* Confirm */}
          <button
            onClick={onClose}
            className="h-11 rounded-2xl text-white text-sm font-bold transition-opacity hover:opacity-90 active:opacity-80"
            style={{ backgroundColor: 'var(--ry-green)' }}
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
