import { useState } from 'react';
import { X, MapPin, Crosshair } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { toast } from 'sonner';

interface JoinClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const JoinClusterModal = ({ isOpen, onClose, onSuccess }: JoinClusterModalProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [pincode, setPincode] = useState('');
  const [nearbyClusters, setNearbyClusters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    if (!pincode) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('clusters')
        .select('*, cluster_members(count)')
        .eq('pincode', pincode)
        .eq('status', 'active');

      if (error) throw error;

      setNearbyClusters(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleJoinCluster = async (clusterId: string) => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('cluster_members')
        .insert({
          cluster_id: clusterId,
          vendor_id: profile.id,
        });

      if (error) throw error;

      toast.success('Successfully joined cluster!');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Mock pincode based on location - in real app, use reverse geocoding
          setPincode('110001');
          toast.success('Location detected!');
        },
        (error) => {
          toast.error('Could not get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Find Nearby Clusters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your pincode
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="110005"
                    className="pl-10"
                    maxLength={6}
                  />
                </div>
                <Button variant="outline" onClick={handleGetLocation}>
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button onClick={handleSearch} disabled={!pincode || searching} className="w-full">
              {searching ? 'Searching...' : 'Search Clusters'}
            </Button>
          </div>

          {nearbyClusters.length > 0 && (
            <div className="mt-6 max-h-64 overflow-y-auto">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Clusters in {pincode}
              </h3>
              <div className="space-y-3">
                {nearbyClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{cluster.name}</h4>
                        <p className="text-sm text-gray-600">
                          {cluster.cluster_members?.[0]?.count || 0} members
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleJoinCluster(cluster.id)}
                        disabled={loading}
                      >
                        {t('common.join')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nearbyClusters.length === 0 && pincode && !searching && (
            <div className="mt-6 text-center py-8">
              <p className="text-gray-500">No clusters found in {pincode}</p>
              <p className="text-sm text-gray-400 mt-2">
                Consider creating a new cluster for your area
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};