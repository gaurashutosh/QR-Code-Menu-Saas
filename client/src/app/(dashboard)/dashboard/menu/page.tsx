'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { categoryAPI, menuAPI } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
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
  Check,
} from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { paths } from '@/lib/paths';

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

export default function MenuPage() {
  const router = useRouter();
  const { restaurant, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !restaurant) {
      router.push(paths.dashboard.root);
    }
  }, [authLoading, restaurant, router]);

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
      return catId === categoryId;
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={paths.dashboard.root} className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Menu Management</h1>
                <p className="text-sm text-gray-500">{restaurant?.name}</p>
              </div>
            </div>
            <Button onClick={() => setShowCategoryModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {categories.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Menu Categories Yet</h2>
            <p className="text-gray-600 mb-6">Start by adding a category like Starters, Main Course, or Beverages</p>
            <Button onClick={() => setShowCategoryModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Category
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Category Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => toggleCategory(category._id)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                    {expandedCategories.has(category._id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        {getItemsByCategory(category._id).length} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
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
                        setEditingCategory(category);
                        setShowCategoryModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {expandedCategories.has(category._id) && (
                  <div className="border-t border-gray-100">
                    {getItemsByCategory(category._id).length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        No items in this category.{' '}
                        <button
                          onClick={() => {
                            setSelectedCategoryId(category._id);
                            setEditingItem(null);
                            setShowItemModal(true);
                          }}
                          className="text-orange-600 hover:underline"
                        >
                          Add one now
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {getItemsByCategory(category._id).map((item) => (
                          <div
                            key={item._id}
                            className={`flex items-center justify-between p-4 hover:bg-gray-50 ${
                              !item.isAvailable ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-2 h-2">
                                {item.isVeg ? (
                                  <div className="w-4 h-4 border-2 border-green-600 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-red-600 flex items-center justify-center">
                                    <div className="w-2 h-2 bg-red-600 rounded-full" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                                  {item.isBestseller && (
                                    <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
                                      <Star className="w-3 h-3" /> Bestseller
                                    </span>
                                  )}
                                  {item.isSpicy && <Flame className="w-4 h-4 text-red-500" />}
                                </div>
                                <p className="text-sm text-gray-500">₹{item.price}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <Switch
                                checked={item.isAvailable}
                                onChange={() => handleToggleAvailability(item)}
                              />
                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  const catId = typeof item.category === 'string' ? item.category : item.category?._id;
                                  setSelectedCategoryId(catId || '');
                                  setShowItemModal(true);
                                }}
                                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

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
          itemCount={getItemsByCategory(deletingCategory._id).length}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {category ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Starters, Main Course"
          />

          <Textarea
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this category"
            rows={2}
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {category ? 'Update' : 'Create'}
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {item ? 'Edit Item' : 'Add Item'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Item Image</label>
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
          />

          <Textarea
            label="Description (Optional)"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of this item"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price (₹) *"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="299"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Vegetarian</span>
              </div>
              <input
                type="checkbox"
                name="isVeg"
                checked={formData.isVeg}
                onChange={handleChange}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Flame className="w-5 h-5 text-red-500" />
                <span className="font-medium text-gray-700">Spicy</span>
              </div>
              <input
                type="checkbox"
                name="isSpicy"
                checked={formData.isSpicy}
                onChange={handleChange}
                className="w-5 h-5 text-red-500 rounded focus:ring-red-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="font-medium text-gray-700">Bestseller</span>
              </div>
              <input
                type="checkbox"
                name="isBestseller"
                checked={formData.isBestseller}
                onChange={handleChange}
                className="w-5 h-5 text-yellow-500 rounded focus:ring-yellow-500"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={loading}>
              {item ? 'Update' : 'Create'}
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
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center gap-3 text-red-600 mb-4">
          <Trash2 className="w-6 h-6" />
          <h2 className="text-xl font-bold">Delete Category</h2>
        </div>

        {step === 1 ? (
          <div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{category.name}"</span>? 
              {itemCount > 0 && (
                <> This will also permanently delete <span className="font-bold text-red-600 underline">{itemCount} items</span> associated with it.</>
              )}
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                onClick={() => setStep(2)}
              >
                I understand, proceed
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-4 leading-relaxed">
              To confirm, please type <span className="font-bold text-gray-900 select-all">"{category.name}"</span> in the box below:
            </p>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder="Type category name..."
              className="mb-6 focus:ring-red-500 border-red-100"
              autoFocus
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)} disabled={loading}>
                Back
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                disabled={confirmName !== category.name || loading}
                loading={loading}
                onClick={handleConfirm}
              >
                Delete Category
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
