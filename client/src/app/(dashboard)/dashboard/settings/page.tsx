'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Save,
  Store,
  MapPin,
  Phone,
  Globe,
  Palette,
  Settings2,
} from 'lucide-react';
import { paths } from '@/lib/paths';

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

export default function SettingsPage() {
  const router = useRouter();
  const { restaurant, refreshUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [activeTab, setActiveTab] = useState('basic');
  const [fullRestaurant, setFullRestaurant] = useState<RestaurantFull | null>(null);

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

  useEffect(() => {
    if (!authLoading && !restaurant) {
      router.push(paths.dashboard.root);
    }
  }, [authLoading, restaurant, router]);

  // Fetch full restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurant?._id) return;
      setFetching(true);
      try {
        const response = await restaurantAPI.getById(restaurant._id);
        const data = response.data.data as RestaurantFull;
        setFullRestaurant(data);

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
    if (name === 'phone') {
      value = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'address.pincode') {
      value = value.replace(/\D/g, '').slice(0, 6);
    } else if (name === 'address.city' || name === 'address.state') {
      value = value.replace(/[^a-zA-Z\s]/g, '');
    } else if (name === 'address.street') {
      value = value.replace(/[^a-zA-Z0-9\s,.-]/g, '');
    } else if (name === 'customCuisine') {
      value = value.replace(/[^a-zA-Z\s,]/g, '');
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

  if (authLoading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: Store },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'social', label: 'Social Links', icon: Globe },
    { id: 'display', label: 'Display', icon: Settings2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={paths.dashboard.root} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Restaurant Settings</h1>
                <p className="text-sm text-gray-500">{restaurant?.name}</p>
              </div>
            </div>
              <Link
                href={paths.dashboard.feedback}
                className="mr-3 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
              >
                Send Feedback
              </Link>
              <Button onClick={handleSubmit} loading={loading}>
                <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
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
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Your menu will be available at:{' '}
                      <span className="font-mono text-orange-600 bg-orange-50 px-1 rounded">
                        {typeof window !== 'undefined' ? window.location.origin : ''}/menu/{formData.slug || '...'}
                      </span>
                    </p>
                  </div>

                  <Textarea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of your restaurant"
                    rows={3}
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cuisine Types
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((cuisine: string) => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => handleCuisineToggle(cuisine)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                            formData.cuisineType.includes(cuisine)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                          placeholder="e.g., Street Food, Lebanese, etc."
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Theme Color
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="themeColor"
                        value={formData.themeColor}
                        onChange={handleChange}
                        className="w-12 h-12 rounded-xl border border-gray-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        name="themeColor"
                        value={formData.themeColor}
                        onChange={handleChange}
                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="#f97316"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contact Tab */}
          {activeTab === 'contact' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact & Address</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={(e) => handleCountryCodeChange(e.target.value)}
                          className="w-[120px] px-2 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                        >
                          {COUNTRY_CODES.map((c: any) => (
                            <option key={c.code} value={c.code}>{c.code} ({c.country})</option>
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
                      <p className="mt-1 text-xs text-gray-500">Exactly 10 digits required</p>
                    </div>

                    <Input
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@restaurant.com"
                    />
                  </div>

                  <hr className="my-4" />

                  <h3 className="font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address
                  </h3>

                  <Input
                    label="Street Address"
                    name="address.street"
                    value={formData.address.street}
                    onChange={handleChange}
                    placeholder="123 Main Street"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Social Links Tab */}
          {activeTab === 'social' && (
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Links</h2>
                
                <div className="space-y-4">
                  <Input
                    label="Website"
                    name="socialLinks.website"
                    type="url"
                    value={formData.socialLinks.website}
                    onChange={handleChange}
                    placeholder="https://yourrestaurant.com"
                  />

                  <Input
                    label="Instagram"
                    name="socialLinks.instagram"
                    type="url"
                    value={formData.socialLinks.instagram}
                    onChange={handleChange}
                    placeholder="https://instagram.com/yourrestaurant"
                  />

                  <Input
                    label="Facebook"
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
            <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Display Settings</h2>
                <p className="text-gray-600 text-sm mb-6">
                  Control how your menu appears to customers.
                </p>
                
                <div className="space-y-4">
                  <ToggleSetting
                    label="Show Prices"
                    description="Display prices on your public menu"
                    name="settings.showPrices"
                    checked={formData.settings.showPrices}
                    onChange={handleChange}
                  />

                  <ToggleSetting
                    label="Show Out of Stock Items"
                    description="Display unavailable items (grayed out)"
                    name="settings.showOutOfStock"
                    checked={formData.settings.showOutOfStock}
                    onChange={handleChange}
                  />

                  <ToggleSetting
                    label="Enable Search"
                    description="Allow customers to search menu items"
                    name="settings.enableSearch"
                    checked={formData.settings.enableSearch}
                    onChange={handleChange}
                  />

                  <ToggleSetting
                    label="Enable Category Navigation"
                    description="Show category tabs for quick navigation"
                    name="settings.enableCategories"
                    checked={formData.settings.enableCategories}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile Save Button */}
          <div className="mt-6 md:hidden">
            <Button type="submit" className="w-full" loading={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </main>
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
    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
      <div>
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
      />
    </label>
  );
}
