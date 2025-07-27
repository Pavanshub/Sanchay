import { useEffect, useState } from 'react';
import { Package, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { formatCurrency } from '../../lib/utils';

export const SupplierDashboard = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    monthlyRevenue: 0,
    averageRating: 0,
    recentOrders: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile) return;

      try {
        // Fetch inventory count
        const { data: inventory } = await supabase
          .from('inventory')
          .select('id')
          .eq('supplier_id', profile.id);

        // Fetch pending orders
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .eq('supplier_id', profile.id)
          .eq('status', 'pending');

        // Fetch reviews for rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .eq('supplier_id', profile.id);

        const avgRating = reviews?.length 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

        setStats({
          totalProducts: inventory?.length || 0,
          pendingOrders: orders?.length || 0,
          monthlyRevenue: 25000, // Mock data
          averageRating: avgRating,
          recentOrders: orders?.slice(0, 5) || [],
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
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {t('dashboard.welcomeBack')}, {profile?.name}! 🏪
        </h1>
        <p className="text-blue-100">
          Manage your inventory and serve vendor clusters efficiently
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              In your inventory
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
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Out of 5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>
            Latest group orders from vendor clusters
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentOrders.length > 0 ? (
            <div className="space-y-4">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{order.title}</h4>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(order.total_amount)} • {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No recent orders</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};