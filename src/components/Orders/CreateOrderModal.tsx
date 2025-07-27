import { useState, useEffect } from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { supabase, Cluster, InventoryItem } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal = ({ isOpen, onClose, onSuccess }: CreateOrderModalProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    title: '',
    cluster_id: '',
    supplier_id: '',
    delivery_date: '',
    delivery_slot: '',
    notes: '',
  });
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserClusters();
    }
  }, [isOpen, profile]);

  useEffect(() => {
    if (formData.cluster_id) {
      fetchClusterSuppliers();
    }
  }, [formData.cluster_id]);

  const fetchUserClusters = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('cluster_members')
        .select(`
          cluster_id,
          clusters(*)
        `)
        .eq('vendor_id', profile.id);

      if (error) throw error;
      setClusters(data?.map(m => m.clusters).filter(Boolean) || []);
    } catch (error: any) {
      console.error('Error fetching clusters:', error);
      toast.error('Failed to load clusters');
    }
  };

  const fetchClusterSuppliers = async () => {
    try {
      // Get suppliers who have inventory items
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          inventory(count)
        `)
        .eq('role', 'supplier');

      if (error) throw error;
      
      // Filter suppliers who have inventory items
      const suppliersWithInventory = (data || []).filter(supplier => 
        supplier.inventory && supplier.inventory.length > 0 && supplier.inventory[0]?.count > 0
      );
      
      setSuppliers(suppliersWithInventory);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to load suppliers');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          title: formData.title,
          cluster_id: formData.cluster_id,
          supplier_id: formData.supplier_id,
          delivery_date: formData.delivery_date || null,
          delivery_slot: formData.delivery_slot || null,
          notes: formData.notes || null,
          created_by: profile.id,
          status: 'pending',
          total_amount: 0, // Will be calculated when items are added
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Group order created successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        title: '',
        cluster_id: '',
        supplier_id: '',
        delivery_date: '',
        delivery_slot: '',
        notes: '',
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Create Group Order</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Title *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Weekly Vegetables Order"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Cluster *
            </label>
            <select
              value={formData.cluster_id}
              onChange={(e) => setFormData({ ...formData, cluster_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Choose a cluster</option>
              {clusters.map(cluster => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.name} ({cluster.pincode})
                </option>
              ))}
            </select>
            {clusters.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                You need to join a cluster first to create orders
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Supplier *
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={!formData.cluster_id}
            >
              <option value="">Choose a supplier</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Delivery Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={formData.delivery_date}
                onChange={(e) => setFormData({ ...formData, delivery_date: e.target.value })}
                className="pl-10"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Time Slot
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.delivery_slot}
                onChange={(e) => setFormData({ ...formData, delivery_slot: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Select time slot</option>
                <option value="morning">Morning (8 AM - 12 PM)</option>
                <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                <option value="evening">Evening (4 PM - 8 PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions or requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={loading || clusters.length === 0} 
              className="flex-1"
            >
              {loading ? t('common.loading') : 'Create Order'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};