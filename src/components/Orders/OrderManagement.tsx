import { useEffect, useState } from 'react';
import { Plus, ShoppingCart, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { supabase, Order } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency } from '../../lib/utils';
import { CreateOrderModal } from './CreateOrderModal';
import { OrderDetailsModal } from './OrderDetailsModal';
import { JoinOrderModal } from './JoinOrderModal';
import { PaymentReceiptModal } from './PaymentReceiptModal';
import { OrderTrackingModal } from './OrderTrackingModal';
import { toast } from 'sonner';

export const OrderManagement = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showJoinModal, setShowJoinModal] = useState<Order | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<Order | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'my-orders' | 'available' | 'history'>('my-orders');

  useEffect(() => {
    fetchOrders();
  }, [profile, activeTab]);

  const fetchOrders = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          clusters(name, pincode),
          supplier_profile:profiles!orders_supplier_id_fkey(name),
          creator_profile:profiles!orders_created_by_fkey(name),
          order_participants(
            id,
            vendor_id,
            total_amount,
            confirmed,
            profiles(name)
          )
        `);

      if (profile.role === 'vendor') {
        if (activeTab === 'my-orders') {
          // Orders where user is a participant
          query = query.in('id', 
            await supabase
              .from('order_participants')
              .select('order_id')
              .eq('vendor_id', profile.id)
              .then(({ data }) => data?.map(p => p.order_id) || [])
          );
        } else if (activeTab === 'available') {
          // Available orders in user's clusters
          const { data: clusterMemberships } = await supabase
            .from('cluster_members')
            .select('cluster_id')
            .eq('vendor_id', profile.id);

          const clusterIds = clusterMemberships?.map(m => m.cluster_id) || [];
          
          if (clusterIds.length > 0) {
            query = query
              .in('cluster_id', clusterIds)
              .eq('status', 'pending');
          } else {
            setOrders([]);
            setLoading(false);
            return;
          }
        }
      } else if (profile.role === 'supplier') {
        query = query.eq('supplier_id', profile.id);
      }

      if (activeTab === 'history') {
        query = query.in('status', ['delivered', 'cancelled']);
      } else {
        query = query.not('status', 'in', '(delivered,cancelled)');
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Send WhatsApp notification
      const order = orders.find(o => o.id === orderId);
      if (order) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-notifications`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: '+919876543210', // In real app, get from order participants
            type: 'order_update',
            data: {
              vendor_name: 'Vendor',
              order_id: orderId,
              total_amount: order.total_amount,
              delivery_date: order.delivery_date,
            },
          }),
        });
      }

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      
      toast.success(`Order ${status} successfully`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'preparing': return <ShoppingCart className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.orders')}</h1>
          <p className="text-gray-600">
            {profile?.role === 'vendor' 
              ? 'Manage your group orders and participate in bulk buying'
              : 'Manage incoming orders from vendor clusters'
            }
          </p>
        </div>
        {profile?.role === 'vendor' && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group Order
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {profile?.role === 'vendor' && (
            <>
              <button
                onClick={() => setActiveTab('my-orders')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-orders'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setActiveTab('available')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'available'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available Orders
              </button>
            </>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'history'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Order History
          </button>
        </nav>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{order.title}</CardTitle>
                  <CardDescription className="mt-1">
                    Cluster: {order.clusters?.name} ({order.clusters?.pincode})
                  </CardDescription>
                  <CardDescription>
                    Supplier: {order.supplier_profile?.name}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    {order.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Amount:</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Participants:</span>
                  <span className="text-sm">
                    {order.order_participants?.length || 0} vendors
                  </span>
                </div>

                {order.delivery_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Delivery Date:</span>
                    <span className="text-sm">
                      {new Date(order.delivery_date).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTrackingModal(order)}
                    className="flex-1"
                  >
                    Track Order
                  </Button>

                  {profile?.role === 'vendor' && order.status === 'delivered' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowReceiptModal(order)}
                      className="flex-1"
                    >
                      Receipt
                    </Button>
                  )}

                  {profile?.role === 'vendor' && activeTab === 'available' && (
                    <Button
                      size="sm"
                      onClick={() => setShowJoinModal(order)}
                      className="flex-1"
                    >
                      Join Order
                    </Button>
                  )}

                  {profile?.role === 'supplier' && order.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                        className="flex-1"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                        className="flex-1 text-red-600 hover:text-red-700"
                      >
                        Decline
                      </Button>
                    </>
                  )}

                  {profile?.role === 'supplier' && order.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                      className="flex-1"
                    >
                      Start Preparing
                    </Button>
                  )}

                  {profile?.role === 'supplier' && order.status === 'preparing' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'ready')}
                      className="flex-1"
                    >
                      Mark Ready
                    </Button>
                  )}

                  {profile?.role === 'supplier' && order.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                      className="flex-1"
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {activeTab === 'available' ? 'No available orders' : 'No orders found'}
          </h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'available' 
              ? 'Join a cluster to see available group orders'
              : profile?.role === 'vendor'
                ? 'Create your first group order to start saving'
                : 'Orders from vendor clusters will appear here'
            }
          </p>
          {profile?.role === 'vendor' && activeTab !== 'available' && (
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Order
            </Button>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateOrderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchOrders();
        }}
      />

      {showReceiptModal && (
        <PaymentReceiptModal
          isOpen={!!showReceiptModal}
          onClose={() => setShowReceiptModal(null)}
          order={showReceiptModal}
          onSuccess={() => {
            setShowReceiptModal(null);
            fetchOrders();
          }}
        />
      )}

      {showTrackingModal && (
        <OrderTrackingModal
          isOpen={!!showTrackingModal}
          onClose={() => setShowTrackingModal(null)}
          order={showTrackingModal}
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}

      {showJoinModal && (
        <JoinOrderModal
          isOpen={!!showJoinModal}
          onClose={() => setShowJoinModal(null)}
          order={showJoinModal}
          onSuccess={() => {
            setShowJoinModal(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};