import { X, MapPin, Calendar, Clock, User, Package } from 'lucide-react';
import { Order } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
}

export const OrderDetailsModal = ({ isOpen, onClose, order }: OrderDetailsModalProps) => {
  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Order Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{order.title}</h3>
              <p className="text-gray-600">Order #{order.id.slice(0, 8)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>

          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Cluster Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.clusters?.name}</p>
                <p className="text-sm text-gray-600">Pincode: {order.clusters?.pincode}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Supplier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{order.profiles?.name}</p>
              </CardContent>
            </Card>

            {order.delivery_date && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Delivery Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">
                    {new Date(order.delivery_date).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {order.delivery_slot && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Time Slot
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium capitalize">{order.delivery_slot}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Order Participants ({order.order_participants?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.order_participants && order.order_participants.length > 0 ? (
                <div className="space-y-3">
                  {order.order_participants.map((participant, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{participant.profiles?.name}</p>
                        <p className="text-sm text-gray-600">
                          {participant.confirmed ? 'Confirmed' : 'Pending confirmation'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">
                          {formatCurrency(participant.total_amount)}
                        </p>
                        <div className={`inline-block px-2 py-1 rounded-full text-xs ${
                          participant.confirmed 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {participant.confirmed ? 'Confirmed' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No participants yet</p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Participants:</span>
                  <span className="font-medium">{order.order_participants?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Confirmed Participants:</span>
                  <span className="font-medium">
                    {order.order_participants?.filter(p => p.confirmed).length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span className="text-green-600">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Timestamps */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Created: {new Date(order.created_at).toLocaleString()}</p>
            <p>Last Updated: {new Date(order.updated_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};