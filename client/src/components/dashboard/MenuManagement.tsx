'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { categoryAPI, menuAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import toast from 'react-hot-toast';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  Utensils,
  Leaf,
  Flame,
  Star,
  X,
  Search,
} from 'lucide-react';
import { Switch } from '@/components/ui/Switch';

interface Category {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

interface MenuItem {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: { _id: string; name: string } | string;
  isVeg: boolean;
  isAvailable: boolean;
  isFeatured: boolean;
  isSpicy: boolean;
  isBestseller: boolean;
  imageUrl?: string;
}

export default function MenuManagement() {
  const { restaurant } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    if (restaurant) {
      fetchData();
    }
  }, [restaurant]);

  const fetchData = async () => {
    if (!restaurant) return;
    setLoading(true);
    try {
      const [catRes, itemRes] = await Promise.all([
        categoryAPI.getAll(restaurant._id),
        menuAPI.getAll(restaurant._id),
      ]);
      setCategories(catRes.data.data);
      setMenuItems(itemRes.data.data);
      // Expand all categories by default
      setExpandedCategories(new Set(catRes.data.data.map((c: Category) => c._id)));
    } catch (error) {
      toast.error('Failed to load menu data');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter((item) => {
      const catId = typeof item.category === 'string' ? item.category : item.category?._id;
      const matchesCategory = catId === categoryId;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const handleDeleteCategory = async (category: Category) => {
    setDeletingCategory(category);
    setShowDeleteModal(true);
  };

  const handleDeleteItem = async (item: MenuItem) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await menuAPI.delete(item._id);
      toast.success('Item deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete item');
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      await menuAPI.toggle(item._id);
      toast.success(item.isAvailable ? 'Item marked unavailable' : 'Item marked available');
      fetchData();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Menu Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organize your categories and menu items.</p>
        </div>
        <Button onClick={() => setShowCategoryModal(true)} className="min-h-[44px] sm:min-h-0 rounded-xl shadow-lg shadow-orange-500/20">
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search & Filter - Could extend this later */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input 
          placeholder="Search items..." 
          className="pl-10 h-12 bg-white dark:bg-zinc-900 border-gray-200 dark:border-gray-800 focus:border-orange-500 rounded-xl shadow-sm dark:text-gray-100"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 sm:p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Menu Categories Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">Start by adding a category like Starters, Main Course, or Beverages to organize your menu.</p>
            <Button onClick={() => setShowCategoryModal(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Category
            </Button>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category._id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-all hover:shadow-md">
              {/* Category Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={() => toggleCategory(category._id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" onClick={(e) => e.stopPropagation()}>
                    <GripVertical className="w-5 h-5" />
                  </div>
                  {expandedCategories.has(category._id) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{category.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getItemsByCategory(category._id).length} items
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                    onClick={() => {
                      setSelectedCategoryId(category._id);
                      setEditingItem(null);
                      setShowItemModal(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Item
                  </Button>
                  <button
                    onClick={() => {
                      setSelectedCategoryId(category._id);
                      setEditingItem(null);
                      setShowItemModal(true);
                    }}
                    className="sm:hidden p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowCategoryModal(true);
                    }}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              {expandedCategories.has(category._id) && (
                <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-zinc-950/30">
                  {getItemsByCategory(category._id).length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <p>No items match your search in this category.</p> 
                      {searchQuery === '' && (
                        <button
                          onClick={() => {
                            setSelectedCategoryId(category._id);
                            setEditingItem(null);
                            setShowItemModal(true);
                          }}
                          className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-medium mt-2 inline-flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add your first item
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {getItemsByCategory(category._id).map((item) => (
                        <div
                          key={item._id}
                          className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white dark:hover:bg-zinc-900 transition-colors gap-4 ${
                            !item.isAvailable ? 'opacity-60 bg-gray-50 dark:bg-zinc-950' : ''
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Veg/Non-veg Indicator */}
                            <div className="mt-1 flex-shrink-0">
                              {item.isVeg ? (
                                <div className="w-4 h-4 border border-green-600 dark:border-green-500 flex items-center justify-center bg-white dark:bg-black" title="Vegetarian">
                                  <div className="w-2 h-2 bg-green-600 dark:bg-green-500 rounded-full" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 border border-red-600 dark:border-red-500 flex items-center justify-center bg-white dark:bg-black" title="Non-Vegetarian">
                                  <div className="w-2 h-2 bg-red-600 dark:bg-red-500 rounded-full" />
                                </div>
                              )}
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium text-gray-900 dark:text-white capitalize group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{item.name}</h4>
                                {item.isBestseller && (
                                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] uppercase tracking-wider font-bold rounded-full flex items-center gap-1 border border-amber-200 dark:border-amber-900/50">
                                    <Star className="w-3 h-3 fill-amber-700 dark:fill-amber-400" /> Bestseller
                                  </span>
                                )}
                                {item.isSpicy && (
                                  <span title="Spicy">
                                    <Flame className="w-4 h-4 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">₹{item.price}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2 sm:gap-4 pl-8 sm:pl-0">
                             <div className="flex items-center gap-2" title="Availability">
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 sm:hidden">Available</span>
                                <Switch
                                  checked={item.isAvailable}
                                  onChange={() => handleToggleAvailability(item)}
                                  className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-600"
                                />
                             </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  const catId = typeof item.category === 'string' ? item.category : item.category?._id;
                                  setSelectedCategoryId(catId || '');
                                  setShowItemModal(true);
                                }}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                                aria-label="Edit item"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                                aria-label="Delete item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          restaurantId={restaurant?._id || ''}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
          }}
          onSave={() => {
            setShowCategoryModal(false);
            setEditingCategory(null);
            fetchData();
          }}
        />
      )}

      {/* Item Modal */}
      {showItemModal && (
        <ItemModal
          item={editingItem}
          categoryId={selectedCategoryId}
          restaurantId={restaurant?._id || ''}
          categories={categories}
          onClose={() => {
            setShowItemModal(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowItemModal(false);
            setEditingItem(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Category Modal */}
      {showDeleteModal && deletingCategory && (
        <DeleteCategoryModal
          category={deletingCategory}
          itemCount={menuItems.filter((item) => {
            const catId = typeof item.category === 'string' ? item.category : item.category?._id;
            return catId === deletingCategory._id;
          }).length}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingCategory(null);
          }}
          onConfirm={async () => {
            try {
              await categoryAPI.delete(deletingCategory._id);
              toast.success('Category and all its items deleted');
              setShowDeleteModal(false);
              setDeletingCategory(null);
              fetchData();
            } catch (error: any) {
              toast.error(error.response?.data?.message || 'Failed to delete category');
            }
          }}
        />
      )}
    </div>
  );
}

// Category Modal Component
function CategoryModal({
  category,
  restaurantId,
  onClose,
  onSave,
}: {
  category: Category | null;
  restaurantId: string;
  onClose: () => void;
  onSave: () => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setLoading(true);
    try {
      if (category) {
        await categoryAPI.update(category._id, { name, description });
        toast.success('Category updated');
      } else {
        await categoryAPI.create({ restaurant: restaurantId, name, description });
        toast.success('Category created');
      }
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Starters, Main Course"
            className="dark:bg-zinc-900 dark:border-gray-800 dark:text-white"
          />

          <Textarea
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this category"
            rows={3}
            className="dark:bg-zinc-900 dark:border-gray-800 dark:text-white"
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {category ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Item Modal Component
function ItemModal({
  item,
  categoryId,
  restaurantId,
  categories,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  categoryId: string;
  restaurantId: string;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    description: item?.description || '',
    price: item?.price?.toString() || '',
    category: categoryId,
    isVeg: item?.isVeg ?? true,
    isSpicy: item?.isSpicy ?? false,
    isBestseller: item?.isBestseller ?? false,
    imageUrl: item?.imageUrl || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        restaurant: restaurantId,
        category: formData.category,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        isVeg: formData.isVeg,
        isSpicy: formData.isSpicy,
        isBestseller: formData.isBestseller,
        imageUrl: formData.imageUrl,
      };

      if (item) {
        await menuAPI.update(item._id, payload);
        toast.success('Item updated');
      } else {
        await menuAPI.create(payload);
        toast.success('Item created');
      }
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {item ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Item Image</label>
            <ImageUpload
              value={formData.imageUrl}
              onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
              type="menu-item"
              aspectRatio="wide"
            />
          </div>

          <Input
            label="Item Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Paneer Tikka"
            className="dark:bg-zinc-900 dark:border-gray-800 dark:text-white"
          />

          <Textarea
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of this item"
            rows={2}
            className="dark:bg-zinc-900 dark:border-gray-800 dark:text-white"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹) *"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="299"
              className="dark:bg-zinc-900 dark:border-gray-800 dark:text-white"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white dark:bg-zinc-900 dark:text-white transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-green-600 dark:text-green-500" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Vegetarian</span>
              </div>
              <input
                type="checkbox"
                name="isVeg"
                checked={formData.isVeg}
                onChange={handleChange}
                className="w-5 h-5 text-green-600 dark:text-green-500 rounded focus:ring-green-500 dark:bg-zinc-950 dark:border-gray-800"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-red-500 dark:text-red-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Spicy</span>
              </div>
              <input
                type="checkbox"
                name="isSpicy"
                checked={formData.isSpicy}
                onChange={handleChange}
                className="w-5 h-5 text-red-500 dark:text-red-400 rounded focus:ring-red-500 dark:bg-zinc-950 dark:border-gray-800"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">Bestseller</span>
              </div>
              <input
                type="checkbox"
                name="isBestseller"
                checked={formData.isBestseller}
                onChange={handleChange}
                className="w-5 h-5 text-yellow-500 dark:text-yellow-400 rounded focus:ring-yellow-500 dark:bg-zinc-950 dark:border-gray-800"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {item ? 'Update Item' : 'Create Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Category Modal (GitHub Style)
function DeleteCategoryModal({
  category,
  itemCount,
  onClose,
  onConfirm,
}: {
  category: Category;
  itemCount: number;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [step, setStep] = useState(1);
  const [confirmName, setConfirmName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-4">
          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded-full">
            <Trash2 className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Delete Category?</h2>
        </div>

        {step === 1 ? (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">"{category.name}"</span>? 
              {itemCount > 0 && (
                <> This will also <span className="text-red-600 dark:text-red-400 font-semibold">permanently delete {itemCount} items</span> associated with it.</>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
              To confirm, please type <span className="font-bold text-gray-900 dark:text-white select-all">"{category.name}"</span> below:
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Type category name..."
              className="mb-6 focus:ring-red-500 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 dark:text-white"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1"
                disabled={confirmName !== category.name || loading}
                loading={loading}
                onClick={handleConfirm}
              >
                Delete Forever
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
