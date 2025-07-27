import { useState, useEffect } from 'react';
import { X, MapPin, Clock, Package, Truck, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
}

interface TrackingEvent {
  id: string;
  status: string;
  message: string;
  location: string;
  timestamp: string;
  created_by: string;
}

export const OrderTrackingModal = ({ isOpen, onClose, order }: OrderTrackingModalProps) => {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && order) {
      fetchTrackingEvents();
    }
  }, [isOpen, order]);

  const fetchTrackingEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', order.id)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      
      // Add default tracking events if none exist
      if (!data || data.length === 0) {
        const defaultEvents = [
          {
            id: '1',
            status: 'confirmed',
            message: 'Order confirmed by supplier',
            location: 'Supplier Location',
            timestamp: order.created_at,
            created_by: order.supplier_id,
          },
        ];
        setTrackingEvents(defaultEvents);
      } else {
        setTrackingEvents(data);
      }
    } catch (error: any) {
      console.error('Error fetching tracking events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'preparing':
        return <Package className="h-5 w-5 text-blue-600" />;
      case 'ready':
        return <Package className="h-5 w-5 text-orange-600" />;
      case 'out_for_delivery':
        return <Truck className="h-5 w-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 border-green-200';
      case 'preparing':
        return 'bg-blue-100 border-blue-200';
      case 'ready':
        return 'bg-orange-100 border-orange-200';
      case 'out_for_delivery':
        return 'bg-purple-100 border-purple-200';
      case 'delivered':
        return 'bg-green-100 border-green-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Order Tracking</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner text="Loading tracking information..." />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Estimated Delivery:</span>
                      <span className="ml-2">
                        {order.delivery_date 
                          ? new Date(order.delivery_date).toLocaleDateString()
                          : 'TBD'
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tracking Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {trackingEvents.map((event, index) => (
                      <div key={event.id} className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full border-2 ${getStatusColor(event.status)}`}>
                          {getStatusIcon(event.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">
                              {event.message}
                            </h4>
                            <span className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center mt-1 text-sm text-gray-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expected Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Expected Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Order Confirmed
                      </span>
                      <span className="text-gray-500">Completed</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Package className="h-4 w-4 mr-2 text-blue-600" />
                        Preparing Order
                      </span>
                      <span className="text-gray-500">
                        {order.status === 'preparing' ? 'In Progress' : 
                         order.status === 'confirmed' ? 'Pending' : 'Completed'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-purple-600" />
                        Out for Delivery
                      </span>
                      <span className="text-gray-500">
                        {order.status === 'ready' ? 'Ready' : 'Pending'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Delivered
                      </span>
                      <span className="text-gray-500">
                        {order.status === 'delivered' ? 'Completed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">
                    If you have any questions about your order, contact the supplier directly.
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">Supplier:</span>
                    <span className="font-medium">{order.supplier_profile?.name}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};