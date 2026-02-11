'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { restaurantAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Utensils,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Globe,
  Palette,
} from 'lucide-react';
import { paths } from '@/lib/paths';

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
  { code: '+91', country: 'India' },
  { code: '+1', country: 'USA/Canada' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'Australia' },
  { code: '+971', country: 'UAE' },
  { code: '+65', country: 'Singapore' },
  { code: '+49', country: 'Germany' },
  { code: '+33', country: 'France' },
];

export default function SetupPage() {
  const router = useRouter();
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
    
    // Strict validations
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    if (name === 'pincode') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
      return;
    }

    if (name === 'city' || name === 'state') {
      const alphaOnly = value.replace(/[^a-zA-Z\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: alphaOnly }));
      return;
    }

    if (name === 'street') {
      const alphanumericOnly = value.replace(/[^a-zA-Z0-9\s,.-]/g, ''); // Allowing common address chars but removing others
      setFormData((prev) => ({ ...prev, [name]: alphanumericOnly }));
      return;
    }

    if (name === 'customCuisine') {
      const safeText = value.replace(/[^a-zA-Z\s,]/g, ''); // Allowing commas
      setFormData((prev) => ({ ...prev, [name]: safeText }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryCodeChange = (code: string) => {
    const country = COUNTRY_CODES.find(c => c.code === code)?.country || 'India';
    setFormData(prev => ({ 
      ...prev, 
      countryCode: code,
      country: country // Sync country name with phone code
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
        // Clear customCuisine if Others is untoggled
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
      // Merge custom cuisines if 'Others' is selected
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
      router.push(paths.dashboard.root);
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Up Your Restaurant</h1>
          <p className="text-gray-600">Complete the setup to create your digital menu</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  s === step
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-1 transition-all ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Utensils className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
                  <p className="text-sm text-gray-500">Tell us about your restaurant</p>
                </div>
              </div>

              <Input
                label="Restaurant Name *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., The Spice Garden"
              />

              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="A brief description of your restaurant..."
                rows={3}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => toggleCuisine(cuisine)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        formData.cuisineType.includes(cuisine)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                  <Palette className="w-4 h-4 inline mr-1" />
                  Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    name="themeColor"
                    value={formData.themeColor}
                    onChange={handleChange}
                    className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                  />
                  <span className="text-gray-600">{formData.themeColor}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contact & Address */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Contact & Address</h2>
                  <p className="text-sm text-gray-500">How can customers reach you?</p>
                </div>
              </div>

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
                      {COUNTRY_CODES.map(c => (
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

              <Input
                label="Street Address"
                name="street"
                value={formData.street}
                onChange={handleChange}
                placeholder="123 Main Street"
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                />
                <Input
                  label="State"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                />
                <Input
                  label="Pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                />
                <Input
                  label="Country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="India"
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* Step 3: Social Links */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Online Presence</h2>
                  <p className="text-sm text-gray-500">Connect your social profiles (optional)</p>
                </div>
              </div>

              <Input
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.yourrestaurant.com"
              />

              <Input
                label="Instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="https://instagram.com/yourrestaurant"
              />

              <Input
                label="Facebook"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="https://facebook.com/yourrestaurant"
              />

              {/* Summary */}
              <div className="mt-8 p-4 bg-gray-50 rounded-xl">
                <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">Restaurant:</span>{' '}
                    <span className="font-medium">{formData.name || 'Not set'}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Cuisine:</span>{' '}
                    <span className="font-medium">
                      {formData.cuisineType.length > 0
                        ? formData.cuisineType
                            .filter(c => c !== 'Others')
                            .concat(formData.cuisineType.includes('Others') && formData.customCuisine ? formData.customCuisine.split(',').map(c => c.trim()).filter(c => c !== '') : [])
                            .join(', ') || 'Not set'
                        : 'Not set'}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Location:</span>{' '}
                    <span className="font-medium">
                      {formData.city && formData.state
                        ? `${formData.city}, ${formData.state}`
                        : 'Not set'}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={loading}>
                Create Restaurant
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
