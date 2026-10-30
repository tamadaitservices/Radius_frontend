'use client';

import { useRouter } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';

export default function CategoryGrid() {
  const router = useRouter();
  const { categories } = useCategories();

  return (
    <section>
      <h2 className="text-xl font-extrabold mb-3" style={{ color: 'var(--foreground)' }}>Shop by Category</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {categories.map((cat, i) => (
          <button
            key={cat.key}
            onClick={() => router.push(`/search?q=${cat.key.toLowerCase()}&category=${cat.key}`)}
            className="flex-shrink-0 flex flex-col items-center gap-2 group active:scale-95 transition-transform cursor-pointer"
            style={{ minWidth: '84px' }}
          >
            <div
              className="w-[84px] h-[84px] rounded-[26px] flex items-center justify-center transition-transform group-hover:-translate-y-0.5"
              style={{ background: `var(--tint-${(i % 5) + 1})`, boxShadow: 'var(--shadow-card)' }}
            >
              <span className="text-4xl">{cat.icon}</span>
            </div>
            <span className="text-xs font-semibold text-center leading-tight w-full" style={{ color: 'var(--foreground)' }}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
