'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { adminAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Search,
  Shield,
  Store,
  Eye,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { paths } from '@/lib/paths';

interface RestaurantData {
  _id: string;
  name: string;
  slug: string;
  isActive: boolean;
  menuViewCount: number;
  createdAt: string;
  owner?: {
    _id: string;
    email: string;
    displayName?: string;
  };
}

export default function AdminRestaurantsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push(paths.dashboard.root);
      toast.error('Admin access required');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRestaurants();
    }
  }, [user, pagination.page, statusFilter]);

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getRestaurants({
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setRestaurants(response.data.data);
      setPagination((prev) => ({
        ...prev,
        ...response.data.pagination,
      }));
    } catch (error) {
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRestaurants();
  };

  const handleToggleStatus = async (restaurantId: string) => {
    try {
      await adminAPI.toggleRestaurant(restaurantId);
      toast.success('Restaurant status updated');
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  /* Delete Confirmation State */
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await adminAPI.deleteRestaurant(deleteId);
      toast.success('Restaurant deleted successfully');
      fetchRestaurants();
    } catch (error) {
      toast.error('Failed to delete restaurant');
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  if (authLoading || (loading && restaurants.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Restaurant?</h3>
              <p className="text-gray-500 text-sm">
                This action cannot be undone. All associated data (menus, subscriptions) will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 text-gray-700"
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
                <p className="text-sm text-gray-400">Restaurant Management</p>
              </div>
            </div>
            <nav className="flex gap-4">
              <Link
                href={paths.admin.root}
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-medium"
              >
                Overview
              </Link>
              <Link
                href={paths.admin.users}
                className="px-4 py-2 text-gray-400 hover:text-white rounded-lg font-medium"
              >
                Users
              </Link>
              <Link
                href={paths.admin.restaurants}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium"
              >
                Restaurants
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </form>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Restaurants Table */}
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Restaurant</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Owner</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Views</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {restaurants.map((restaurant) => (
                <tr key={restaurant._id} className="hover:bg-gray-700/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center">
                        <Store className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-400">/{restaurant.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {restaurant.owner ? (
                      <div>
                        <p className="text-sm">{restaurant.owner.displayName || 'No name'}</p>
                        <p className="text-xs text-gray-400">{restaurant.owner.email}</p>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-gray-400" />
                      <span>{restaurant.menuViewCount.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggleStatus(restaurant._id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                        restaurant.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {restaurant.isActive ? (
                        <>
                          <ToggleRight className="w-4 h-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-4 h-4" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-sm">
                    {new Date(restaurant.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/menu/${restaurant.slug}`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg inline-flex mr-2"
                      title="View public menu"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setDeleteId(restaurant._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg inline-flex"
                      title="Delete Restaurant"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {restaurants.length === 0 && (
            <div className="text-center py-12 text-gray-500">No restaurants found</div>
          )}
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-400">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 bg-gray-800 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="p-2 bg-gray-800 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
