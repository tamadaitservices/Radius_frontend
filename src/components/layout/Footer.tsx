import Link from 'next/link';
import { MapPin, Phone, Mail } from 'lucide-react';

const nav = {
  discover: [
    { label: 'Search Products', href: '/search' },
    { label: 'How It Works', href: '/#how-it-works' },
    { label: 'My Reservations', href: '/reservations' },
    { label: 'My Profile', href: '/profile' },
  ],
  vendors: [
    { label: 'List Your Shop', href: '/vendor/register' },
    { label: 'Vendor Login', href: '/vendor/login' },
    { label: 'Vendor Dashboard', href: '/vendor/dashboard' },
  ],
  legal: [
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Privacy Policy', href: '/privacy' },
  ],
};

export default function Footer() {
  return (
    <footer style={{ background: 'var(--footer-bg)', borderTop: '1px solid var(--footer-border)' }}>
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-black tracking-tight">
                <span style={{ color: 'var(--footer-heading)' }}>Radiu</span>
                <span style={{ color: 'var(--ry-green)' }}>Yes</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--footer-text-muted)' }}>
              Find it nearby. Negotiate on call. Reserve and walk in. No delivery. No waiting.
            </p>
            <div className="space-y-2 text-sm" style={{ color: 'var(--footer-text-muted)' }}>
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: 'var(--ry-green)', flexShrink: 0 }} />
                <span>Vijayawada, Andhra Pradesh</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} style={{ color: 'var(--ry-green)', flexShrink: 0 }} />
                <a href="mailto:hello@radiuyes.com" className="hover:underline">hello@radiuyes.com</a>
              </div>
            </div>
          </div>

          {/* Discover column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--footer-text-muted)' }}>
              Discover
            </h3>
            <ul className="space-y-2.5">
              {nav.discover.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: 'var(--footer-text)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Vendors column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--footer-text-muted)' }}>
              For Vendors
            </h3>
            <ul className="space-y-2.5">
              {nav.vendors.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: 'var(--footer-text)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--footer-border)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--footer-heading)' }}>No commission. Ever.</p>
              <p className="text-xs" style={{ color: 'var(--footer-text-muted)' }}>List your shop free and keep 100% of what you earn.</p>
            </div>
          </div>

          {/* Legal column */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--footer-text-muted)' }}>
              Company
            </h3>
            <ul className="space-y-2.5">
              {nav.legal.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm transition-colors hover:underline"
                    style={{ color: 'var(--footer-text)' }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--footer-border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs" style={{ color: 'var(--footer-text-muted)' }}>
            © {new Date().getFullYear()} GenieHost Private Limited. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'var(--footer-text-muted)' }}>
            Made with <span style={{ color: 'var(--ry-green)' }}>♥</span> in Vijayawada
          </p>
        </div>
      </div>
    </footer>
  );
}
