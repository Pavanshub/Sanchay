import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface CreateClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateClusterModal = ({ isOpen, onClose, onSuccess }: CreateClusterModalProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    pincode: '',
    radiusKm: 5,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    try {
      // Mock location for now - in real app, use geolocation API
      const mockLocation = {
        latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
      };

      const { error } = await supabase
        .from('clusters')
        .insert({
          name: formData.name,
          pincode: formData.pincode,
          center_location: mockLocation,
          radius_km: formData.radiusKm,
          created_by: profile.id,
        });

      if (error) throw error;

      toast.success('Cluster created successfully!');
      onSuccess();
      setFormData({ name: '', pincode: '', radiusKm: 5 });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Create New Cluster</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cluster Name
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Karol Bagh Vendors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pincode
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="110005"
                className="pl-10"
                maxLength={6}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Radius (km)
            </label>
            <Input
              type="number"
              value={formData.radiusKm}
              onChange={(e) => setFormData({ ...formData, radiusKm: parseInt(e.target.value) })}
              min={1}
              max={20}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              How far vendors can be from the center location
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? t('common.loading') : t('common.create')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};