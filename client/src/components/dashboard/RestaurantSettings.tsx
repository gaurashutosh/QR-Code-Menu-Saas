'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  Save,
  Store,
  MapPin,
  Phone,
  Globe,
  Settings2,
  Palette,
} from 'lucide-react';

interface RestaurantFull {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  cuisineType?: string[];
  themeColor?: string;
  phone?: string;
  email?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  socialLinks?: {
    website?: string;
    instagram?: string;
    facebook?: string;
  };
  settings?: {
    showOutOfStock?: boolean;
    showPrices?: boolean;
    enableSearch?: boolean;
    enableCategories?: boolean;
  };
}

const CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Chinese',
  'Italian',
  'Mexican',
  'Thai',
  'Japanese',
  'Continental',
  'Fast Food',
  'Beverages',
  'Desserts',
  'Street Food',
  'Multi-Cuisine',
  'Others',
];

const COUNTRY_CODES = [
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'Singapore' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
];

export default function RestaurantSettings() {
  const { restaurant, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    cuisineType: [] as string[],
    customCuisine: '',
    themeColor: '#f97316',
    countryCode: '+91',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
    },
    socialLinks: {
      website: '',
      instagram: '',
      facebook: '',
    },
    settings: {
      showOutOfStock: true,
      showPrices: true,
      enableSearch: true,
      enableCategories: true,
    },
  });

  // Fetch full restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurant?._id) return;
      setFetching(true);
      try {
        const response = await restaurantAPI.getById(restaurant._id);
        const data = response.data.data as RestaurantFull;

        // Handle custom cuisine types that are not in CUISINE_OPTIONS
        const defaultCuisines = data.cuisineType?.filter((c) => CUISINE_OPTIONS.includes(c)) || [];
        const customCuisines = data.cuisineType?.filter((c) => !CUISINE_OPTIONS.includes(c)) || [];
        const finalCuisineType = customCuisines.length > 0 ? [...defaultCuisines, 'Others'] : defaultCuisines;
        const customCuisineString = customCuisines.join(', ');

        // Parse phone number into countryCode and local digits
        let countryCode = '+91';
        let localPhone = data.phone || '';
        const foundCode = COUNTRY_CODES.find((c: any) => localPhone.startsWith(c.code));
        if (foundCode) {
          countryCode = foundCode.code;
          localPhone = localPhone.slice(foundCode.code.length);
        }

        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          cuisineType: finalCuisineType,
          customCuisine: customCuisineString,
          themeColor: data.themeColor || '#f97316',
          countryCode: countryCode,
          phone: localPhone,
          email: data.email || '',
          address: {
            street: data.address?.street || '',
            city: data.address?.city || '',
            state: data.address?.state || '',
            pincode: data.address?.pincode || '',
            country: data.address?.country || 'India',
          },
          socialLinks: {
            website: data.socialLinks?.website || '',
            instagram: data.socialLinks?.instagram || '',
            facebook: data.socialLinks?.facebook || '',
          },
          settings: {
            showOutOfStock: data.settings?.showOutOfStock ?? true,
            showPrices: data.settings?.showPrices ?? true,
            enableSearch: data.settings?.enableSearch ?? true,
            enableCategories: data.settings?.enableCategories ?? true,
          },
        });
      } catch (error) {
        toast.error('Failed to load restaurant data');
      } finally {
        setFetching(false);
      }
    };
    fetchRestaurant();
  }, [restaurant?._id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    let { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    // Strict validations
    // Permissive validations for international support
    if (name === 'phone') {
      // Allow plus sign and digits, max 15 chars
      value = value.replace(/[^\d+]/g, '').slice(0, 15);
    } else if (name === 'address.pincode') {
      // Allow alphanumeric and spaces/dashes, max 10 chars
      value = value.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 10);
    } else if (name === 'address.city' || name === 'address.state') {
      // Allow unicode letters, spaces, dots, dashes, apostrophes
      value = value.replace(/[^\p{L}\s.'-]/u, '');
    } else if (name === 'address.street') {
      value = value.replace(/[^\p{L}0-9\s,.\-']/u, '');
    } else if (name === 'customCuisine') {
      value = value.replace(/[^\p{L}\s,]/u, '');
    }

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, unknown>),
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleCountryCodeChange = (code: string) => {
    const country = COUNTRY_CODES.find(c => c.code === code)?.country || 'India';
    setFormData(prev => ({ 
      ...prev, 
      countryCode: code,
      address: {
        ...prev.address,
        country: country // Sync country name with phone code
      }
    }));
  };

  const handleCuisineToggle = (cuisine: string) => {
    setFormData((prev) => {
      const isSelected = prev.cuisineType.includes(cuisine);
      const isOthers = cuisine === 'Others';

      const nextCuisineType = isSelected
        ? prev.cuisineType.filter((c) => c !== cuisine)
        : [...prev.cuisineType, cuisine];

      return {
        ...prev,
        cuisineType: nextCuisineType,
        customCuisine: isOthers && isSelected ? '' : prev.customCuisine,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    setLoading(true);
    try {
      // Merge custom cuisines if 'Others' is selected
      const customCuisines = formData.cuisineType.includes('Others') && formData.customCuisine.trim()
        ? formData.customCuisine.split(',').map(c => c.trim()).filter(c => c !== '')
        : [];

      const finalCuisineType = formData.cuisineType
        .filter((c) => c !== 'Others')
        .concat(customCuisines);

      const updateData = {
        ...formData,
        cuisineType: finalCuisineType,
        phone: formData.phone ? `${formData.countryCode}${formData.phone}` : '',
        socialLinks: {
          website: formData.socialLinks.website || undefined,
          instagram: formData.socialLinks.instagram || undefined,
          facebook: formData.socialLinks.facebook || undefined,
        }
      };

      await restaurantAPI.update(restaurant._id, updateData);
      toast.success('Settings saved successfully!');
      refreshUser();
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(errorData?.message || 'Failed to save settings');
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Store },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'social', label: 'Social', icon: Globe },
    { id: 'display', label: 'Display', icon: Settings2 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure your restaurant profile and visibility.</p>
        </div>
        <Button onClick={handleSubmit} loading={loading} className="min-h-[44px] rounded-xl shadow-lg shadow-orange-500/20">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-100 dark:border-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Store className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Basic Information
              </h2>
              
              <div className="space-y-6">
                <Input
                  label="Restaurant Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter restaurant name"
                />

                <div>
                  <Input
                    label="Restaurant Handle (URL) *"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="e.g., spicy-treat-mumbai"
                    className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800 p-2 rounded-lg">
                    Public URL: <span className="font-mono text-orange-600 dark:text-orange-400">{typeof window !== 'undefined' ? window.location.origin : ''}/menu/{formData.slug || '...'}</span>
                  </p>
                </div>

                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell customers about your restaurant..."
                  rows={3}
                />

                <div className="pt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Cuisine Types
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CUISINE_OPTIONS.map((cuisine: string) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => handleCuisineToggle(cuisine)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          formData.cuisineType.includes(cuisine)
                            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 transform scale-105'
                            : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                        }`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>

                  {formData.cuisineType.includes('Others') && (
                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Input
                        label="Custom Cuisine Name"
                        name="customCuisine"
                        value={formData.customCuisine}
                        onChange={handleChange}
                        placeholder="e.g., Street Food, Lebanese"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme Color
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <input
                        type="color"
                        name="themeColor"
                        value={formData.themeColor}
                        onChange={handleChange}
                        className="w-14 h-14 rounded-2xl border-2 border-white shadow-md cursor-pointer appearance-none p-0 overflow-hidden"
                      />
                      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 pointer-events-none" />
                    </div>
                    <div className="flex-1">
                      <Input
                        name="themeColor"
                        value={formData.themeColor}
                        onChange={handleChange}
                        placeholder="#f97316"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Contact Details
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={(e) => handleCountryCodeChange(e.target.value)}
                        className="w-[110px] px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                      >
                        {COUNTRY_CODES.map((c: any) => (
                          <option key={c.code} value={c.code} className="bg-white dark:bg-zinc-900">{c.code} ({c.country})</option>
                        ))}
                      </select>
                      <Input
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contact@restaurant.com"
                  />
                </div>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400 font-medium">Location</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Street Address"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="City"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                    />

                    <Input
                      label="State"
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Pincode"
                      name="address.pincode"
                      value={formData.address.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                    />

                    <Input
                      label="Country"
                      name="address.country"
                      value={formData.address.country}
                      onChange={handleChange}
                      placeholder="India"
                      readOnly
                      className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Social Links Tab */}
        {activeTab === 'social' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Online Presence
              </h2>
              
              <div className="space-y-6">
                <Input
                  label="Website URL"
                  name="socialLinks.website"
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={handleChange}
                  placeholder="https://yourrestaurant.com"
                />

                <Input
                  label="Instagram URL"
                  name="socialLinks.instagram"
                  type="url"
                  value={formData.socialLinks.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/yourrestaurant"
                />

                <Input
                  label="Facebook URL"
                  name="socialLinks.facebook"
                  type="url"
                  value={formData.socialLinks.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/yourrestaurant"
                />
              </div>
            </div>
          </div>
        )}

        {/* Display Settings Tab */}
        {activeTab === 'display' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-2 duration-300">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-gray-400 dark:text-gray-500" /> Menu Configuration
              </h2>
              
              <div className="grid grid-cols-1 gap-4">
                <ToggleSetting
                  label="Show Prices"
                  description="Display item prices on your public menu"
                  name="settings.showPrices"
                  checked={formData.settings.showPrices}
                  onChange={handleChange}
                />

                <ToggleSetting
                  label="Show Out of Stock Items"
                  description="Keep unavailable items visible but grayed out"
                  name="settings.showOutOfStock"
                  checked={formData.settings.showOutOfStock}
                  onChange={handleChange}
                />

                <ToggleSetting
                  label="Enable Search"
                  description="Allow customers to search for items"
                  name="settings.enableSearch"
                  checked={formData.settings.enableSearch}
                  onChange={handleChange}
                />

                <ToggleSetting
                  label="Enable Category Navigation"
                  description="Show category tabs at the top of the menu"
                  name="settings.enableCategories"
                  checked={formData.settings.enableCategories}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  name,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-950/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-800">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
      <div className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 dark:bg-zinc-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-900/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-zinc-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
      </div>
    </label>
  );
}
