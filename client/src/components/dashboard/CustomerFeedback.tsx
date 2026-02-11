'use client';

import { useState, useEffect } from 'react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { customerFeedbackAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Star,
  MessageSquare,
  User,
  Phone,
  TrendingUp,
  Users,
} from 'lucide-react';

interface Feedback {
  _id: string;
  rating: number;
  comment?: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
}

interface FeedbackStats {
  avgRating: number;
  total: number;
  count5: number;
  count4: number;
  count3: number;
  count2: number;
  count1: number;
}

export default function CustomerFeedback() {
  const { restaurant } = useRestaurant();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');

  useEffect(() => {
    if (restaurant?._id) {
      fetchFeedback();
    }
  }, [restaurant, page, ratingFilter]);

  const fetchFeedback = async () => {
    if (!restaurant?._id) return;
    
    setLoading(true);
    try {
      const response = await customerFeedbackAPI.getRestaurantFeedback(restaurant._id, {
        page,
        limit: 10,
        rating: ratingFilter ? Number(ratingFilter) : undefined,
      });
      setFeedback(response.data.data);
      setStats(response.data.stats);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: string = "w-4 h-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${size} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Customer Feedback</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review ratings and comments from your diners.</p>
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value ? Number(e.target.value) : '');
            setPage(1);
          }}
          className="px-4 py-2 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm text-sm h-[44px] text-gray-900 dark:text-white"
        >
          <option value="" className="bg-white dark:bg-zinc-950">All Ratings</option>
          <option value="5" className="bg-white dark:bg-zinc-950">5 Stars</option>
          <option value="4" className="bg-white dark:bg-zinc-950">4 Stars</option>
          <option value="3" className="bg-white dark:bg-zinc-950">3 Stars</option>
          <option value="2" className="bg-white dark:bg-zinc-950">2 Stars</option>
          <option value="1" className="bg-white dark:bg-zinc-950">1 Star</option>
        </select>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-950/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="w-6 h-6 text-orange-600 dark:text-orange-400 fill-orange-600 dark:fill-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgRating.toFixed(1)}
                </h3>
                <span className="text-sm text-gray-400 dark:text-gray-600">/ 5.0</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Reviews</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
             <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Happy Customers</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stats.count5}</h3>
              <p className="text-xs text-green-600 dark:text-green-400">5-star reviews</p>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        {feedback.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No feedback yet</h3>
            <p className="text-gray-500 dark:text-gray-400">Feedback from your public menu will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {feedback.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-zinc-700 dark:to-zinc-800 rounded-full flex items-center justify-center text-orange-700 dark:text-orange-400 font-bold shadow-inner">
                      {item.customerName ? item.customerName[0].toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {item.customerName || 'Anonymous Customer'}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                         {item.customerPhone && (
                          <>
                            <span className="text-gray-300 dark:text-gray-700">•</span>
                            <span className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              {item.customerPhone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex bg-yellow-50 dark:bg-yellow-950/30 px-2 py-1 rounded-lg">
                    {renderStars(item.rating, "w-5 h-5")}
                  </div>
                </div>
                
                {item.comment && (
                  <div className="ml-14 bg-gray-50/80 dark:bg-zinc-950/50 p-4 rounded-xl text-gray-700 dark:text-gray-300 text-sm md:text-base leading-relaxed border border-gray-100 dark:border-gray-800">
                    "{item.comment}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-900/50">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
