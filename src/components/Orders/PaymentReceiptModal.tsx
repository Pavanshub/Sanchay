import { useState, useEffect } from 'react';
import { X, Download, Check, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';
import { toast } from 'sonner';

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
}

export const PaymentReceiptModal = ({ isOpen, onClose, order, onSuccess }: PaymentReceiptModalProps) => {
  const { profile } = useAuth();
  const [receipt, setReceipt] = useState<any>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      fetchReceipt();
    }
  }, [isOpen, order]);

  const fetchReceipt = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_receipts')
        .select('*')
        .eq('order_id', order.id)
        .maybeSingle();

      if (error) throw error;
      setReceipt(data);
    } catch (error: any) {
      console.error('Error fetching receipt:', error);
    }
  };

  const generateReceipt = async () => {
    if (!profile) return;

    setGenerating(true);
    try {
      const receiptNumber = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const { data, error } = await supabase
        .from('payment_receipts')
        .insert({
          order_id: order.id,
          vendor_id: profile.id,
          supplier_id: order.supplier_id,
          amount: order.total_amount,
          receipt_number: receiptNumber,
          payment_method: 'cod',
          payment_status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      setReceipt(data);
      toast.success('Payment receipt generated!');
    } catch (error: any) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    } finally {
      setGenerating(false);
    }
  };

  const confirmPayment = async () => {
    if (!receipt || !confirmationCode) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('payment_receipts')
        .update({
          payment_status: 'paid',
          payment_date: new Date().toISOString(),
          delivery_confirmation_code: confirmationCode,
        })
        .eq('id', receipt.id);

      if (error) throw error;

      // Update order status to delivered
      await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', order.id);

      toast.success('Payment confirmed successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!receipt) return;

    const receiptData = {
      receiptNumber: receipt.receipt_number,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      paymentDate: receipt.payment_date ? new Date(receipt.payment_date).toLocaleDateString() : 'Pending',
      amount: receipt.amount,
      paymentMethod: 'Cash on Delivery',
      status: receipt.payment_status,
      vendor: profile?.name,
      supplier: order.supplier_profile?.name,
    };

    const receiptText = `
PAYMENT RECEIPT
===============

Receipt Number: ${receiptData.receiptNumber}
Order Date: ${receiptData.orderDate}
Payment Date: ${receiptData.paymentDate}
Amount: ${formatCurrency(receiptData.amount)}
Payment Method: ${receiptData.paymentMethod}
Status: ${receiptData.status.toUpperCase()}

Vendor: ${receiptData.vendor}
Supplier: ${receiptData.supplier}

Thank you for your business!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${receipt.receipt_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Payment Receipt</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!receipt ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Receipt Generated
                </h3>
                <p className="text-gray-600 mb-4">
                  Generate a payment receipt for this cash-on-delivery order.
                </p>
                <Button onClick={generateReceipt} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Receipt'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Receipt Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Receipt Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Receipt Number:</span>
                    <span className="font-mono text-sm">{receipt.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(receipt.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span>Cash on Delivery</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      receipt.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800'
                        : receipt.payment_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {receipt.payment_status.toUpperCase()}
                    </span>
                  </div>
                  {receipt.payment_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date:</span>
                      <span>{new Date(receipt.payment_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payment Confirmation */}
              {receipt.payment_status === 'pending' && profile?.role === 'vendor' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
                      Confirm Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Enter the delivery confirmation code provided by the supplier to confirm payment.
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmation Code
                      </label>
                      <Input
                        type="text"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        placeholder="Enter confirmation code"
                      />
                    </div>
                    <Button 
                      onClick={confirmPayment}
                      disabled={loading || !confirmationCode}
                      className="w-full"
                    >
                      {loading ? 'Confirming...' : 'Confirm Payment'}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Success State */}
              {receipt.payment_status === 'paid' && (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Payment Confirmed
                    </h3>
                    <p className="text-gray-600">
                      Your payment has been successfully confirmed and recorded.
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={downloadReceipt} className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={onClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};