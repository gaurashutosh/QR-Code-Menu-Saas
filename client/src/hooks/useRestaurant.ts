'use client';

import { useState, useEffect } from 'react';
import { restaurantAPI, categoryAPI, menuAPI } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Category {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

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
  category: { _id: string; name: string };
}

export function useRestaurant() {
  const { restaurant, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRestaurant = async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await restaurantAPI.create(data);
      await refreshUser();
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create restaurant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRestaurant = async (data: any) => {
    if (!restaurant) return;
    setLoading(true);
    setError(null);
    try {
      const response = await restaurantAPI.update(restaurant._id, data);
      await refreshUser();
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update restaurant');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getQRCode = async () => {
    if (!restaurant) return null;
    try {
      const response = await restaurantAPI.getQR(restaurant._id);
      return response.data.data.qrCode;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to get QR code');
      return null;
    }
  };

  return {
    restaurant,
    loading,
    error,
    createRestaurant,
    updateRestaurant,
    getQRCode,
  };
}

export function useMenu() {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    if (!restaurant) return;
    try {
      const response = await categoryAPI.getAll(restaurant._id);
      setCategories(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    }
  };

  const fetchMenuItems = async (filters?: any) => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const response = await menuAPI.getAll(restaurant._id, filters);
      setMenuItems(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurant) {
      fetchCategories();
      fetchMenuItems();
    }
  }, [restaurant]);

  const createCategory = async (data: any) => {
    if (!restaurant) return;
    const response = await categoryAPI.create({ ...data, restaurant: restaurant._id });
    await fetchCategories();
    return response.data;
  };

  const updateCategory = async (id: string, data: any) => {
    const response = await categoryAPI.update(id, data);
    await fetchCategories();
    return response.data;
  };

  const deleteCategory = async (id: string) => {
    await categoryAPI.delete(id);
    await fetchCategories();
  };

  const createMenuItem = async (data: any) => {
    if (!restaurant) return;
    const response = await menuAPI.create({ ...data, restaurant: restaurant._id });
    await fetchMenuItems();
    return response.data;
  };

  const updateMenuItem = async (id: string, data: any) => {
    const response = await menuAPI.update(id, data);
    await fetchMenuItems();
    return response.data;
  };

  const deleteMenuItem = async (id: string) => {
    await menuAPI.delete(id);
    await fetchMenuItems();
  };

  const toggleItemAvailability = async (id: string) => {
    await menuAPI.toggle(id);
    await fetchMenuItems();
  };

  return {
    categories,
    menuItems,
    loading,
    error,
    fetchCategories,
    fetchMenuItems,
    createCategory,
    updateCategory,
    deleteCategory,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleItemAvailability,
  };
}
