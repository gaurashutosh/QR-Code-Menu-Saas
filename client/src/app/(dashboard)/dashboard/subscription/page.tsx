'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { subscriptionAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Check,
  Crown,
  Sparkles,
  AlertCircle,
  CreditCard,
  FileText,
  Download,
} from 'lucide-react';
import { ReceiptTemplate, generateReceiptPDF } from '@/components/dashboard/ReceiptPDF';
import { paths } from '@/lib/paths';

const PLANS = [
  {
    id: 'monthly',
    name: 'Premium',
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
    name: 'Premium',
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

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, restaurant, subscription, refreshUser, loading: authLoading } = useAuth();
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
      router.replace(paths.dashboard.subscription);
    } else if (canceled === 'true') {
      toast.error('Payment was canceled');
      router.replace(paths.dashboard.subscription);
    }
  }, [searchParams, refreshUser, router]);

  useEffect(() => {
    fetchHistory();
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
    
    // Find the correct description based on the plan name
    const planDesc = item.planName.toLowerCase() === 'premium' 
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
    // Map 'month' from Stripe to 'monthly' and 'year' to 'yearly'
    const currentBillingCycle = subscription.billingCycle === 'month' ? 'monthly' : 
                               subscription.billingCycle === 'year' ? 'yearly' : 
                               subscription.billingCycle;
    return planId.toLowerCase() === currentBillingCycle?.toLowerCase();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden Receipt Templates for PDF Generation */}
      {history.map((item) => (
        <ReceiptTemplate
          key={item.id}
          data={{
            invoiceNumber: item.number,
            date: item.date,
            planName: item.planName,
            planDescription: item.planName.toLowerCase() === 'premium' 
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

      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={paths.dashboard.root} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Subscription</h1>
              <p className="text-sm text-gray-500">Manage your plan</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Current Plan Status */}
        {subscription && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                  {subscription.plan === 'trial' ? (
                    <Sparkles className="w-6 h-6 text-white" />
                  ) : (
                    <Crown className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {subscription.plan === 'trial' ? 'Free Trial' : `${subscription.plan} Plan`}
                  </h2>
                  <p className="text-gray-600">
                    {subscription.plan === 'trial' ? (
                      <>
                        {subscription.daysRemaining} days remaining
                        {subscription.daysRemaining <= 3 && (
                          <span className="text-red-500 ml-2">• Expiring soon!</span>
                        )}
                      </>
                    ) : subscription.status === 'canceled' ? (
                      'Cancels at end of billing period'
                    ) : (
                      `Renews on ${new Date(subscription.currentPeriodEnd || '').toLocaleDateString()}`
                    )}
                  </p>
                </div>
              </div>
              {subscription.plan !== 'trial' && subscription.status !== 'canceled' && (
                <button
                  onClick={handleCancel}
                  className="text-sm text-gray-500 hover:text-red-600"
                >
                  Cancel subscription
                </button>
              )}
            </div>

            {subscription.plan === 'trial' && subscription.daysRemaining <= 3 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-800">Trial ending soon</h3>
                  <p className="text-yellow-700 text-sm">
                    Upgrade now to keep your menu active and accessible to customers.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment History Section */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                Payment History
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                    <th className="px-6 py-4">Invoice</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.number}</div>
                        <div className="text-xs text-gray-500">{item.planName}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">
                          {item.currency.toUpperCase()} {item.amount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(item)}
                          className="hover:border-orange-500 hover:text-orange-500"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 relative ${
                plan.recommended
                  ? 'ring-2 ring-orange-500 shadow-lg'
                  : 'shadow-sm'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium rounded-full">
                    Recommended
                  </span>
                </div>
              )}

              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    ₹{plan.price}
                  </span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                {plan.monthlyEquivalent && (
                  <p className="text-sm text-green-600 mt-1">
                    ₹{plan.monthlyEquivalent}/month • Save {plan.savings}
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan(plan.id) ? (
                <Button variant="outline" className="w-full" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.recommended ? 'primary' : 'outline'}
                  onClick={() => handleSubscribe(plan.id)}
                  loading={loading === plan.id}
                  disabled={subscription?.isActive && subscription?.plan !== 'trial'}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {subscription?.isActive && subscription?.plan !== 'trial' 
                    ? 'Subscribed' 
                    : subscription?.plan === 'trial' 
                    ? 'Start Plan' 
                    : 'Upgrade'}
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* FAQ or Info */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>All plans include a 7-day money-back guarantee.</p>
          <p className="mt-1">
            Need help? Contact us at{' '}
            <a href="mailto:support@qrmenu.com" className="text-orange-600 hover:underline">
              support@qrmenu.com
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
