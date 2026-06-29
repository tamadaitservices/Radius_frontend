import HeroBanner from '@/components/home/HeroBanner';
import PromoBanners from '@/components/home/PromoBanners';
import CategoryGrid from '@/components/home/CategoryGrid';
import FeaturedShops from '@/components/home/FeaturedShops';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import HowItWorks from '@/components/home/HowItWorks';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      <HeroBanner />
      <PromoBanners />
      <CategoryGrid />
      <FeaturedShops />
      <FeaturedProducts />
      <HowItWorks />
    </div>
  );
}
