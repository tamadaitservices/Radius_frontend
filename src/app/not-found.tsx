import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl mb-6">🏪</div>
      <h1 className="text-4xl font-black text-gray-900 mb-2">404</h1>
      <p className="text-xl font-bold text-gray-700 mb-2">Page not found</p>
      <p className="text-gray-500 mb-8 max-w-sm">
        The page you're looking for doesn't exist. It may have moved or been removed.
      </p>
      <div className="flex gap-3 flex-wrap justify-center">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl text-white font-bold text-sm"
          style={{ backgroundColor: 'var(--ry-green)' }}
        >
          Browse Shops
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 rounded-xl border-2 font-bold text-sm text-gray-700 hover:bg-gray-50"
          style={{ borderColor: 'var(--ry-border)' }}
        >
          Search Products
        </Link>
      </div>
    </div>
  );
}
