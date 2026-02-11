'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Phone, X, Star, CheckCircle, Send, Loader2, Leaf, Beef } from 'lucide-react';
import Image from 'next/image';
import { formatPrice, cn } from '@/lib/utils';
import { customerFeedbackAPI } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  const [menuFilter, setMenuFilter] = useState<'all' | 'veg' | 'non-veg'>('all');
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
      
      const matchesFilter = 
        menuFilter === 'all' || 
        (menuFilter === 'veg' && item.isVeg) || 
        (menuFilter === 'non-veg' && !item.isVeg);
        
      return matchesSearch && matchesFilter;
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

  const scrollToCategory = (id: string) => {
    setActiveCategory(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const offset = 180; // Height of sticky headers
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pb-20">
      {/* Header */}
      <header
        className="relative text-white transition-all duration-300 overflow-hidden"
        style={{ backgroundColor: themeColor, height: '180px' }}
      >
        {restaurant.coverImageUrl && (
          <div className="absolute inset-0">
             <Image
                src={restaurant.coverImageUrl}
                alt="Cover"
                fill
                className="object-cover opacity-40"
                priority
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}
        
        <div className="relative h-full flex flex-col justify-end px-4 pb-6 max-w-2xl mx-auto">
          <div className="flex items-end gap-3">
             <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white dark:bg-zinc-900 p-1 shadow-lg flex-shrink-0 -mb-8 z-10">
                {restaurant.logoUrl ? (
                  <div className="relative w-full h-full rounded-lg overflow-hidden">
                     <Image
                        src={restaurant.logoUrl}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                     />
                  </div>
                ) : (
                  <div className="w-full h-full bg-orange-50 dark:bg-orange-950/30 rounded-lg flex items-center justify-center text-orange-600 font-bold text-xl">
                    {restaurant.name?.charAt(0) || '?'}
                  </div>
                )}
             </div>
             
             <div className="flex-1 pb-0.5">
                <h1 className="text-xl sm:text-2xl font-bold mb-0.5 shadow-black/20 text-shadow leading-tight">{restaurant.name}</h1>
                {restaurant.description && (
                  <p className="text-white/90 text-xs line-clamp-1 font-medium">{restaurant.description}</p>
                )}
             </div>
          </div>
        </div>
      </header>

      {/* Info Bar */}
      <div className="bg-white dark:bg-zinc-950 border-b border-gray-100 dark:border-gray-800 px-4 pt-10 pb-3 shadow-sm relative z-0">
        <div className="max-w-2xl mx-auto flex flex-col gap-3">
           <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {formatAddress() && (
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-zinc-900 px-3 py-1.5 rounded-full">
                <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                <span className="truncate max-w-[200px]">{formatAddress()}</span>
              </div>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 px-3 py-1.5 rounded-full text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                <span>{restaurant.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Search & Filter */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-3 shadow-sm transition-all duration-300">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex flex-col gap-4">
            {restaurant.settings?.enableSearch !== false && (
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search for dishes, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-gray-100 dark:bg-zinc-900 border-2 border-transparent focus:border-orange-500/20 focus:ring-4 focus:ring-orange-500/5 focus:bg-white dark:focus:bg-zinc-800 transition-all text-base placeholder:text-gray-400 dark:text-gray-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 bg-gray-100 dark:bg-zinc-900 rounded-2xl p-1.5 flex gap-1 isolate overflow-hidden">
                {/* Sliding Background */}
                <div 
                  className={cn(
                    "absolute inset-y-1.5 left-1.5 w-[calc(33.33%-4px)] bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 ease-in-out -z-10",
                    menuFilter === 'all' && "translate-x-0",
                    menuFilter === 'veg' && "translate-x-[100%]",
                    menuFilter === 'non-veg' && "translate-x-[200%]"
                  )}
                />
                
                <button
                  type="button"
                  onClick={() => setMenuFilter('all')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                    menuFilter === 'all'
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setMenuFilter('veg')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                    menuFilter === 'veg'
                      ? "text-green-600 dark:text-green-500"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Leaf className="w-4 h-4" />
                  Veg
                </button>
                <button
                  type="button"
                  onClick={() => setMenuFilter('non-veg')}
                  className={cn(
                    "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                    menuFilter === 'non-veg'
                      ? "text-red-600 dark:text-red-500"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Beef className="w-4 h-4" />
                  Non-Veg
                </button>
              </div>

              <div className="flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Categories Nav */}
          {filteredCategories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
              {filteredCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => scrollToCategory(category._id)}
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                    ${activeCategory === category._id
                      ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg shadow-gray-900/20 dark:shadow-white/10 scale-105'
                      : 'bg-gray-100 dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-800'}
                  `}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Menu Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20">
             <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
             </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No items found</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
            {menuFilter !== 'all' && (
               <button 
                  onClick={() => setMenuFilter('all')}
                  className="mt-4 text-orange-600 dark:text-orange-400 font-medium text-sm hover:underline"
               >
                  Clear Filters
               </button>
            )}
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category._id}
              id={`category-${category._id}`}
              className="mb-8 scroll-mt-[180px]"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                {category.name}
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                   {category.items.length}
                </span>
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
      <section className="bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-gray-800 py-12 mb-safe">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Rate Your Experience</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">How was your meal? We'd love to hear from you!</p>
          </div>

          <div className="bg-gray-50 dark:bg-zinc-900/50 rounded-2xl p-6 md:p-8 border border-gray-100 dark:border-gray-800">
            <FeedbackForm restaurantId={restaurant._id} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 text-center">
         <div className="inline-flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs font-medium bg-white dark:bg-zinc-950 px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-gray-800">
            <span>Powered by</span>
            <span className="text-gray-600 dark:text-gray-300 font-bold">QR Menu</span>
         </div>
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
      className={`group bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-900/50 hover:shadow-md transition-all duration-300 ${
        !item.isAvailable ? 'opacity-60 grayscale' : ''
      }`}
    >
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1.5">
            {/* Veg/Non-veg indicator */}
            <div
              className={`w-4 h-4 border flex items-center justify-center rounded-sm flex-shrink-0 mt-1 ${
                item.isVeg ? 'border-green-600 dark:border-green-500' : 'border-red-600 dark:border-red-500'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  item.isVeg ? 'bg-green-600 dark:bg-green-500' : 'bg-red-600 dark:bg-red-500'
                }`}
              />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white leading-snug group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
               {item.name}
            </h3>
          </div>
          
           {showPrices && (
            <div className="font-bold text-gray-900 dark:text-white mb-2">
              {formatPrice(item.price, currency)}
            </div>
          )}

          {item.description && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
             {item.isBestseller && (
              <span className="px-2 py-0.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 text-[10px] font-bold uppercase tracking-wide rounded-md border border-yellow-100 dark:border-yellow-900/30">
                ⭐ Bestseller
              </span>
            )}
            {item.isSpicy && (
              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-500 text-[10px] font-bold uppercase tracking-wide rounded-md border border-red-100 dark:border-red-900/30">
                🌶️ Spicy
              </span>
            )}
            {!item.isAvailable && (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[10px] font-bold uppercase tracking-wide rounded-md">
                Sold Out
              </span>
            )}
             {item.variants && item.variants.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-500 text-[10px] font-bold uppercase tracking-wide rounded-md border border-blue-100 dark:border-blue-900/30">
                   {item.variants.length} Options
                </span>
             )}
          </div>
        </div>
        
        {item.imageUrl && (
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 112px, 128px"
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
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
        <p className="text-gray-600 dark:text-gray-400">Your feedback helps us improve.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star Rating */}
      <div className="flex flex-col items-center gap-3">
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
                    ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        <p className="text-sm font-medium h-5">
          {rating > 0 ? (
            <span className="text-orange-600 dark:text-orange-400 animate-in fade-in slide-in-from-bottom-1">
              {['Terrible 😞', 'Bad 😕', 'Okay 😐', 'Good 🙂', 'Excellent 🤩'][rating - 1]}
            </span>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">Tap to rate</span>
          )}
        </p>
      </div>

      {/* Comment */}
      <div className="relative">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none placeholder:text-gray-400 dark:placeholder:text-gray-600 text-sm dark:text-white"
          placeholder="What did you like or dislike? (Optional)"
          maxLength={1000}
        />
        <div className="absolute bottom-2 right-2 text-xs text-gray-300 dark:text-gray-700 pointer-events-none">
           {comment.length}/1000
        </div>
      </div>

      {/* Contact Info (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
          placeholder="Name (Optional)"
          maxLength={50}
        />
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all text-sm dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600"
          placeholder="Phone (Optional)"
          maxLength={20}
        />
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 dark:shadow-white/5 active:scale-95"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
             Submit Feedback <Send className="w-4 h-4 ml-1" />
          </>
        )}
      </button>
    </form>
  );
}
