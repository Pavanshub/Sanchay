import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { supabase, InventoryItem, Category } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface BulkTier {
  id?: string;
  min_quantity: number;
  price_per_unit: number;
}

interface EditInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: InventoryItem;
  categories: Category[];
}

export const EditInventoryModal = ({ isOpen, onClose, onSuccess, item, categories }: EditInventoryModalProps) => {
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
  const [bulkTiers, setBulkTiers] = useState<BulkTier[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        name_hindi: item.name_hindi || '',
        description: item.description || '',
        category_id: item.category_id,
        unit: item.unit,
        base_price: item.base_price.toString(),
        minimum_quantity: item.minimum_quantity.toString(),
        photo_url: item.photo_url || '',
      });

      setBulkTiers(item.bulk_tiers?.map(tier => ({
        id: tier.id,
        min_quantity: tier.min_quantity,
        price_per_unit: tier.price_per_unit,
      })) || []);
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update inventory item
      const { error: inventoryError } = await supabase
        .from('inventory')
        .update({
          name: formData.name,
          name_hindi: formData.name_hindi || null,
          description: formData.description || null,
          category_id: formData.category_id,
          unit: formData.unit,
          base_price: parseFloat(formData.base_price),
          minimum_quantity: parseInt(formData.minimum_quantity),
          photo_url: formData.photo_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      if (inventoryError) throw inventoryError;

      // Delete existing bulk tiers
      const { error: deleteError } = await supabase
        .from('bulk_tiers')
        .delete()
        .eq('inventory_id', item.id);

      if (deleteError) throw deleteError;

      // Insert updated bulk tiers
      const validTiers = bulkTiers.filter(tier => 
        tier.min_quantity > 0 && tier.price_per_unit > 0
      );

      if (validTiers.length > 0) {
        const { error: tiersError } = await supabase
          .from('bulk_tiers')
          .insert(
            validTiers.map(tier => ({
              inventory_id: item.id,
              min_quantity: tier.min_quantity,
              price_per_unit: tier.price_per_unit,
            }))
          );

        if (tiersError) throw tiersError;
      }

      toast.success('Product updated successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error(error.message || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const updateBulkTier = (index: number, field: keyof BulkTier, value: number) => {
    setBulkTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ));
  };

  const addBulkTier = () => {
    setBulkTiers(prev => [...prev, { min_quantity: 0, price_per_unit: 0 }]);
  };

  const removeBulkTier = (index: number) => {
    setBulkTiers(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Edit Product</h2>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo URL
                </label>
                <Input
                  type="url"
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
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
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium text-gray-900">Bulk Pricing Tiers</h3>
              <Button type="button" variant="outline" size="sm" onClick={addBulkTier}>
                Add Tier
              </Button>
            </div>
            
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
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Price per {formData.unit} (₹)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.price_per_unit}
                        onChange={(e) => updateBulkTier(index, 'price_per_unit', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeBulkTier(index)}
                      className="mt-6"
                    >
                      <X className="h-3 w-3" />
                    </Button>
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
                  Updating...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};