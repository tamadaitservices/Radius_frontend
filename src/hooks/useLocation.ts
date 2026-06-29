'use client';

import { useState, useEffect } from 'react';

export interface Location {
  lat: number;
  lng: number;
  label?: string;
  isDefault: boolean;
}

const DEFAULT: Location = { lat: 16.5062, lng: 80.648, isDefault: true };
const STORAGE_KEY = 'ry_location';
const EVENT = 'ry-location-changed';

function broadcast(loc: Location) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: loc }));
}

export function useLocation() {
  const [location, setLocation] = useState<Location>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      try {
        setLocation(JSON.parse(cached) as Location);
        setLoading(false);
        return;
      } catch {}
    }

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = { lat: pos.coords.latitude, lng: pos.coords.longitude, isDefault: false };
        broadcast(loc);
        setLocation(loc);
        setLoading(false);
      },
      () => { setLoading(false); },
      { timeout: 5000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);

  useEffect(() => {
    const handler = (e: Event) => setLocation((e as CustomEvent<Location>).detail);
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const refresh = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: Location = { lat: pos.coords.latitude, lng: pos.coords.longitude, isDefault: false };
        broadcast(loc);
        setLocation(loc);
        setLoading(false);
      },
      () => setLoading(false),
      { timeout: 8000, maximumAge: 0 }
    );
  };

  const setManual = (lat: number, lng: number, label?: string) => {
    const loc: Location = { lat, lng, label, isDefault: false };
    broadcast(loc);
    setLocation(loc);
  };

  return { location, loading, refresh, setManual };
}
