'use client';

import { useState, useEffect } from 'react';
import { adminAPI } from '@/lib/api';
import {
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  User,
  Shield,
  CreditCard,
  MessageSquare,
} from 'lucide-react';

interface OverviewProps {
  onNavigate: (view: string) => void;
}

interface StatsData {
  users: {
    total: number;
    newToday: number;
    growth: number;
  };
  restaurants: {
    total: number;
    active: number;
    growth: number;
  };
  subscriptions: {
    total: number;
    active: number;
    mrr: number;
    growth: number;
    trial: number;
    paid: number;
  };
  menuViews: {
    total: number;
    today: number;
    growth: number;
  };
  recentActivity: {
    type: 'user_signup' | 'restaurant_created' | 'subscription_started';
    message: string;
    timestamp: string;
    details?: any;
  }[];
}

export default function Overview({ onNavigate }: OverviewProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
        <div className="text-sm text-gray-400 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          System Online
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-orange-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-500" />
            </div>
            {stats.users.growth >= 0 ? (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +{stats.users.growth}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowDownRight className="w-3 h-3" />
                {stats.users.growth}%
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Users</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.users.total}</h3>
            <span className="text-xs text-gray-500">+{stats.users.newToday} today</span>
          </div>
        </div>

        {/* Total Restaurants */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-500" />
            </div>
            {stats.restaurants.growth >= 0 ? (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +{stats.restaurants.growth}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowDownRight className="w-3 h-3" />
                {stats.restaurants.growth}%
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Restaurants</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.restaurants.total}</h3>
            <span className="text-xs text-gray-500">{stats.restaurants.active} active</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-500" />
            </div>
            {stats.subscriptions.growth >= 0 ? (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +{stats.subscriptions.growth}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowDownRight className="w-3 h-3" />
                {stats.subscriptions.growth}%
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm font-medium">Active Subscriptions</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.subscriptions.active}</h3>
            <span className="text-xs text-gray-500">MRR: ₹{stats.subscriptions.mrr.toLocaleString()}</span>
          </div>
        </div>

        {/* Total Menu Views */}
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
            </div>
            {stats.menuViews.growth >= 0 ? (
              <div className="flex items-center gap-1 text-green-500 bg-green-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowUpRight className="w-3 h-3" />
                +{stats.menuViews.growth}%
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-500 bg-red-500/10 px-2 py-1 rounded-lg text-xs font-medium">
                <ArrowDownRight className="w-3 h-3" />
                {stats.menuViews.growth}%
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm font-medium">Total Menu Views</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-white">{stats.menuViews?.total?.toLocaleString() || 0}</h3>
            <span className="text-xs text-gray-500">+{stats.menuViews?.today || 0} today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Recent Activity
            </h3>
            <button 
              onClick={() => onNavigate('users')}
              className="text-sm text-orange-500 hover:text-orange-400 font-medium"
            >
              View all
            </button>
          </div>
          <div className="space-y-4">
            {stats.recentActivity?.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-xl bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  activity.type === 'user_signup' ? 'bg-blue-500/20 text-blue-500' :
                  activity.type === 'restaurant_created' ? 'bg-green-500/20 text-green-500' :
                  'bg-purple-500/20 text-purple-500'
                }`}>
                  {activity.type === 'user_signup' && <User className="w-4 h-4" />}
                  {activity.type === 'restaurant_created' && <Store className="w-4 h-4" />}
                  {activity.type === 'subscription_started' && <CreditCard className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{activity.message}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-gray-500" />
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
            )}
          </div>
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Subscription Health
            </h3>
            <button 
              onClick={() => onNavigate('analytics')}
              className="text-sm text-green-500 hover:text-green-400 font-medium"
            >
              View Analytics
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-700/30 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Trial Users</p>
              <p className="text-2xl font-bold text-white">
                {stats.subscriptions?.trial || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-700/30 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Paid Users</p>
              <p className="text-2xl font-bold text-white">
                {stats.subscriptions?.active || 0}
              </p>
            </div>
            <div className="p-4 bg-gray-700/30 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Churn Rate</p>
              <p className="text-2xl font-bold text-white">
                0% <span className="text-xs font-normal text-gray-500">(Last 30 days)</span>
              </p>
            </div>
            <div className="p-4 bg-gray-700/30 rounded-xl">
              <p className="text-sm text-gray-400 mb-1">Inactive</p>
              <p className="text-2xl font-bold text-white">
                {(stats.users?.total || 0) - (stats.subscriptions?.active || 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-700">
             <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Total Revenue (MRR)</span>
                <span className="font-bold text-white">₹{(stats.subscriptions?.mrr || 0).toLocaleString()} <span className="text-xs font-normal text-gray-500">/mo</span></span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
