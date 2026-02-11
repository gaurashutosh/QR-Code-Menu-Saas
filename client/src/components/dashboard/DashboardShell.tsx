'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { paths } from '@/lib/paths';
import {
  QrCode,
  Utensils,
  Settings,
  LogOut,
  Eye,
  Shield,
  MessageSquare,
  CreditCard,
  Menu,
  X,
  LayoutDashboard,
  HelpCircle,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

const mainNav = [
  { tab: 'overview', label: 'Overview', icon: LayoutDashboard },
  { tab: 'menu', label: 'Menu', icon: Utensils },
  { tab: 'qr', label: 'QR Code', icon: QrCode },
  { tab: 'settings', label: 'Settings', icon: Settings },
  { tab: 'subscription', label: 'Subscription', icon: CreditCard },
  { tab: 'customer-feedback', label: 'Feedback', icon: Star },
  { tab: 'feedback', label: 'Help', icon: HelpCircle },
] as const;

function DashboardShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const { user, restaurant, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    if (typeof window !== 'undefined') window.location.href = paths.home;
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row">
      {/* Mobile: top bar */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/80 dark:border-gray-800 safe-area-inset-top">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 active:bg-gray-200 transition-colors touch-manipulation"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white truncate">
            {restaurant?.name ?? 'Dashboard'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-10" aria-hidden />
        </div>
      </header>

      {/* Mobile: overlay when drawer open */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={cn(
          'fixed inset-0 z-40 bg-black/20 dark:bg-black/40 backdrop-blur-sm transition-opacity duration-200 lg:hidden',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setMobileOpen(false)}
      />

      {/* Sidebar: desktop always visible, mobile as drawer */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 lg:z-0 flex flex-col w-72 min-h-screen bg-white dark:bg-zinc-950 border-r border-gray-200/80 dark:border-gray-800',
          'transition-transform duration-300 ease-out lg:translate-x-0',
          'safe-area-inset-left',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 lg:border-b dark:border-gray-800">
          <Link
            href="/dashboard?tab=overview"
            className="flex items-center gap-3 min-w-0"
            onClick={() => setMobileOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{restaurant?.name ?? 'QR Menu'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Dashboard</p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="Main">
          {mainNav.map(({ tab, label, icon: Icon }) => {
            const isActive = currentTab === tab;
            return (
              <Link
                key={tab}
                href={`/dashboard?tab=${tab}`}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 touch-manipulation',
                  isActive
                    ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0', isActive ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500')} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          {user?.role === 'admin' && (
            <Link
              href={paths.admin.root}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Shield className="w-5 h-5 text-orange-500" />
              Admin
            </Link>
          )}
          {restaurant && (
            <a
              href={paths.menuForSlug(restaurant.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Eye className="w-5 h-5" />
              Preview menu
            </a>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {children}
      </main>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <DashboardShellContent>{children}</DashboardShellContent>
    </Suspense>
  );
}
