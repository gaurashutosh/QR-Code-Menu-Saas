'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, Clock, X, Star, CheckCircle, Send, Loader2, Leaf } from 'lucide-react';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import { customerFeedbackAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  variants?: { name: string; price: number }[];
  imageUrl?: string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isSpicy: boolean;
  isBestseller: boolean;
  tags?: string[];
}

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  items: MenuItem[];
}

interface Restaurant {
  _id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  themeColor?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  phone?: string;
  openingHours?: any;
  currency?: string;
  settings?: {
    showOutOfStock?: boolean;
    showPrices?: boolean;
    enableSearch?: boolean;
  };
}

interface PublicMenuClientProps {
  data: {
    restaurant: Restaurant;
    categories: Category[];
  };
  slug: string;
}

export default function PublicMenuClient({ data, slug }: PublicMenuClientProps) {
  const { restaurant, categories } = data;
  const [searchQuery, setSearchQuery] = useState('');
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const themeColor = restaurant.themeColor || '#f97316';
  const currency = restaurant.currency || 'INR';

  // Filter items based on search and veg filter
  const filteredCategories = categories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      const matchesSearch = !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVeg = !showVegOnly || item.isVeg;
      return matchesSearch && matchesVeg;
    }),
  })).filter(category => category.items.length > 0);

  // Record scan on page load
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/public/menu/${slug}/scan`, {
      method: 'POST',
    }).catch(() => {});
  }, [slug]);

  const formatAddress = () => {
    if (!restaurant.address) return null;
    const { street, city, state, pincode } = restaurant.address;
    return [street, city, state, pincode].filter(Boolean).join(', ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header
        className="relative text-white"
        style={{ backgroundColor: themeColor }}
      >
        {restaurant.coverImageUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${restaurant.coverImageUrl})` }}
          />
        )}
        <div className="relative px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            {restaurant.logoUrl && (
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className="w-20 h-20 rounded-full mx-auto mb-4 bg-white p-1 object-cover"
              />
            )}
            <h1 className="text-2xl font-bold mb-2">{restaurant.name}</h1>
            {restaurant.description && (
              <p className="text-white/80 text-sm">{restaurant.description}</p>
            )}
          </div>
        </div>
      </header>

      {/* Info Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex flex-wrap gap-4 text-sm text-gray-600">
          {formatAddress() && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{formatAddress()}</span>
            </div>
          )}
          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-1 text-orange-600"
            >
              <Phone className="w-4 h-4" />
              <span>{restaurant.phone}</span>
            </a>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      {restaurant.settings?.enableSearch !== false && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowVegOnly(!showVegOnly)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${
                showVegOnly
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'border-gray-200 text-gray-600'
              }`}
            >
              <Leaf className="w-5 h-5" />
              <span className="hidden sm:inline">Veg</span>
            </button>
          </div>
        </div>
      )}

      {/* Categories Nav */}
      {filteredCategories.length > 1 && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 overflow-x-auto">
          <div className="max-w-2xl mx-auto flex gap-2">
            {filteredCategories.map((category) => (
              <button
                key={category._id}
                onClick={() => {
                  setActiveCategory(category._id);
                  document.getElementById(`category-${category._id}`)?.scrollIntoView({
                    behavior: 'smooth',
                  });
                }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === category._id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category._id}
              id={`category-${category._id}`}
              className="mb-8"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4 sticky top-[72px] bg-gray-50 py-2">
                {category.name}
              </h2>
              <div className="space-y-4">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item._id}
                    item={item}
                    currency={currency}
                    showPrices={restaurant.settings?.showPrices !== false}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Customer Feedback Section */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Rate Your Experience</h2>
            <p className="text-gray-500">How was your meal? We'd love to hear from you!</p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6 md:p-8">
            <FeedbackForm restaurantId={restaurant._id} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-4 text-center text-sm text-gray-500">
        <p>Powered by QR Menu</p>
      </footer>
    </div>
  );
}

function MenuItemCard({
  item,
  currency,
  showPrices,
}: {
  item: MenuItem;
  currency: string;
  showPrices: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm ${
        !item.isAvailable ? 'opacity-60' : ''
      }`}
    >
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-2 mb-1">
            {/* Veg/Non-veg indicator */}
            <div
              className={`w-5 h-5 border-2 flex items-center justify-center rounded ${
                item.isVeg ? 'border-green-600' : 'border-red-600'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  item.isVeg ? 'bg-green-600' : 'bg-red-600'
                }`}
              />
            </div>
            <h3 className="font-semibold text-gray-900">{item.name}</h3>
          </div>
          
          {/* Badges */}
          <div className="flex flex-wrap gap-1 mb-2">
            {item.isBestseller && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                Bestseller
              </span>
            )}
            {item.isSpicy && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                🌶️ Spicy
              </span>
            )}
            {!item.isAvailable && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                Unavailable
              </span>
            )}
          </div>
          
          {item.description && (
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
              {item.description}
            </p>
          )}
          
          {showPrices && (
            <div className="font-semibold text-gray-900">
              {formatPrice(item.price, currency)}
              {item.variants && item.variants.length > 0 && (
                <span className="text-sm font-normal text-gray-500 ml-2">
                  +{item.variants.length} variants
                </span>
              )}
            </div>
          )}
        </div>
        
        {item.imageUrl && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackForm({ restaurantId }: { restaurantId: string }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return toast.error('Please select a rating');
    
    setLoading(true);
    try {
      await customerFeedbackAPI.submit({
        restaurantId,
        rating,
        comment,
        customerName,
        customerPhone,
      });
      setSubmitted(true);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600">Your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star Rating */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-sm font-medium text-gray-500">
          {rating > 0 ? (
            <span className="text-orange-500">
              {['Terrible', 'Bad', 'Okay', 'Good', 'Excellent'][rating - 1]}
            </span>
          ) : (
            'Tap a star to rate'
          )}
        </p>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Comments (Optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none bg-white"
          placeholder="What did you like or dislike?"
          maxLength={1000}
        />
      </div>

      {/* Contact Info (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name (Optional)
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-white"
            placeholder="Your name"
            maxLength={50}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone (Optional)
          </label>
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-white"
            placeholder="Your phone number"
            maxLength={20}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
        Submit Feedback
      </button>
    </form>
  );
}
