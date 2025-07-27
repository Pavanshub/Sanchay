import { useState } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import { supabase, Category } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface BulkTier {
  min_quantity: number;
  price_per_unit: number;
}

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
}

export const AddInventoryModal = ({ isOpen, onClose, onSuccess, categories }: AddInventoryModalProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    name_hindi: '',
    description: '',
    category_id: '',
    unit: 'kg',
    base_price: '',
    minimum_quantity: '1',
    photo_url: '',
  });
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>([
    { min_quantity: 10, price_per_unit: 0 },
    { min_quantity: 25, price_per_unit: 0 },
    { min_quantity: 50, price_per_unit: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAICategorization = async () => {
    if (!formData.name) {
      toast.error('Please enter product name first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-categorizer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: formData.name,
          description: formData.description,
        }),
      });

      if (!response.ok) throw new Error('AI categorization failed');

      const result = await response.json();
      
      // Find matching category
      const matchingCategory = categories.find(cat => 
        cat.name.toLowerCase().includes(result.category.toLowerCase()) ||
        result.category.toLowerCase().includes(cat.name.toLowerCase())
      );

      if (matchingCategory) {
        setFormData(prev => ({ ...prev, category_id: matchingCategory.id }));
      }

      // Update bulk tiers with AI suggestions
      if (result.bulk_tiers && result.bulk_tiers.length > 0) {
        const basePrice = parseFloat(formData.base_price) || 0;
        const suggestedTiers = result.bulk_tiers.map((tier: any) => ({
          min_quantity: tier.min_quantity,
          price_per_unit: basePrice * (1 - tier.discount_percentage / 100),
        }));
        setBulkTiers(suggestedTiers);
      }

      toast.success('AI suggestions applied!');
    } catch (error: any) {
      console.error('AI categorization error:', error);
      toast.error('AI categorization failed, but you can continue manually');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Insert inventory item
      const { data: inventoryItem, error: inventoryError } = await supabase
        .from('inventory')
        .insert({
          supplier_id: profile.id,
          category_id: formData.category_id,
          name: formData.name,
          name_hindi: formData.name_hindi || null,
          description: formData.description || null,
          photo_url: formData.photo_url || null,
          unit: formData.unit,
          base_price: parseFloat(formData.base_price),
          minimum_quantity: parseInt(formData.minimum_quantity),
        })
        .select()
        .single();

      if (inventoryError) throw inventoryError;

      // Insert bulk tiers
      const validTiers = bulkTiers.filter(tier => 
        tier.min_quantity > 0 && tier.price_per_unit > 0
      );

      if (validTiers.length > 0) {
        const { error: tiersError } = await supabase
          .from('bulk_tiers')
          .insert(
            validTiers.map(tier => ({
              inventory_id: inventoryItem.id,
              min_quantity: tier.min_quantity,
              price_per_unit: tier.price_per_unit,
            }))
          );

        if (tiersError) throw tiersError;
      }

      toast.success('Product added successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        name: '',
        name_hindi: '',
        description: '',
        category_id: '',
        unit: 'kg',
        base_price: '',
        minimum_quantity: '1',
        photo_url: '',
      });
      setBulkTiers([
        { min_quantity: 10, price_per_unit: 0 },
        { min_quantity: 25, price_per_unit: 0 },
        { min_quantity: 50, price_per_unit: 0 },
      ]);
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast.error(error.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const updateBulkTier = (index: number, field: keyof BulkTier, value: number) => {
    setBulkTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Add New Product</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basmati Rice"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hindi Name
                </label>
                <Input
                  type="text"
                  value={formData.name_hindi}
                  onChange={(e) => setFormData({ ...formData, name_hindi: e.target.value })}
                  placeholder="e.g., बासमती चावल"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the product..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAICategorization}
                    disabled={aiLoading || !formData.name}
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🤖'}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click 🤖 for AI-powered categorization
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo URL
                </label>
                <Input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Pricing Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="kg">Kilogram (kg)</option>
                  <option value="g">Gram (g)</option>
                  <option value="l">Liter (l)</option>
                  <option value="ml">Milliliter (ml)</option>
                  <option value="piece">Piece</option>
                  <option value="dozen">Dozen</option>
                  <option value="packet">Packet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (₹) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Quantity *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.minimum_quantity}
                  onChange={(e) => setFormData({ ...formData, minimum_quantity: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Bulk Pricing Tiers */}
          <div className="space-y-4">
            <h3 className="text-md font-medium text-gray-900">Bulk Pricing Tiers</h3>
            <p className="text-sm text-gray-600">
              Set discounted prices for bulk orders to encourage group buying
            </p>
            
            <div className="space-y-3">
              {bulkTiers.map((tier, index) => (
                <div key={index} className="grid grid-cols-2 gap-4 p-3 border rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Minimum Quantity
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={tier.min_quantity}
                      onChange={(e) => updateBulkTier(index, 'min_quantity', parseInt(e.target.value) || 0)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Price per {formData.unit} (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tier.price_per_unit}
                      onChange={(e) => updateBulkTier(index, 'price_per_unit', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};