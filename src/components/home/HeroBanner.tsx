'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, MapPin, LocateFixed } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

export default function HeroBanner() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const { location, refresh } = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="space-y-3">
      {/* Mobile search bar */}
      <form onSubmit={handleSearch} className="flex gap-2 md:hidden">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search "kurta", "paracetamol"...'
            className="w-full pl-9 pr-4 h-11 rounded-lg border-2 border-gray-200 focus:border-green-600 focus:outline-none text-sm bg-gray-50"
          />
        </div>
        <button
          type="submit"
          className="px-4 h-11 rounded-lg text-white text-sm font-semibold"
          style={{ backgroundColor: 'var(--ry-green)' }}
        >
          Go
        </button>
      </form>

      {/* Location notice */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        {location.isDefault
          ? <MapPin size={14} style={{ color: 'var(--ry-green)' }} />
          : <LocateFixed size={14} style={{ color: 'var(--ry-green)' }} />
        }
        <span>
          Showing shops near <strong style={{ color: 'var(--foreground)' }}>{location.isDefault ? 'Vijayawada' : 'your location'}</strong>
          {location.isDefault && ' — '}
        </span>
        {location.isDefault && (
          <button onClick={refresh} className="font-medium hover:underline" style={{ color: 'var(--ry-green)' }}>
            Detect my location
          </button>
        )}
      </div>
    </div>
  );
}
