import { notFound } from 'next/navigation';
import PublicMenuClient from './PublicMenuClient';

// Server-side API URL resolution
// Checks NEXT_PUBLIC_API_URL (build-time), API_URL (server-only), then production fallback
const getApiUrl = () => {
  const base = process.env.NEXT_PUBLIC_API_URL || 
               process.env.API_URL || 
               'https://qr-code-menu-saas.onrender.com/api';
  
  // Ensure it ends with /api (but not /api/)
  let url = base.replace(/\/$/, '');
  if (!url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  
  try {
    const response = await fetch(
      `${getApiUrl()}/public/restaurant/${slug}`,
      { cache: 'no-store', signal: controller.signal }
    );
    
    if (!response.ok) {
      return {
        title: 'Menu Not Found | QR Menu',
      };
    }
    
    const data = await response.json();
    const restaurant = data.data;
    
    return {
      title: `${restaurant.name} | Menu`,
      description: restaurant.description || `View the menu for ${restaurant.name}`,
      openGraph: {
        title: `${restaurant.name} | Menu`,
        description: restaurant.description || `View the menu for ${restaurant.name}`,
        images: restaurant.logoUrl ? [restaurant.logoUrl] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Menu | QR Menu',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  
  try {
    const response = await fetch(
      `${getApiUrl()}/public/menu/${slug}`,
      { cache: 'no-store', signal: controller.signal }
    );
    
    if (!response.ok) {
      notFound();
    }
    
    const data = await response.json();
    
    return <PublicMenuClient data={data.data} slug={slug} />;
  } catch (error) {
    notFound();
  } finally {
    clearTimeout(timeout);
  }
}
