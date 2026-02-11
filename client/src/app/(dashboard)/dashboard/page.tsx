'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paths } from '@/lib/paths';

// Components
import Overview from '@/components/dashboard/Overview';
import MenuManagement from '@/components/dashboard/MenuManagement';
import QRCodeDisplay from '@/components/dashboard/QRCodeDisplay';
import RestaurantSettings from '@/components/dashboard/RestaurantSettings';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import CustomerFeedback from '@/components/dashboard/CustomerFeedback';
import SupportFeedback from '@/components/dashboard/SupportFeedback';
import RestaurantSetup from '@/components/dashboard/RestaurantSetup';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const { user, restaurant, loading, isRestaurantOnboarded, refreshUser } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(paths.login);
    }
  }, [loading, user, router]);

  // Handle redirect to setup if not onboarded
  useEffect(() => {
    if (!loading && user && !isRestaurantOnboarded) {
      // If we are not already on the setup tab, redirect
      if (currentTab !== 'setup') {
        router.replace('/dashboard?tab=setup');
      }
    }
  }, [loading, user, isRestaurantOnboarded, currentTab, router]);

  const handleNavigate = (tab: string) => {
    router.push(`/dashboard?tab=${tab}`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // If user is not onboarded, show setup regardless of tab (though effect should redirect)
  // But strictly, we should let the effect handle the URL change and just render based on tab.
  // Exception: If we are in setup mode, we only show setup.

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <Overview onNavigate={handleNavigate} />;
      case 'menu':
        return <MenuManagement />;
      case 'qr':
        return <QRCodeDisplay />;
      case 'settings':
        return <RestaurantSettings />;
      case 'subscription':
        return <SubscriptionManagement />;
      case 'customer-feedback':
        return <CustomerFeedback />;
      case 'feedback':
        return <SupportFeedback />;
      case 'setup':
        return <RestaurantSetup onComplete={async () => {
            await refreshUser();
            router.push('/dashboard?tab=overview');
        }} />;
      default:
        return <Overview onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {renderContent()}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
