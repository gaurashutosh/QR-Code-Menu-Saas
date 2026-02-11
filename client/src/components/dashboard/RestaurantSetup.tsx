'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { restaurantAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import {
  Utensils,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  Palette,
} from 'lucide-react';

const CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Chinese',
  'Italian',
  'Continental',
  'Mexican',
  'Thai',
  'Japanese',
  'Fast Food',
  'Desserts',
  'Beverages',
  'Multi-Cuisine',
  'Others',
];

const COUNTRY_CODES = [
  { code: '+91', country: 'India', label: '+91 (India)' },
  { code: '+1', country: 'USA', label: '+1 (USA)' },
  { code: '+1', country: 'Canada', label: '+1 (Canada)' },
  { code: '+44', country: 'UK', label: '+44 (UK)' },
  { code: '+61', country: 'Australia', label: '+61 (Australia)' },
  { code: '+971', country: 'UAE', label: '+971 (UAE)' },
  { code: '+65', country: 'Singapore', label: '+65 (Singapore)' },
  { code: '+49', country: 'Germany', label: '+49 (Germany)' },
  { code: '+33', country: 'France', label: '+33 (France)' },
];

export default function RestaurantSetup({ onComplete }: { onComplete?: () => void }) {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    cuisineType: [] as string[],
    customCuisine: '',
    themeColor: '#f97316',
    // Contact
    countryCode: '+91',
    phone: '',
    email: '',
    // Address
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    // Social Links
    website: '',
    instagram: '',
    facebook: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Permissive validations
    if (name === 'phone') {
      const safe = value.replace(/[^\d+]/g, '').slice(0, 15);
      setFormData((prev) => ({ ...prev, [name]: safe }));
      return;
    }

    if (name === 'pincode') {
      const safe = value.replace(/[^a-zA-Z0-9\s-]/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: safe }));
      return;
    }

    if (name === 'city' || name === 'state') {
      const safe = value.replace(/[^\p{L}\s.'-]/u, '');
      setFormData((prev) => ({ ...prev, [name]: safe }));
      return;
    }

    if (name === 'street') {
      const safe = value.replace(/[^\p{L}0-9\s,.\-']/u, '');
      setFormData((prev) => ({ ...prev, [name]: safe }));
      return;
    }

    if (name === 'customCuisine') {
      const safe = value.replace(/[^\p{L}\s,]/u, '');
      setFormData((prev) => ({ ...prev, [name]: safe }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const [code, country] = value.split('::');
    
    setFormData(prev => ({ 
      ...prev, 
      countryCode: code,
      country: country || 'India'
    }));
  };

  const toggleCuisine = (cuisine: string) => {
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

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    setLoading(true);
    try {
      const customCuisines = formData.cuisineType.includes('Others') && formData.customCuisine.trim()
        ? formData.customCuisine.split(',').map(c => c.trim()).filter(c => c !== '')
        : [];

      const finalCuisineType = formData.cuisineType
        .filter((c) => c !== 'Others')
        .concat(customCuisines);

      const payload = {
        name: formData.name,
        description: formData.description,
        cuisineType: finalCuisineType,
        themeColor: formData.themeColor,
        phone: formData.phone ? `${formData.countryCode}${formData.phone}` : '',
        email: formData.email,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: formData.country,
        },
        socialLinks: {
          website: formData.website || undefined,
          instagram: formData.instagram || undefined,
          facebook: formData.facebook || undefined,
        },
      };

      await restaurantAPI.create(payload);
      toast.success('Restaurant created successfully!');
      await refreshUser();
      if (onComplete) {
        onComplete();
      }
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.errors && Array.isArray(errorData.errors)) {
        errorData.errors.forEach((msg: string) => toast.error(msg));
      } else {
        toast.error(errorData?.message || 'Failed to create restaurant');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 py-8 px-4 animate-fade-in transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Set Up Your Restaurant</h1>
          <p className="text-gray-500 dark:text-gray-400">Complete the setup to launch your digital menu</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  s === step
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md transform scale-110'
                    : s < step
                    ? 'bg-green-500 text-white shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all duration-500 ${
                    s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 p-6 md:p-8 border border-gray-100 dark:border-gray-800 transition-all duration-300">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about your restaurant</p>
                </div>
              </div>

              <Input
                label="Restaurant Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., The Spice Garden"
                autoComplete="organization"
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="A brief description of your restaurant..."
                rows={3}
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Cuisine Type (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.cuisineType.includes(cuisine)
                          ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 transform scale-105'
                          : 'bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
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
                      className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme Color
                  </div>
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative group cursor-pointer">
                    <input
                      type="color"
                      name="themeColor"
                      value={formData.themeColor}
                      onChange={handleChange}
                      className="w-14 h-14 rounded-2xl border-2 border-white dark:border-zinc-800 shadow-md cursor-pointer appearance-none p-0 overflow-hidden"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Preview</p>
                     <div className="h-10 rounded-xl flex items-center px-4 text-white font-medium text-sm transition-colors" style={{ backgroundColor: formData.themeColor }}>
                        {formData.name || 'Restaurant Name'}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contact & Address</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">How can customers reach you?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <div className="flex gap-2">
                    <select
                      name="countryCode"
                      value={`${formData.countryCode}::${formData.country}`}
                      onChange={handleCountryCodeChange}
                      className="w-[140px] px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all text-sm"
                    >
                      {COUNTRY_CODES.map((c, i) => (
                        <option key={i} value={`${c.code}::${c.country}`} className="bg-white dark:bg-zinc-900">{c.label}</option>
                      ))}
                    </select>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      autoComplete="tel"
                      className="flex-1 dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
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
                  autoComplete="email"
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />
              </div>

               <Input
                label="Street Address"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Main Street"
                autoComplete="street-address"
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  autoComplete="address-level2"
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  autoComplete="address-level1"
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />
                <Input
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="Zip"
                  autoComplete="postal-code"
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />
                <Input
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  readOnly
                  className="bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-orange-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Online Presence</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Connect your social profiles (optional)</p>
                </div>
              </div>

              <Input
                label="Website URL"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.yourrestaurant.com"
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

              <Input
                label="Instagram URL"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/yourrestaurant"
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

              <Input
                label="Facebook URL"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/yourrestaurant"
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

              <div className="mt-8 p-5 bg-gray-50/80 dark:bg-zinc-950/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500" /> Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Restaurant Name</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{formData.name || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Cuisine Types</span>
                    <span className="font-medium text-gray-900 dark:text-white text-right max-w-[200px] truncate">
                      {formData.cuisineType.length > 0
                        ? formData.cuisineType
                            .filter(c => c !== 'Others')
                            .concat(formData.cuisineType.includes('Others') && formData.customCuisine ? formData.customCuisine.split(',').map(c => c.trim()).filter(c => c !== '') : [])
                            .join(', ') || 'Not set'
                        : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Location</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formData.city && formData.state
                        ? `${formData.city}, ${formData.state}`
                        : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="min-w-[120px] rounded-xl shadow-lg shadow-orange-500/20">
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading} className="min-w-[140px] rounded-xl shadow-lg shadow-orange-500/20">
                Create Restaurant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
