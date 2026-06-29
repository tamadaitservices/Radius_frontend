'use client';

import { useEffect, useState } from 'react';
import { useLocation } from './useLocation';
import api from '@/lib/api';

export interface Zone {
  id: string;
  name: string;
  categories: string[];
}

export function useZone() {
  const { location, loading } = useLocation();
  const [zone, setZone] = useState<Zone | null>(null);

  useEffect(() => {
    if (loading) return;
    api
      .get('/api/zones/detect', { params: { lat: location.lat, lng: location.lng } })
      .then((r) => setZone(r.data ?? null))
      .catch(() => setZone(null));
  }, [location.lat, location.lng, loading]);

  return zone;
}
