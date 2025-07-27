import { useEffect, useState } from 'react';
import { Users, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

export const VendorDashboard = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    activeClusters: 0,
    pendingOrders: 0,
    totalSaved: 0,
    recentActivity: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;

      try {
        // Fetch cluster memberships
        const { data: clusterMemberships } = await supabase
          .from('cluster_members')
          .select('cluster_id, clusters(*)')
          .eq('vendor_id', profile.id);

        // Fetch pending orders
        const { data: orders } = await supabase
          .from('order_participants')
          .select('*, orders(*)')
          .eq('vendor_id', profile.id)
          .eq('confirmed', false);

        setStats({
          activeClusters: clusterMemberships?.length || 0,
          pendingOrders: orders?.length || 0,
          totalSaved: 1250, // Mock data for now
          recentActivity: [
            { type: 'order', message: 'New group order started for vegetables', time: '2 hours ago' },
            { type: 'cluster', message: 'Joined cluster "Karol Bagh Vendors"', time: '1 day ago' },
            { type: 'savings', message: 'Saved ₹340 on bulk rice order', time: '2 days ago' },
          ],
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {t('dashboard.welcomeBack')}, {profile?.name}! 👋
        </h1>
        <p className="text-green-100">
          Ready to start saving with group orders today?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.activeClusters')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClusters}</div>
            <p className="text-xs text-muted-foreground">
              Groups you're part of
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.pendingOrders')}
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalSaved)}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Available today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          <CardDescription>
            Your latest activities and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'cluster' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {activity.type === 'order' ? '🛒' :
                   activity.type === 'cluster' ? '👥' : '💰'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};