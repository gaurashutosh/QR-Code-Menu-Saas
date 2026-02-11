'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paths } from '@/lib/paths';
import DashboardShell from '@/components/dashboard/DashboardShell';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isRestaurantOnboarded, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(paths.login);
      return;
    }

    // If the user is authenticated but has not completed restaurant setup,
    // guide them to the setup flow (except when they're already there).
    if (!isRestaurantOnboarded && pathname === paths.dashboard.root) {
      router.replace(paths.dashboard.setup);
    }
  }, [isAuthenticated, isRestaurantOnboarded, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  // While the redirect effect runs, avoid rendering dashboard content
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DashboardShell>
      {children}
    </DashboardShell>
  );
}

