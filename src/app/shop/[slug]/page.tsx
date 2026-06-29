import type { Metadata } from 'next';
import ShopPageClient from '@/components/shop/ShopPageClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://radiuyes.com';

async function getShop(slug: string) {
  try {
    const res = await fetch(`${API}/api/shops/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) return { title: 'Shop Not Found | RadiuYes' };

  const title = `${shop.name} — ${shop.area}, ${shop.city} | RadiuYes`;
  const description =
    shop.description ||
    `${shop.name} in ${shop.area}, Vijayawada. ${shop.reviewCount} verified reviews. Call to confirm availability, reserve for 45 min, walk in and pay.`;

  return {
    title,
    description,
    openGraph: {
      title: shop.name,
      description,
      url: `${SITE}/shop/${slug}`,
      siteName: 'RadiuYes',
      images: shop.coverImage
        ? [{ url: shop.coverImage, width: 1200, height: 400, alt: shop.name }]
        : [],
      type: 'website',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: shop.name,
      description,
      images: shop.coverImage ? [shop.coverImage] : [],
    },
  };
}

export default async function ShopPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  return <ShopPageClient id={slug} />;
}
