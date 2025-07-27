import { useEffect, useState } from 'react';
import { Plus, MapPin, Users, Calendar } from 'lucide-react';
import { supabase, Cluster } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { CreateClusterModal } from './CreateClusterModal';
import { JoinClusterModal } from './JoinClusterModal';

export const ClusterList = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [joinedClusters, setJoinedClusters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  useEffect(() => {
    fetchClusters();
    fetchJoinedClusters();
  }, [profile]);

  const fetchClusters = async () => {
    try {
      const { data, error } = await supabase
        .from('clusters')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClusters(data || []);
    } catch (error) {
      console.error('Error fetching clusters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedClusters = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('cluster_members')
        .select('cluster_id')
        .eq('vendor_id', profile.id);

      if (error) throw error;
      setJoinedClusters(data?.map(m => m.cluster_id) || []);
    } catch (error) {
      console.error('Error fetching joined clusters:', error);
    }
  };

  const handleJoinCluster = async (clusterId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('cluster_members')
        .insert({
          cluster_id: clusterId,
          vendor_id: profile.id,
        });

      if (error) throw error;
      
      setJoinedClusters([...joinedClusters, clusterId]);
    } catch (error) {
      console.error('Error joining cluster:', error);
    }
  };

  const handleLeaveCluster = async (clusterId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('cluster_members')
        .delete()
        .eq('cluster_id', clusterId)
        .eq('vendor_id', profile.id);

      if (error) throw error;
      
      setJoinedClusters(joinedClusters.filter(id => id !== clusterId));
    } catch (error) {
      console.error('Error leaving cluster:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.clusters')}</h1>
          <p className="text-gray-600">Join local vendor clusters to unlock bulk discounts</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowJoinModal(true)} variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            Find Nearby
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('common.create')} Cluster
          </Button>
        </div>
      </div>

      {/* Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clusters.map((cluster) => {
          const isJoined = joinedClusters.includes(cluster.id);
          
          return (
            <Card key={cluster.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{cluster.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1" />
                      {cluster.pincode}
                    </CardDescription>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isJoined 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isJoined ? 'Joined' : 'Available'}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>5 active members</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created {new Date(cluster.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="pt-3">
                    {isJoined ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleLeaveCluster(cluster.id)}
                      >
                        {t('common.leave')} Cluster
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleJoinCluster(cluster.id)}
                      >
                        {t('common.join')} Cluster
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {clusters.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clusters found</h3>
          <p className="text-gray-600 mb-6">Be the first to create a cluster in your area</p>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Cluster
          </Button>
        </div>
      )}

      {/* Modals */}
      <CreateClusterModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchClusters();
        }}
      />

      <JoinClusterModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={() => {
          setShowJoinModal(false);
          fetchClusters();
          fetchJoinedClusters();
        }}
      />
    </div>
  );
};