import type { Metadata } from 'next';
import ProductPageClient from '@/components/product/ProductPageClient';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://radiuyes.com';

async function getProduct(id: string) {
  try {
    const res = await fetch(`${API}/api/products/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: 'Product Not Found | RadiuYes' };

  const title = `${product.name} — ${product.shop?.name}, ${product.shop?.area} | RadiuYes`;
  const description = product.description || `${product.name} available at ${product.shop?.name} in ${product.shop?.area}, Vijayawada. Call to confirm availability or reserve for 45 minutes.`;

  return {
    title,
    description,
    openGraph: {
      title: product.name,
      description,
      url: `${SITE}/product/${id}`,
      siteName: 'RadiuYes',
      images: product.image ? [{ url: product.image, width: 600, height: 600, alt: product.name }] : [],
      type: 'website',
      locale: 'en_IN',
    },
  };
}

export default async function ProductPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return <ProductPageClient id={id} />;
}
