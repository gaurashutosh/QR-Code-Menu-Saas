'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SubscriptionBannerProps {
  subscription: any;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  const router = useRouter();

  if (!subscription) return null;

  const { status, daysRemaining, plan } = subscription;

  const handleUpgradeClick = () => {
    router.push('/dashboard?tab=subscription');
  };

  // 1. Expired Status (Hard Blocker)
  if (status === 'expired') {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/30 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 sm:mt-0 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                Your subscription has expired
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Your public menu is currently offline. Please renew to restore access.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="flex items-center gap-2 whitespace-nowrap bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Renew Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 2. Trial Status
  if (status === 'trial') {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/30 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-start sm:items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-0 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                You are on a Free Trial
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining in your trial. Upgrade to keep your menu online!
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="flex items-center gap-2 whitespace-nowrap bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Upgrade Plan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Expiring Soon (Active status but <= 3 days remaining)
  if (status === 'active' && Number.isFinite(daysRemaining) && daysRemaining <= 3) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800/30 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 sm:mt-0 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Subscription expiring soon
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Your <strong>{plan}</strong> plan expires in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}. Renew now to avoid interruption.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgradeClick}
            className="flex items-center gap-2 whitespace-nowrap bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Renew Plan
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // If active and plenty of days left, render nothing
  return null;
}
