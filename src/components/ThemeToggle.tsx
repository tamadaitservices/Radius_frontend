'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('ry-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    setMounted(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('ry-theme', next ? 'dark' : 'light');
  };

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
