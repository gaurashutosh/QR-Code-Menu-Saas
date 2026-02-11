'use client';

import { useAuth } from '@/context/AuthContext';
import { useMenu } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/Button';
import {
  Utensils,
  Eye,
  BarChart3,
  CreditCard,
  AlertCircle,
  Crown,
  QrCode,
  Settings,
  MessageSquare,
  Shield,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface OverviewProps {
  onNavigate: (view: string) => void;
}

export default function Overview({ onNavigate }: OverviewProps) {
  const { restaurant, subscription } = useAuth();
  const { categories, menuItems } = useMenu();

  const daysRemaining = subscription?.daysRemaining ?? 0;
  const isTrialExpiring = subscription?.plan === 'trial' && daysRemaining <= 3;

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {subscription?.plan !== 'trial' && subscription?.isActive ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full ring-1 ring-inset ring-amber-600/20">
                <Crown className="w-3.5 h-3.5" />
                Premium Plan
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                {daysRemaining} days remaining on trial
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Trial Banner */}
      {isTrialExpiring && (
        <div
          className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm"
          role="alert"
        >
          <div className="flex items-start sm:items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">Trial Ending Soon</h3>
              <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">
                Your free trial expires in {daysRemaining} days. Upgrade now to keep your menu active.
              </p>
            </div>
          </div>
          <Button 
            onClick={() => onNavigate('subscription')}
            size="sm" 
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-sm font-medium bg-amber-600 hover:bg-amber-700 text-white border-transparent"
          >
            Upgrade Plan
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <section aria-label="Key Statistics">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <StatCard
            title="Menu Items"
            value={menuItems.length}
            icon={<Utensils className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-50 dark:bg-blue-950/30"
            hoverBorderClass="hover:border-blue-200 dark:hover:border-blue-900/50"
          />
          <StatCard
            title="Categories"
            value={categories.length}
            icon={<BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="text-purple-600 dark:text-purple-400"
            bgColor="bg-purple-50 dark:bg-purple-950/30"
            hoverBorderClass="hover:border-purple-200 dark:hover:border-purple-900/50"
          />
          <StatCard
            title="Current Plan"
            value={subscription?.plan === 'trial' ? 'Trial' : (subscription?.plan ?? '—')}
            subtitle={subscription?.plan === 'trial' ? `${daysRemaining}d left` : undefined}
            icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-50 dark:bg-emerald-950/30"
            hoverBorderClass="hover:border-emerald-200 dark:hover:border-emerald-900/50"
          />
          <StatCard
            title="Total Views"
            value={restaurant?.menuViewCount ?? 0}
            icon={<Eye className="w-5 h-5 sm:w-6 sm:h-6" />}
            color="text-orange-600 dark:text-orange-400"
            bgColor="bg-orange-50 dark:bg-orange-950/30"
            hoverBorderClass="hover:border-orange-200 dark:hover:border-orange-900/50"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-label="Quick Actions">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <ActionCard
            title="Manage Menu"
            description="Add items, edit prices, and organize categories."
            icon={<Utensils className="w-6 h-6" />}
            onClick={() => onNavigate('menu')}
            buttonText="Open Menu"
            color="from-blue-500 to-blue-600"
          />
          <ActionCard
            title="QR Code"
            description="Download your QR code or print table flyers."
            icon={<QrCode className="w-6 h-6" />}
            onClick={() => onNavigate('qr')}
            buttonText="Get QR Code"
            color="from-purple-500 to-purple-600"
          />
          <ActionCard
            title="Settings"
            description="Update restaurant profile and preferences."
            icon={<Settings className="w-6 h-6" />}
            onClick={() => onNavigate('settings')}
            buttonText="Edit Profile"
            color="from-gray-700 to-gray-800 dark:from-gray-800 dark:to-gray-900"
          />
          <ActionCard
            title="Subscription"
            description="View plan details and billing history."
            icon={<CreditCard className="w-6 h-6" />}
            onClick={() => onNavigate('subscription')}
            buttonText="Manage Plan"
            color="from-emerald-500 to-emerald-600"
          />
          <ActionCard
            title="Feedback"
            description="See what customers are saying."
            icon={<MessageSquare className="w-6 h-6" />}
            onClick={() => onNavigate('feedback')}
            buttonText="View Reviews"
            color="from-orange-500 to-red-500"
          />
          <ActionCard
            title="Help & Support"
            description="Get assistance or report an issue."
            icon={<Shield className="w-6 h-6" />}
            onClick={() => onNavigate('support')} // support isn't a main tab yet, maybe just feedback or external link? kept as support for now
            buttonText="Get Help"
            color="from-cyan-500 to-cyan-600"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  bgColor,
  hoverBorderClass,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverBorderClass: string;
}) {
  return (
    <div className={`group relative overflow-hidden bg-white dark:bg-zinc-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-200 hover:shadow-md ${hoverBorderClass}`}>
      <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
         {/* Decorative background icon */}
      </div>
      
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${bgColor} ${color} flex items-center justify-center mb-3`}>
          {icon}
        </div>
      </div>
      
      <div className="relative z-10">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tabular-nums tracking-tight">
            {value}
          </p>
          {subtitle && (
            <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded-md">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
  buttonText,
  color,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  buttonText: string;
  color: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group block w-full text-left bg-white dark:bg-zinc-900 rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-sm transition-all duration-200 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div className="relative p-4 sm:p-5 h-full flex flex-col">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        
        <h3 className="font-semibold text-gray-900 dark:text-white text-base sm:text-lg mb-1 group-hover:text-orange-600 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed min-h-[40px]">
          {description}
        </p>
        
        <div className="mt-4 flex items-center text-sm font-medium text-gray-400 dark:text-gray-500 group-hover:text-orange-600 transition-colors">
          {buttonText}
          <ArrowRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
