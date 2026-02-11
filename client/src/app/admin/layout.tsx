'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paths } from '@/lib/paths';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  const pathname = usePathname();
  const isLoginPage = pathname === paths.admin.login;

  useEffect(() => {
    if (loading || isLoginPage) return;

    if (!isAdmin) {
      router.replace(paths.admin.login);
    }
  }, [isAdmin, loading, router, isLoginPage]);

  // Fallback timeout in case loading never completes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.error('Auth loading took too long, redirecting...');
        router.replace(paths.admin.login);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  if (!isAdmin && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}

