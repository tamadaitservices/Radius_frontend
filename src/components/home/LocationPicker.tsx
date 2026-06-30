'use client';

import { useEffect, useRef, useState } from 'react';
import { X, LocateFixed, Loader2 } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface Props {
  onClose: () => void;
}

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY!;

let scriptLoaded = false;
let scriptLoading = false;
const onLoadCallbacks: (() => void)[] = [];

const onErrorCallbacks: (() => void)[] = [];

function loadGoogleMaps(cb: () => void, onError?: () => void) {
  if (typeof window === 'undefined') return;
  if (scriptLoaded) { cb(); return; }
  onLoadCallbacks.push(cb);
  if (onError) onErrorCallbacks.push(onError);
  if (scriptLoading) return;
  scriptLoading = true;
  const s = document.createElement('script');
  s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
  s.async = true;
  s.onload = () => {
    scriptLoaded = true;
    scriptLoading = false;
    onLoadCallbacks.splice(0).forEach((fn) => fn());
  };
  s.onerror = () => {
    scriptLoading = false;
    onErrorCallbacks.splice(0).forEach((fn) => fn());
  };
  document.head.appendChild(s);
}

export default function LocationPicker({ onClose }: Props) {
  const { location, setManual, refresh, loading } = useLocation();
  const mapRef = useRef<any>(null);
  const mapDivRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [detecting, setDetecting] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [label, setLabel] = useState(
    location.label ?? (location.isDefault ? 'Vijayawada' : `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`)
  );

  useEffect(() => {
    loadGoogleMaps(() => {
      if (!mapDivRef.current) return;
    }, () => setMapsError(true));
    loadGoogleMaps(() => {
      if (!mapDivRef.current) return;
      const google = (window as any).google;

      const map = new google.maps.Map(mapDivRef.current, {
        center: { lat: location.lat, lng: location.lng },
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
      });

      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        draggable: true,
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        reverseGeocode(pos.lat(), pos.lng(), google);
      });

      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        reverseGeocode(lat, lng, google);
      });

      // Places Autocomplete
      if (inputRef.current) {
        const ac = new google.maps.places.Autocomplete(inputRef.current, {
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
    });

    return () => {
      // cleanup handled by React unmount; map div is removed from DOM
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

  const detectGPS = () => {
    setDetecting(true);
    if (!navigator.geolocation) { setDetecting(false); return; }
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
      () => { setDetecting(false); refresh(); },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    if (!loading) setDetecting(false);
  }, [loading]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full sm:max-w-md mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: '#ffffff', boxShadow: '0 24px 60px rgba(0,0,0,0.25)', maxHeight: '92dvh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <h2 className="font-bold text-base" style={{ color: '#111827' }}>
            Set your location
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg" style={{ color: '#6b7280' }}>
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4 overflow-y-auto flex-1">
          {/* Search — Google Autocomplete attaches to this input */}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search area, locality, landmark…"
            className="w-full h-11 pl-4 pr-4 rounded-xl border-2 text-sm focus:outline-none transition-colors"
            style={{
              background: '#f9fafb',
              borderColor: '#e5e7eb',
              color: '#111827',
            }}
          />

          {/* Map */}
          {mapsError ? (
            <div className="w-full rounded-xl flex-shrink-0 flex flex-col items-center justify-center gap-2 bg-gray-50 border border-gray-200 text-gray-500 text-sm text-center px-4" style={{ height: 260 }}>
              <span className="text-2xl">🗺️</span>
              <p className="font-medium text-gray-700">Map unavailable</p>
              <p className="text-xs text-gray-400">Use GPS or type your city below to set location</p>
            </div>
          ) : (
            <div
              ref={mapDivRef}
              className="w-full rounded-xl overflow-hidden flex-shrink-0"
              style={{ height: 260 }}
            />
          )}

          {/* Current location */}
          <p className="text-xs px-1" style={{ color: '#6b7280' }}>
            📍 <span style={{ color: '#111827', fontWeight: 500 }}>{label}</span>
          </p>

          {/* GPS */}
          <button
            onClick={detectGPS}
            disabled={detecting}
            className="flex items-center justify-center gap-2 h-11 rounded-xl border-2 text-sm font-semibold transition-colors"
            style={{ borderColor: 'var(--ry-green)', color: 'var(--ry-green)', background: 'transparent' }}
          >
            {detecting
              ? <><Loader2 size={16} className="animate-spin" /> Detecting…</>
              : <><LocateFixed size={16} /> Use my GPS location</>}
          </button>

          <button
            onClick={onClose}
            className="h-11 rounded-xl text-white text-sm font-bold"
            style={{ backgroundColor: 'var(--ry-green)' }}
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
