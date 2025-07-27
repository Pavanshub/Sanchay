import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface ContactSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
  onSuccess: () => void;
}

export const ContactSupplierModal = ({ isOpen, onClose, supplier, onSuccess }: ContactSupplierModalProps) => {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    inquiry_type: 'general',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('supplier_inquiries')
        .insert({
          vendor_id: profile.id,
          supplier_id: supplier.id,
          subject: formData.subject,
          message: formData.message,
          inquiry_type: formData.inquiry_type,
        });

      if (error) throw error;

      onSuccess();
      setFormData({ subject: '', message: '', inquiry_type: 'general' });
    } catch (error: any) {
      console.error('Error sending inquiry:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Contact Supplier</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Inquiry Type
            </label>
            <select
              value={formData.inquiry_type}
              onChange={(e) => setFormData({ ...formData, inquiry_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="general">General Inquiry</option>
              <option value="pricing">Pricing Information</option>
              <option value="bulk_order">Bulk Order</option>
              <option value="partnership">Partnership</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <Input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Enter subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Enter your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                'Sending...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};