import { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { supabase, Order, InventoryItem } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

interface CartItem {
  inventory_id: string;
  name: string;
  unit: string;
  base_price: number;
  quantity: number;
  bulk_tiers?: Array<{ min_quantity: number; price_per_unit: number }>;
}

interface JoinOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onSuccess: () => void;
}

export const JoinOrderModal = ({ isOpen, onClose, order, onSuccess }: JoinOrderModalProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchSupplierInventory();
    }
  }, [isOpen, order]);

  const fetchSupplierInventory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          bulk_tiers(*)
        `)
        .eq('supplier_id', order.supplier_id)
        .eq('available', true)
        .order('name');

      if (error) throw error;
      setInventory(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: InventoryItem) => {
    const existingItem = cart.find(cartItem => cartItem.inventory_id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.inventory_id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        inventory_id: item.id,
        name: item.name,
        unit: item.unit,
        base_price: item.base_price,
        quantity: item.minimum_quantity,
        bulk_tiers: item.bulk_tiers,
      }]);
    }
  };

  const updateQuantity = (inventory_id: string, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.inventory_id !== inventory_id));
    } else {
      setCart(cart.map(item =>
        item.inventory_id === inventory_id
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const calculateItemPrice = (item: CartItem) => {
    let price = item.base_price;
    
    if (item.bulk_tiers && item.bulk_tiers.length > 0) {
      const applicableTier = item.bulk_tiers
        .filter(tier => item.quantity >= tier.min_quantity)
        .sort((a, b) => b.min_quantity - a.min_quantity)[0];
      
      if (applicableTier) {
        price = applicableTier.price_per_unit;
      }
    }
    
    return price * item.quantity;
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + calculateItemPrice(item), 0);
  };

  const handleSubmit = async () => {
    if (!profile || cart.length === 0) return;

    setSubmitting(true);
    try {
      // Create order participation
      const { data: participation, error: participationError } = await supabase
        .from('order_participants')
        .insert({
          order_id: order.id,
          vendor_id: profile.id,
          items: cart.map(item => ({
            inventory_id: item.inventory_id,
            name: item.name,
            quantity: item.quantity,
            unit_price: item.bulk_tiers?.find(tier => item.quantity >= tier.min_quantity)?.price_per_unit || item.base_price,
            total_price: calculateItemPrice(item),
          })),
          total_amount: getTotalAmount(),
          confirmed: false,
        })
        .select()
        .single();

      if (participationError) throw participationError;

      // Send WhatsApp notification
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-notifications`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: profile.phone,
          type: 'order_confirmation',
          data: {
            vendor_name: profile.name,
            order_id: order.id,
            total_amount: getTotalAmount(),
            delivery_date: order.delivery_date,
            items: cart.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: calculateItemPrice(item),
            })),
          },
        }),
      });

      toast.success('Successfully joined the group order!');
      onSuccess();
    } catch (error: any) {
      console.error('Error joining order:', error);
      toast.error(error.message || 'Failed to join order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-lg font-semibold">Join Group Order</h2>
            <p className="text-sm text-gray-600">{order.title}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Products List */}
          <div className="flex-1 p-6 overflow-y-auto border-r">
            <h3 className="text-md font-medium text-gray-900 mb-4">Available Products</h3>
            
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <div className="space-y-3">
                {inventory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          {item.name_hindi && (
                            <p className="text-sm text-gray-600">{item.name_hindi}</p>
                          )}
                          <p className="text-sm text-green-600 font-medium">
                            {formatCurrency(item.base_price)}/{item.unit}
                          </p>
                          {item.bulk_tiers && item.bulk_tiers.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Bulk discounts available from {item.bulk_tiers[0].min_quantity} {item.unit}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addToCart(item)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="w-80 p-6 bg-gray-50">
            <h3 className="text-md font-medium text-gray-900 mb-4">Your Order</h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.inventory_id} className="bg-white p-3 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium">{item.name}</h4>
                        <p className="text-xs text-gray-600">
                          {formatCurrency(calculateItemPrice(item) / item.quantity)}/{item.unit}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {formatCurrency(calculateItemPrice(item))}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.inventory_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.inventory_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                  </div>
                ))}
                
                <div className="border-t pt-3 mt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatCurrency(getTotalAmount())}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full mt-4"
                >
                  {submitting ? 'Joining Order...' : 'Join Group Order'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};