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
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search "kurta", "paracetamol"...'
            className="w-full pl-11 pr-4 h-12 rounded-full border focus:border-[var(--brand)] focus:outline-none text-sm"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>
        <button
          type="submit"
          className="ry-pill-btn !px-6 !py-0 h-12 text-sm"
        >
          Go
        </button>
      </form>

      {/* Location notice */}
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        {location.isDefault
          ? <MapPin size={14} style={{ color: 'var(--brand-ink)' }} />
          : <LocateFixed size={14} style={{ color: 'var(--brand-ink)' }} />
        }
        <span>
          Showing shops near <strong style={{ color: 'var(--foreground)' }}>{location.isDefault ? 'Vijayawada' : 'your location'}</strong>
          {location.isDefault && ' — '}
        </span>
        {location.isDefault && (
          <button onClick={refresh} className="font-semibold hover:underline" style={{ color: 'var(--brand-ink)' }}>
            Detect my location
          </button>
        )}
      </div>
    </div>
  );
}
