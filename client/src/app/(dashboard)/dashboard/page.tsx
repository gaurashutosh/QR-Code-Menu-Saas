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
import { Button } from '@/components/ui/Button';
import RestaurantSetup from '@/components/dashboard/RestaurantSetup';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, firebaseUser, restaurant, loading, isRestaurantOnboarded, refreshUser, error: authError } = useAuth();
  const currentTab = searchParams.get('tab') || 'overview';

  useEffect(() => {
    // Only redirect to login if we are definitely not logged in via Firebase.
    // If we have a firebaseUser but no profile (user is null), we might have a server error.
    // In that case, we show an error message instead of redirecting to avoid a loop.
    if (!loading && !firebaseUser) {
      router.replace(paths.login);
    }
  }, [loading, firebaseUser, router]);

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

  if (authError && firebaseUser && !user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 max-w-sm">
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Connection Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We couldn&apos;t load your profile. This might be due to a server issue or a bad connection.
          </p>
          <Button onClick={() => refreshUser()} className="w-full">
            Try Again
          </Button>
          <Button variant="ghost" onClick={() => router.push(paths.login)} className="w-full mt-2 text-gray-500">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

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
