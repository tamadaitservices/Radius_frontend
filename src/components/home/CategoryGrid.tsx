'use client';

import { useRouter } from 'next/navigation';
import { CATEGORY_ICONS, CATEGORY_LABELS } from '@/lib/utils';

const CATEGORIES = [
  'ELECTRONICS', 'CLOTHING', 'GROCERY', 'HARDWARE',
  'MEDICAL', 'FOOD', 'BAKERY', 'FURNITURE',
  'SPORTS', 'BOOKS', 'BEAUTY', 'JEWELLERY',
  'TOYS', 'AUTO', 'OTHER',
];

export default function CategoryGrid() {
  const router = useRouter();

  return (
    <section>
      <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--foreground)' }}>Shop by Category</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => router.push(`/search?q=${cat.toLowerCase()}&category=${cat}`)}
              className="flex-shrink-0 flex flex-col items-center gap-2 group active:scale-95 transition-all cursor-pointer"
              style={{ minWidth: '80px' }}
            >
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center group-hover:brightness-95 transition-all"
                style={{ background: 'var(--category-bg)' }}
              >
                <span className="text-4xl">{CATEGORY_ICONS[cat]}</span>
              </div>
              <span
                className="text-xs font-semibold text-center leading-tight w-full"
                style={{ color: 'var(--foreground)' }}
              >
                {CATEGORY_LABELS[cat]}
              </span>
            </button>
          ))}
      </div>
    </section>
  );
}
