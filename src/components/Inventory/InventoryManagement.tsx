import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Package, Upload, Star } from 'lucide-react';
import { supabase, InventoryItem, Category } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../lib/utils';
import { AddInventoryModal } from './AddInventoryModal';
import { EditInventoryModal } from './EditInventoryModal';
import { toast } from 'sonner';

export const InventoryManagement = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    if (profile?.role === 'supplier') {
      fetchInventory();
      fetchCategories();
    }
  }, [profile]);

  const fetchInventory = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          categories(*),
          bulk_tiers(*)
        `)
        .eq('supplier_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setInventory(inventory.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const handleToggleAvailability = async (itemId: string, available: boolean) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ available: !available })
        .eq('id', itemId);

      if (error) throw error;

      setInventory(inventory.map(item => 
        item.id === itemId ? { ...item, available: !available } : item
      ));
      
      toast.success(`Item ${!available ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.name_hindi?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.inventory')}</h1>
          <p className="text-gray-600">Manage your products and bulk pricing tiers</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInventory.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  {item.name_hindi && (
                    <p className="text-sm text-gray-600 mt-1">{item.name_hindi}</p>
                  )}
                  <CardDescription className="mt-2">
                    {item.description || 'No description'}
                  </CardDescription>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  item.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {item.available ? 'Available' : 'Unavailable'}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {item.photo_url && (
                  <img 
                    src={item.photo_url} 
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base Price:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(item.base_price)}/{item.unit}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Min Quantity:</span>
                  <span className="text-sm">{item.minimum_quantity} {item.unit}</span>
                </div>

                {item.bulk_tiers && item.bulk_tiers.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Bulk Tiers:</p>
                    <div className="space-y-1">
                      {item.bulk_tiers.slice(0, 2).map((tier, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span>{tier.min_quantity}+ {item.unit}</span>
                          <span className="text-green-600">
                            {formatCurrency(tier.price_per_unit)}/{item.unit}
                          </span>
                        </div>
                      ))}
                      {item.bulk_tiers.length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{item.bulk_tiers.length - 2} more tiers
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingItem(item)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={item.available ? "outline" : "default"}
                    onClick={() => handleToggleAvailability(item.id, item.available)}
                    className="flex-1"
                  >
                    {item.available ? 'Disable' : 'Enable'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || selectedCategory !== 'all' ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Start by adding your first product to the inventory'
            }
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Product
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <AddInventoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          fetchInventory();
        }}
        categories={categories}
      />

      {editingItem && (
        <EditInventoryModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            setEditingItem(null);
            fetchInventory();
          }}
          item={editingItem}
          categories={categories}
        />
      )}
    </div>
  );
};