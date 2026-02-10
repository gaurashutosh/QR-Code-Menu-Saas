'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Store,
  CreditCard,
  Eye,
  Utensils,
  TrendingUp,
  ArrowRight,
  Shield,
  DollarSign,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface Stats {
  users: { total: number };
  restaurants: { total: number; active: number };
  subscriptions: { total: number; active: number; trial: number; paid: number };
  menuItems: { total: number };
  views: { total: number };
  recent: {
    users: Array<{ _id: string; email: string; displayName?: string; createdAt: string }>;
    restaurants: Array<{ _id: string; name: string; slug: string; createdAt: string; menuViewCount: number }>;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  /* Delete Confirmation State */
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'user' | 'restaurant' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
      toast.error('Admin access required');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await adminAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      toast.error('Failed to load admin stats');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId || !deleteType) return;

    setIsDeleting(true);
    try {
      if (deleteType === 'user') {
        await adminAPI.deleteUser(deleteId);
        toast.success('User deleted successfully');
        // Assuming you have a way to refresh user list, e.g., refetching stats or a dedicated user list state
        fetchStats(); // Refetch stats to update recent users
      } else {
        await adminAPI.deleteRestaurant(deleteId);
        toast.success('Restaurant deleted successfully');
        // Assuming you have a way to refresh restaurant list
        fetchStats(); // Refetch stats to update recent restaurants
      }
    } catch (error) {
      toast.error(`Failed to delete ${deleteType}`);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-12">
      {/* Delete Confirmation Modal */}
      {(deleteId && deleteType) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete {deleteType === 'user' ? 'User' : 'Restaurant'}?</h3>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. All associated data will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteId(null);
                  setDeleteType(null);
                }}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-gray-400">QR Menu SaaS</p>
              </div>
            </div>
            <nav className="flex gap-4">
              <Link
                href="/admin"
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium"
              >
                Overview
              </Link>
              <Link
                href="/admin/analytics"
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-medium"
              >
                Analytics
              </Link>
              <Link
                href="/admin/users"
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-medium"
              >
                Users
              </Link>
              <Link
                href="/admin/restaurants"
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-medium"
              >
                Restaurants
              </Link>
              <Link
                href="/admin/feedback"
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-medium"
              >
                Feedback
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={Users}
            label="Total Users"
            value={stats.users.total}
            color="blue"
          />
          <StatCard
            icon={Store}
            label="Restaurants"
            value={stats.restaurants.total}
            subvalue={`${stats.restaurants.active} active`}
            color="green"
          />
          <StatCard
            icon={CreditCard}
            label="Subscriptions"
            value={stats.subscriptions.active}
            subvalue={`${stats.subscriptions.paid} paid`}
            color="purple"
          />
          <StatCard
            icon={Utensils}
            label="Menu Items"
            value={stats.menuItems.total}
            color="orange"
          />
          <StatCard
            icon={Eye}
            label="Total Views"
            value={stats.views.total}
            color="pink"
          />
        </div>

        {/* Subscription Breakdown */}
        <div className="bg-gray-800 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Subscription Breakdown</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-yellow-400">{stats.subscriptions.trial}</p>
              <p className="text-sm text-gray-400">Trial Users</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-green-400">{stats.subscriptions.paid}</p>
              <p className="text-sm text-gray-400">Paid Users</p>
            </div>
            <div className="bg-gray-700/50 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-gray-400">
                {stats.subscriptions.total - stats.subscriptions.active}
              </p>
              <p className="text-sm text-gray-400">Inactive</p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Users */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Users</h2>
              <Link
                href="/admin/users"
                className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recent.users.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl"
                >
                  <div>
                    <p className="font-medium">{user.displayName || 'No name'}</p>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Restaurants */}
          <div className="bg-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Restaurants</h2>
              <Link
                href="/admin/restaurants"
                className="text-sm text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {stats.recent.restaurants.map((restaurant) => (
                <div
                  key={restaurant._id}
                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-xl"
                >
                  <div>
                    <p className="font-medium">{restaurant.name}</p>
                    <p className="text-sm text-gray-400">/{restaurant.slug}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400">
                      {restaurant.menuViewCount} views
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(restaurant.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subvalue,
  color,
}: {
  icon: any;
  label: string;
  value: number;
  subvalue?: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <div className="bg-gray-800 rounded-2xl p-4">
      <div
        className={`w-10 h-10 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center mb-3`}
      >
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {subvalue && <p className="text-xs text-gray-500 mt-1">{subvalue}</p>}
    </div>
  );
}
