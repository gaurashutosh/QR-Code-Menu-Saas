'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRestaurant, useMenu } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/Button';
import { paths } from '@/lib/paths';
import {
  QrCode,
  Utensils,
  Settings,
  LogOut,
  Plus,
  Eye,
  Download,
  BarChart3,
  CreditCard,
  AlertCircle,
  Shield,
  MessageSquare,
  Crown,
} from 'lucide-react';
import { formatPrice, getDaysRemaining } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const { user, restaurant, subscription, loading, signOut } = useAuth();
  const { categories, menuItems } = useMenu();

  useEffect(() => {
    if (!loading && !user) {
      router.push(paths.login);
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Show create restaurant form if no restaurant
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Set Up Your Restaurant
          </h1>
          <p className="text-gray-600 mb-8">
            Create your restaurant profile to start building your digital menu.
          </p>
          <Link href={paths.dashboard.setup}>
            <Button className="w-full">
              <Plus className="w-5 h-5 mr-2" />
              Create Restaurant
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysRemaining = subscription?.daysRemaining || 0;
  const isTrialExpiring = subscription?.plan === 'trial' && daysRemaining <= 3;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900">{restaurant.name}</h1>
                  {subscription?.plan !== 'trial' && subscription?.isActive && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                      <Crown className="w-3 h-3" />
                      Premium
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Admin Link - only for admins */}
              {user?.role === 'admin' && (
                <Link
                  href={paths.admin.root}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium text-sm hover:opacity-90 transition"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin</span>
                </Link>
              )}
              <Link
                href={paths.menuForSlug(restaurant.slug)}
                target="_blank"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Eye className="w-5 h-5" />
                <span className="hidden sm:inline">Preview Menu</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trial Warning */}
        {isTrialExpiring && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">Trial Expiring Soon</h3>
              <p className="text-yellow-700 text-sm">
                Your free trial expires in {daysRemaining} days. Upgrade now to continue using QR Menu.
              </p>
            </div>
            <Link href={paths.dashboard.subscription}>
              <Button size="sm">Upgrade</Button>
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Menu Items"
            value={menuItems.length}
            icon={<Utensils className="w-6 h-6" />}
          />
          <StatCard
            title="Categories"
            value={categories.length}
            icon={<BarChart3 className="w-6 h-6" />}
          />
          <StatCard
            title="Plan"
            value={subscription?.plan === 'trial' ? 'Free Trial' : subscription?.plan || 'N/A'}
            subtitle={`${daysRemaining} days left`}
            icon={<CreditCard className="w-6 h-6" />}
          />
          <StatCard
            title="Menu Views"
            value={restaurant.menuViewCount || 0}
            icon={<Eye className="w-6 h-6" />}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Menu Management */}
            <ActionCard
            title="Menu Management"
            description="Add, edit, and organize your menu items and categories"
            icon={<Utensils className="w-8 h-8" />}
            href="/dashboard/menu"
            buttonText="Manage Menu"
          />

          {/* QR Code */}
            <ActionCard
            title="QR Code"
            description="Download and print your menu QR code"
            icon={<QrCode className="w-8 h-8" />}
            href="/dashboard/qr"
            buttonText="View QR Code"
          />

          {/* Settings */}
            <ActionCard
            title="Restaurant Settings"
            description="Update your restaurant profile and preferences"
            icon={<Settings className="w-8 h-8" />}
            href="/dashboard/settings"
            buttonText="Edit Settings"
          />

          {/* Subscription */}
            <ActionCard
            title="Subscription"
            description="Manage your plan and billing"
            icon={<CreditCard className="w-8 h-8" />}
            href="/dashboard/subscription"
            buttonText="View Plans"
          />

          {/* Customer Feedback */}
            <ActionCard
            title="Customer Feedback"
            description="View ratings and reviews from your customers"
            icon={<MessageSquare className="w-8 h-8" />}
            href="/dashboard/customer-feedback"
            buttonText="View Feedback"
          />

          {/* Help & Support */}
            <ActionCard
            title="Help & Support"
            description="Get help or suggest new features to our team"
            icon={<Shield className="w-8 h-8" />}
            href="/dashboard/feedback"
            buttonText="Get Help"
          />
        </div>
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
          {icon}
        </div>
      </div>
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  href,
  buttonText,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Link href={href}>
        <Button variant="outline" className="w-full">
          {buttonText}
        </Button>
      </Link>
    </div>
  );
}
