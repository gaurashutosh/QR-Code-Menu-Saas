'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRestaurant } from '@/hooks/useRestaurant';
import { customerFeedbackAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Star,
  MessageSquare,
  User,
  Phone,
  Clock,
  Filter,
  Users,
  TrendingUp,
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

export default function CustomerFeedbackPage() {
  const { user } = useAuth();
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-gray-500">See what your customers are saying</p>
        </div>
        
        <select
          value={ratingFilter}
          onChange={(e) => {
            setRatingFilter(e.target.value ? Number(e.target.value) : '');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-orange-600 fill-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {stats.avgRating.toFixed(1)}
                  </h3>
                  <span className="text-sm text-gray-400">/ 5.0</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Reviews</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">5 Star Reviews</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.count5}</h3>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {feedback.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No feedback yet</p>
            <p className="text-sm">Feedback from your public menu will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {feedback.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                      {item.customerName ? item.customerName[0].toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {item.customerName || 'Anonymous Customer'}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        {item.customerPhone && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {item.customerPhone}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  {renderStars(item.rating, "w-5 h-5")}
                </div>
                
                {item.comment && (
                  <p className="text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm md:text-base">
                    "{item.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
