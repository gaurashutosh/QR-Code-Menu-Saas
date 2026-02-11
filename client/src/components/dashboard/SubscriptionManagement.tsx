'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { subscriptionAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import {
  Check,
  Crown,
  Sparkles,
  AlertCircle,
  CreditCard,
  FileText,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { ReceiptTemplate, generateReceiptPDF } from '@/components/dashboard/ReceiptPDF';

const PLANS = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 499,
    period: 'month',
    features: [
      'Unlimited menu items',
      'Custom branding & logos',
      'Direct WhatsApp orders',
      'Advanced analytics',
      'No watermark',
      'Priority support',
    ],
    recommended: false,
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 5000,
    period: 'year',
    monthlyEquivalent: 416,
    savings: '16%',
    features: [
      'Unlimited menu items',
      'Custom branding & logos',
      'Direct WhatsApp orders',
      'Advanced analytics',
      'No watermark',
      'Priority support',
      '2 Months FREE included',
    ],
    recommended: true,
  },
];

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  date: string;
  pdfUrl: string;
  number: string;
  planName: string;
}

export default function SubscriptionManagement() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, restaurant, subscription, refreshUser } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  // Handle success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');

    if (success === 'true') {
      toast.success('Subscription activated! Welcome aboard 🎉');
      refreshUser();
      // Clean up URL params
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    } else if (canceled === 'true') {
      toast.error('Payment was canceled');
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, refreshUser, router]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setFetchingHistory(true);
    try {
      const response = await subscriptionAPI.getHistory();
      setHistory(response.data.data);
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleDownload = async (item: PaymentHistory) => {
    if (!user || !restaurant) return;
    
    const planDesc = item.planName.toLowerCase().includes('premium')
      ? 'Includes unlimited menu items, premium templates, advanced analytics, and priority support.'
      : 'Basic plan with core features.';

    await generateReceiptPDF({
      invoiceNumber: item.number,
      date: item.date,
      planName: item.planName,
      planDescription: planDesc,
      amount: item.amount,
      currency: item.currency,
      userName: user.displayName || 'Customer',
      userEmail: user.email,
      restaurantName: restaurant.name,
      restaurantAddress: (restaurant as any).address 
        ? `${(restaurant as any).address.street}, ${(restaurant as any).address.city}`
        : undefined,
      restaurantPhone: (restaurant as any).phone,
    });
  };

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const response = await subscriptionAPI.createCheckout(planId);
      const { url } = response.data.data;

      if (url) {
        window.location.href = url;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }

    try {
      await subscriptionAPI.cancel();
      toast.success('Subscription will be canceled at the end of your billing period');
      refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  };

  const isCurrentPlan = (planId: string) => {
    if (!subscription || !subscription.isActive) return false;
    const currentBillingCycle = subscription.billingCycle === 'month' ? 'monthly' : 
                               subscription.billingCycle === 'year' ? 'yearly' : 
                               subscription.billingCycle;
    return planId.toLowerCase() === currentBillingCycle?.toLowerCase();
  };

  return (
    <div className="space-y-8 animate-fade-in">
       {/* PDF Generator Templates */}
       {history.map((item) => (
        <ReceiptTemplate
          key={item.id}
          data={{
            invoiceNumber: item.number,
            date: item.date,
            planName: item.planName,
            planDescription: item.planName.toLowerCase().includes('premium') 
              ? 'Includes unlimited menu items, premium templates, advanced analytics, and priority support.'
              : 'Basic plan with core features.',
            amount: item.amount,
            currency: item.currency,
            userName: user?.displayName || 'Customer',
            userEmail: user?.email || '',
            restaurantName: restaurant?.name || '',
            restaurantAddress: (restaurant as any)?.address 
              ? `${(restaurant as any).address.street}, ${(restaurant as any).address.city}`
              : undefined,
            restaurantPhone: (restaurant as any)?.phone,
          }}
        />
      ))}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Subscription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your plan and billing details.</p>
        </div>
      </div>

       {/* Current Plan Status */}
       {subscription && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 ${subscription.plan === 'trial' ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-orange-400 to-red-600'}`}>
                  {subscription.plan === 'trial' ? (
                    <Sparkles className="w-7 h-7 text-white" />
                  ) : (
                    <Crown className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {subscription.plan === 'trial' ? 'Free Trial' : `${subscription.plan} Plan`}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400">
                     {subscription.plan === 'trial' ? (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${subscription.daysRemaining <= 3 ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'}`}>
                           {subscription.daysRemaining} days remaining
                        </span>
                     ) : (
                        <span className={`px-2 py-0.5 rounded-full font-medium ${subscription.status === 'active' ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'}`}>
                           {subscription.status === 'active' ? 'Active' : subscription.status}
                        </span>
                     )}
                     <span className="text-gray-400 dark:text-gray-600">•</span>
                     <span>
                         {subscription.status === 'canceled' 
                            ? 'Ends' 
                            : 'Renews'} on {subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                      </span>
                  </div>
                </div>
              </div>

              {subscription.plan !== 'trial' && subscription.status !== 'canceled' && (
                <button
                  onClick={handleCancel}
                  className="text-sm text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline decoration-gray-300 dark:decoration-gray-700 hover:decoration-red-500 underline-offset-4 transition-colors p-1"
                >
                  Cancel subscription
                </button>
              )}
            </div>

            {subscription.plan === 'trial' && subscription.daysRemaining <= 3 && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/30 rounded-xl flex gap-3 animate-pulse-slow">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">Your trial is ending soon!</h3>
                  <p className="text-yellow-700 dark:text-yellow-400/80 text-sm mt-0.5">
                    Upgrade to Premium to keep your menu active, retain your QR codes, and access advanced analytics.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto pt-4">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-zinc-900 rounded-3xl p-8 relative transition-all duration-300 border ${
              plan.recommended
                ? 'border-orange-200 dark:border-orange-900/30 ring-4 ring-orange-500/10 dark:ring-orange-900/20 shadow-xl scale-100 sm:scale-105 z-10'
                : 'border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                  Recommended
                </span>
              </div>
            )}

            <div className="text-center mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {plan.name}
              </h3>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  ₹{plan.price}
                </span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">/{plan.period}</span>
              </div>
              {plan.monthlyEquivalent && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                  <span>₹{plan.monthlyEquivalent}/mo</span>
                  <span className="w-1 h-1 bg-green-400 dark:bg-green-600 rounded-full"></span>
                  <span>Save {plan.savings}</span>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400 stroke-[3]" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            {isCurrentPlan(plan.id) ? (
              <Button variant="outline" className="w-full min-h-[48px] rounded-xl bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400" disabled>
                Current Plan
              </Button>
            ) : (
              <Button
                className={`w-full min-h-[48px] rounded-xl text-base font-medium shadow-lg transition-transform active:scale-95 ${
                  plan.recommended 
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-orange-500/25' 
                    : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/10'
                }`}
                onClick={() => handleSubscribe(plan.id)}
                loading={loading === plan.id}
                disabled={subscription?.isActive && subscription?.plan !== 'trial'}
              >
                {!loading && <CreditCard className="w-4 h-4 mr-2" />}
                {subscription?.isActive && subscription?.plan !== 'trial' 
                  ? 'Subscribed' 
                  : subscription?.plan === 'trial' 
                  ? 'Start Premium' 
                  : 'Upgrade Now'}
              </Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-4">
        <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-500" />
        <span>Secured by Stripe • 7-day money-back guarantee • Cancel anytime</span>
      </div>

      {/* Payment History Section */}
      {history.length > 0 && (
        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              Invoice History
            </h3>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 dark:bg-zinc-800/50">
                  <tr className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/80 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{item.number}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.planName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.currency.toUpperCase()} {item.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDownload(item)}
                          className="inline-flex items-center justify-center p-2 text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
