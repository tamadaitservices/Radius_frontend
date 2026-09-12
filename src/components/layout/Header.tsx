'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { MapPin, ShoppingBag, User, ChevronDown, Shield, Store, LocateFixed, Tag, Landmark, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLocation } from '@/hooks/useLocation';
import { useHomeModeStore, type HomeMode } from '@/store/homeMode';
import ThemeToggle from '@/components/ThemeToggle';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/home/LocationPicker'), { ssr: false });

const MODES: { id: HomeMode; label: string; icon: LucideIcon; color: string }[] = [
  { id: 'shops', label: 'Shops', icon: Store, color: 'var(--ry-green)' },
  { id: 'preowned', label: 'Pre-Owned', icon: Tag, color: 'var(--ry-orange)' },
  { id: 'places', label: 'Places', icon: Landmark, color: 'var(--ry-blue)' },
  { id: 'food', label: 'Food', icon: UtensilsCrossed, color: 'var(--ry-red)' },
];

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { location } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { mode, setMode } = useHomeModeStore();

  const goToMode = (m: HomeMode) => {
    setMode(m);
    if (pathname !== '/') router.push('/');
  };

  const locationLabel = location.label
    ? location.label
    : location.isDefault
      ? 'Vijayawada'
      : `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`;

  const logout = () => {
    clearAuth();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/');
  };

  const isVendor = user?.type === 'vendor';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md shadow-sm"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-black tracking-tight">
              <span style={{ color: 'var(--foreground)' }}>Radiu</span>
              <span style={{ color: 'var(--ry-green)' }}>Yes</span>
            </span>
          </Link>

          {/* Location */}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 text-sm font-medium flex-shrink-0 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            title="Change location"
          >
            {location.isDefault
              ? <MapPin size={16} style={{ color: 'var(--ry-green)' }} />
              : <LocateFixed size={16} style={{ color: 'var(--ry-green)' }} />
            }
            <span className="max-w-[120px] truncate hidden sm:block">{locationLabel}</span>
            <ChevronDown size={14} />
          </button>

          {/* Search bar — hidden on mobile */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value.trim();
                if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
              }}
              className="relative"
            >
              <input
                name="q"
                type="text"
                placeholder='Search "kurta", "medicines", "plywood"...'
                className="w-full h-10 pl-4 pr-20 rounded-lg border-2 text-sm transition-colors focus:outline-none"
                style={{
                  background: 'var(--input-bg)',
                  borderColor: 'var(--border)',
                  color: 'var(--foreground)',
                }}
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-10 px-4 rounded-r-lg text-white text-sm font-medium"
                style={{ backgroundColor: 'var(--ry-green)' }}
              >
                Search
              </button>
            </form>
          </div>

          {/* Spacer — pushes auth to right on mobile */}
          <div className="flex-1 md:hidden" />

          {/* Auth + Theme toggle */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--ry-orange)' }}>
                    <Shield size={16} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {isVendor ? (
                  <>
                    <Link href="/vendor/dashboard" className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <Store size={18} />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href="/vendor/profile" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        <User size={18} />
                        <span className="hidden sm:inline">{user.name || user.phone}</span>
                      </Link>
                      <button onClick={logout} className="text-xs transition-colors" style={{ color: 'var(--text-subtle)' }}>Logout</button>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="/reservations" className="flex items-center gap-1.5 text-sm font-medium transition-colors" style={{ color: 'var(--text-muted)' }}>
                      <ShoppingBag size={18} />
                      <span className="hidden sm:inline">My Reserves</span>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href="/profile" className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                        {(() => {
                          const av = (user as any).avatar;
                          if (!av) return <User size={18} />;
                          if (av.startsWith('http')) return <img src={av} alt="" className="w-7 h-7 rounded-full object-cover" />;
                          return <span className="text-lg leading-none">{av}</span>;
                        })()}
                        <span className="hidden sm:inline">{user.name || 'Profile'}</span>
                      </Link>
                      <button onClick={logout} className="text-xs transition-colors" style={{ color: 'var(--text-subtle)' }}>Logout</button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: 'var(--ry-green)' }}
                >
                  Login
                </Link>
                <Link
                  href="/vendor/login"
                  className="px-3 py-2 rounded-lg text-sm font-semibold border-2 transition-colors hidden sm:block"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                >
                  Vendor
                </Link>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* Shops / Pre-Owned / Places / Food mode tiles */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5">
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => goToMode(m.id)}
                  className="flex flex-col items-center justify-center gap-1 w-16 sm:w-[76px] py-2 rounded-2xl text-xs font-bold border-[1.5px] transition-colors flex-shrink-0"
                  style={active
                    ? { backgroundColor: m.color, borderColor: m.color, color: '#fff' }
                    : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }
                  }
                >
                  <m.icon size={18} color={active ? '#fff' : m.color} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
    </>
  );
}
