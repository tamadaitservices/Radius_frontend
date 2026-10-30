'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';

interface GlassCardProps {
  href: string;
  image?: string | null;
  fallbackEmoji?: string;
  title: string;
  subtitle?: string;
  /** Large bold line under the title (usually the price). */
  price?: ReactNode;
  /** Small pill in the photo's top-left corner. */
  badge?: ReactNode;
  /** Pill in the photo's top-right corner. */
  badgeRight?: ReactNode;
  /** 1–5, picks one of the pastel tints. */
  tint?: number;
  muted?: boolean;
}

/** Pastel card with the photo on top and a frosted-glass name/price panel with a round action button. */
export default function GlassCard({
  href, image, fallbackEmoji = '📦', title, subtitle, price, badge, badgeRight, tint = 1, muted,
}: GlassCardProps) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/5] rounded-[28px] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5"
      style={{ background: `var(--tint-${((tint - 1) % 5) + 1})`, boxShadow: 'var(--shadow-card)' }}
    >
      <div className="absolute inset-x-0 top-0 h-[74%]">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl select-none">{fallbackEmoji}</div>
        )}
        {muted && <div className="absolute inset-0 bg-white/60" />}
      </div>

      {badge && <div className="absolute top-3 left-3">{badge}</div>}
      {badgeRight && <div className="absolute top-3 right-3">{badgeRight}</div>}

      <div className="ry-glass absolute left-2 right-2 bottom-2 rounded-[22px] px-3.5 py-2.5 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--foreground)' }}>{title}</p>
          {subtitle && <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
          {price && <p className="text-[15px] font-black leading-tight mt-0.5" style={{ color: 'var(--foreground)' }}>{price}</p>}
        </div>
        <span className="ry-round-btn !w-9 !h-9">
          <ArrowUpRight size={17} />
        </span>
      </div>
    </Link>
  );
}

/** Small white pill used for the badges on cards. */
export function Pill({ children, tone = 'light' }: { children: ReactNode; tone?: 'light' | 'brand' | 'dark' | 'success' | 'danger' }) {
  const styles: Record<string, React.CSSProperties> = {
    light: { background: 'rgba(255,255,255,0.92)', color: '#0f1b3d' },
    brand: { background: 'var(--brand)', color: 'var(--on-brand)' },
    dark: { background: 'rgba(15,27,61,0.72)', color: '#fff' },
    success: { background: 'rgba(255,255,255,0.92)', color: 'var(--success)' },
    danger: { background: 'rgba(255,255,255,0.92)', color: '#dc2626' },
  };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full" style={styles[tone]}>
      {children}
    </span>
  );
}
