'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { MapPin, ShoppingBag, User, ChevronDown, Shield, Store, LocateFixed, Tag, Landmark, UtensilsCrossed, Search, type LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLocation } from '@/hooks/useLocation';
import { useHomeModeStore, type HomeMode } from '@/store/homeMode';
import ThemeToggle from '@/components/ThemeToggle';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/home/LocationPicker'), { ssr: false });

const MODES: { id: HomeMode; label: string; icon: LucideIcon }[] = [
  { id: 'shops', label: 'Shops', icon: Store },
  { id: 'preowned', label: 'Resale', icon: Tag },
  { id: 'places', label: 'Places', icon: Landmark },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
];

type Reveal = { x: number; y: number; r: number; color: string; phase: 'grow' | 'cover' | 'fade' };

export default function Header() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { location } = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const { mode, setMode } = useHomeModeStore();
  const [reveal, setReveal] = useState<Reveal | null>(null);

  // The active mode's palette takes over the home page; every other page keeps the default orange.
  useEffect(() => {
    document.documentElement.dataset.mode = pathname === '/' ? mode : 'shops';
  }, [mode, pathname]);

  const goToMode = (m: HomeMode) => {
    setMode(m);
    if (pathname !== '/') router.push('/');
  };

  /** Expands the new mode's colour from the clicked pill, swaps the mode underneath, then fades away. */
  const switchMode = (m: HomeMode, e: React.MouseEvent<HTMLButtonElement>) => {
    if (m === mode && pathname === '/') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const color = getComputedStyle(document.documentElement).getPropertyValue(`--m-${m}`).trim() || '#ff6a1a';
    setReveal({ x, y, r, color, phase: 'grow' });
    window.setTimeout(() => setReveal((s) => (s ? { ...s, phase: 'cover' } : s)), 30);
    window.setTimeout(() => {
      goToMode(m);
      setReveal((s) => (s ? { ...s, phase: 'fade' } : s));
    }, 440);
    window.setTimeout(() => setReveal(null), 820);
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
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{ background: 'var(--header-bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <span className="text-2xl font-black tracking-tight">
              <span style={{ color: 'var(--foreground)' }}>Radiu</span>
              <span style={{ color: 'var(--m-shops)' }}>Yes</span>
            </span>
          </Link>

          {/* Location */}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold flex-shrink-0 rounded-full px-3 py-1.5 transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--foreground)' }}
            title="Change location"
          >
            {location.isDefault
              ? <MapPin size={16} style={{ color: 'var(--brand-ink)' }} />
              : <LocateFixed size={16} style={{ color: 'var(--brand-ink)' }} />
            }
            <span className="max-w-[120px] truncate hidden sm:block">{locationLabel}</span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
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
                className="w-full h-11 pl-5 pr-14 rounded-full border text-sm transition-colors focus:outline-none focus:border-[var(--brand)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1 h-9 w-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--brand)', color: 'var(--on-brand)' }}
              >
                <Search size={16} />
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
                  <Link href="/admin" className="flex items-center gap-1 text-sm font-medium" style={{ color: 'var(--brand-ink)' }}>
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
                          if (av.startsWith('http')) return <img src={av} alt="" className="w-8 h-8 rounded-full object-cover" />;
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
                <Link href="/login" className="ry-pill-btn !py-2 !px-5 text-sm">
                  Login
                </Link>
                <Link href="/vendor/login" className="ry-pill-ghost !py-2 !px-4 text-sm hidden sm:inline-flex">
                  Vendor
                </Link>
              </div>
            )}

            <ThemeToggle />
          </div>
        </div>

        {/* Shops / Resale / Places / Food mode pills */}
        <div className="max-w-7xl mx-auto px-4 pb-2.5">
          <nav className="flex items-center gap-0.5 sm:gap-1.5 overflow-x-auto no-scrollbar" aria-label="Browse mode">
            {MODES.map((m) => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={(e) => switchMode(m.id, e)}
                  aria-pressed={active}
                  className="flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-full text-sm flex-shrink-0 transition-all"
                  style={active
                    ? { background: `var(--m-${m.id})`, color: `var(--m-${m.id}-on)`, fontWeight: 700, boxShadow: `0 6px 14px color-mix(in srgb, var(--m-${m.id}) 35%, transparent)` }
                    : { background: 'transparent', color: 'var(--text-muted)', fontWeight: 600 }
                  }
                >
                  <m.icon size={16} />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Colour reveal: grows from the clicked pill, covers the page while the mode swaps, then fades */}
      {reveal && (
        <div className="fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
          <div
            style={{
              position: 'absolute',
              left: reveal.x - reveal.r,
              top: reveal.y - reveal.r,
              width: reveal.r * 2,
              height: reveal.r * 2,
              borderRadius: '9999px',
              background: reveal.color,
              transform: reveal.phase === 'grow' ? 'scale(0)' : 'scale(1)',
              opacity: reveal.phase === 'fade' ? 0 : 1,
              transition: 'transform 440ms cubic-bezier(0.65, 0, 0.35, 1), opacity 360ms ease-out',
            }}
          />
        </div>
      )}

      {pickerOpen && <LocationPicker onClose={() => setPickerOpen(false)} />}
    </>
  );
}
