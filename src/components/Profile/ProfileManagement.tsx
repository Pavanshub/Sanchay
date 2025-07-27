import { useState, useEffect } from 'react';
import { User, Phone, MapPin, Edit, Save, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatPhone, getInitials } from '../../lib/utils';
import { toast } from 'sonner';

export const ProfileManagement = () => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    location: null as any,
  });
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSaved: 0,
    clustersJoined: 0,
    productsListed: 0,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
      });
      fetchUserStats();
    }
  }, [profile]);

  const fetchUserStats = async () => {
    if (!profile) return;

    try {
      if (profile.role === 'vendor') {
        // Fetch vendor stats
        const [ordersResult, clustersResult] = await Promise.all([
          supabase
            .from('order_participants')
            .select('total_amount')
            .eq('vendor_id', profile.id),
          supabase
            .from('cluster_members')
            .select('id')
            .eq('vendor_id', profile.id)
        ]);

        const totalOrders = ordersResult.data?.length || 0;
        const totalSaved = ordersResult.data?.reduce((sum, order) => sum + (order.total_amount * 0.15), 0) || 0; // Mock 15% savings
        const clustersJoined = clustersResult.data?.length || 0;

        setStats({
          totalOrders,
          totalSaved,
          clustersJoined,
          productsListed: 0,
        });
      } else if (profile.role === 'supplier') {
        // Fetch supplier stats
        const [ordersResult, inventoryResult] = await Promise.all([
          supabase
            .from('orders')
            .select('total_amount')
            .eq('supplier_id', profile.id),
          supabase
            .from('inventory')
            .select('id')
            .eq('supplier_id', profile.id)
        ]);

        const totalOrders = ordersResult.data?.length || 0;
        const productsListed = inventoryResult.data?.length || 0;

        setStats({
          totalOrders,
          totalSaved: 0,
          clustersJoined: 0,
          productsListed,
        });
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          location: formData.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('Profile updated successfully!');
      setEditing(false);
      
      // Refresh the page to update the profile context
      window.location.reload();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        location: profile.location,
      });
    }
    setEditing(false);
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
          });
          toast.success('Location updated!');
        },
        (error) => {
          toast.error('Could not get your location');
        }
      );
    } else {
      toast.error('Geolocation is not supported');
    }
  };

  if (!profile) {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.profile')}</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your personal information and contact details
                  </CardDescription>
                </div>
                {!editing ? (
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {getInitials(profile.name)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{profile.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{profile.role}</p>
                  <p className="text-sm text-gray-500">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name
                  </label>
                  {editing ? (
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="py-2 px-3 bg-gray-50 rounded-md">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  {editing ? (
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <p className="py-2 px-3 bg-gray-50 rounded-md">{profile.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </label>
                  {editing ? (
                    <div className="flex gap-2">
                      <div className="flex-1 py-2 px-3 bg-gray-50 rounded-md text-sm">
                        {formData.location 
                          ? `${formData.location.latitude?.toFixed(4)}, ${formData.location.longitude?.toFixed(4)}`
                          : 'No location set'
                        }
                      </div>
                      <Button variant="outline" onClick={handleGetLocation}>
                        Get Location
                      </Button>
                    </div>
                  ) : (
                    <p className="py-2 px-3 bg-gray-50 rounded-md">
                      {profile.location 
                        ? `${profile.location.latitude?.toFixed(4)}, ${profile.location.longitude?.toFixed(4)}`
                        : 'No location set'
                      }
                    </p>
                  )}
                </div>
              </div>

              {/* Account Information */}
              <div className="border-t pt-6">
                <h4 className="text-md font-medium text-gray-900 mb-4">Account Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User ID
                    </label>
                    <p className="py-2 px-3 bg-gray-50 rounded-md text-sm font-mono">
                      {profile.id.slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Account Type
                    </label>
                    <p className="py-2 px-3 bg-gray-50 rounded-md capitalize">
                      {profile.role}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Statistics</CardTitle>
              <CardDescription>
                Your activity summary
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Orders:</span>
                <span className="font-semibold">{stats.totalOrders}</span>
              </div>
              
              {profile.role === 'vendor' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Saved:</span>
                    <span className="font-semibold text-green-600">
                      ₹{stats.totalSaved.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Clusters Joined:</span>
                    <span className="font-semibold">{stats.clustersJoined}</span>
                  </div>
                </>
              )}
              
              {profile.role === 'supplier' && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Products Listed:</span>
                  <span className="font-semibold">{stats.productsListed}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {profile.role === 'vendor' ? (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    View Order History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find New Clusters
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="h-4 w-4 mr-2" />
                    Manage Inventory
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </>
              )}
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
};