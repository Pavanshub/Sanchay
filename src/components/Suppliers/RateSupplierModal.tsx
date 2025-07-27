import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface RateSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: any;
  onSuccess: () => void;
}

export const RateSupplierModal = ({ isOpen, onClose, supplier, onSuccess }: RateSupplierModalProps) => {
  const { profile } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [formData, setFormData] = useState({
    review_title: '',
    review_text: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || rating === 0) return;

    setLoading(true);
    try {
      // Create a mock order ID for the rating (in real app, this would be from an actual order)
      const mockOrderId = crypto.randomUUID();

      const { error } = await supabase
        .from('vendor_ratings')
        .insert({
          vendor_id: profile.id,
          supplier_id: supplier.id,
          order_id: mockOrderId,
          rating,
          review_title: formData.review_title,
          review_text: formData.review_text,
        });

      if (error) throw error;

      onSuccess();
      setRating(0);
      setFormData({ review_title: '', review_text: '' });
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starValue = i + 1;
      return (
        <button
          key={i}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          <Star
            className={`h-8 w-8 transition-colors ${
              starValue <= (hoverRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Rate Supplier</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">
              {supplier.supplier_profiles.business_name}
            </h3>
            <p className="text-gray-600 mb-4">How was your experience?</p>
            
            <div className="flex justify-center space-x-1 mb-4">
              {renderStars()}
            </div>
            
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (Optional)
            </label>
            <Input
              type="text"
              value={formData.review_title}
              onChange={(e) => setFormData({ ...formData, review_title: e.target.value })}
              placeholder="Brief title for your review"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={formData.review_text}
              onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
              placeholder="Share your experience with this supplier..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading || rating === 0} className="flex-1">
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};