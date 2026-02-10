import { notFound } from 'next/navigation';
import { publicAPI } from '@/lib/api';
import PublicMenuClient from './PublicMenuClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/public/restaurant/${slug}`,
      { cache: 'no-store' }
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
  }
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params;
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/public/menu/${slug}`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      notFound();
    }
    
    const data = await response.json();
    
    return <PublicMenuClient data={data.data} slug={slug} />;
  } catch (error) {
    notFound();
  }
}
