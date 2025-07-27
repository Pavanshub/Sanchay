import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Phone, Mail, Globe, Award, Clock, Package, 
  ArrowLeft, MessageCircle, ShoppingCart, Filter, Heart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatCurrency, formatPhone } from '../../lib/utils';
import { ContactSupplierModal } from './ContactSupplierModal';
import { RateSupplierModal } from './RateSupplierModal';
import { toast } from 'sonner';

interface SupplierDetail {
  id: string;
  name: string;
  phone: string;
  supplier_profiles: {
    business_name: string;
    business_type: string;
    description: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    years_in_business: number;
    is_verified: boolean;
    business_license: string;
    gst_number: string;
    website_url: string;
    logo_url: string;
  };
  inventory: Array<{
    id: string;
    name: string;
    name_hindi: string;
    description: string;
    photo_url: string;
    unit: string;
    base_price: number;
    minimum_quantity: number;
    available: boolean;
    bulk_tiers: Array<{
      min_quantity: number;
      price_per_unit: number;
    }>;
  }>;
  vendor_ratings: Array<{
    id: string;
    rating: number;
    review_title: string;
    review_text: string;
    created_at: string;
    profiles: {
      name: string;
    };
  }>;
}

export const SupplierDetail = () => {
  const { supplierId } = useParams<{ supplierId: string }>();
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (supplierId) {
      fetchSupplierDetail();
    }
  }, [supplierId]);

  const fetchSupplierDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          supplier_profiles(*),
          inventory(*,
            bulk_tiers(*)
          ),
          vendor_ratings(*,
            profiles!vendor_ratings_vendor_id_fkey(name)
          )
        `)
        .eq('id', supplierId)
        .eq('role', 'supplier')
        .single();

      if (error) throw error;
      setSupplier(data);
    } catch (error: any) {
      console.error('Error fetching supplier detail:', error);
      toast.error('Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  };

  const calculateAverageRating = () => {
    if (!supplier?.vendor_ratings || supplier.vendor_ratings.length === 0) return 0;
    const sum = supplier.vendor_ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return Number((sum / supplier.vendor_ratings.length).toFixed(1));
  };

  const renderStars = (rating: number, size: 'sm' | 'md' = 'sm') => {
    const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${sizeClass} ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredProducts = supplier?.inventory.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                         product.name_hindi?.toLowerCase().includes(productSearch.toLowerCase());
    return matchesSearch && product.available;
  }) || [];

  const categories = [...new Set(supplier?.inventory.map(item => item.unit) || [])];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading supplier details..." />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Supplier not found</h3>
        <Button onClick={() => navigate('/suppliers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Suppliers
        </Button>
      </div>
    );
  }

  const avgRating = calculateAverageRating();

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={() => navigate('/suppliers')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Suppliers
      </Button>

      {/* Supplier Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Logo and Basic Info */}
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {supplier.supplier_profiles.logo_url ? (
                  <img
                    src={supplier.supplier_profiles.logo_url}
                    alt={supplier.supplier_profiles.business_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                    {supplier.supplier_profiles.business_name.charAt(0)}
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {supplier.supplier_profiles.business_name}
                  </h1>
                  {supplier.supplier_profiles.is_verified && (
                    <div className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <Award className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mb-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {supplier.supplier_profiles.business_type}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="h-4 w-4 mr-1" />
                    {supplier.supplier_profiles.years_in_business} years in business
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      {renderStars(avgRating, 'md')}
                    </div>
                    <span className="text-lg font-semibold">
                      {avgRating > 0 ? avgRating : 'New'}
                    </span>
                    <span className="text-gray-500">
                      ({supplier.vendor_ratings.length} reviews)
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  {supplier.supplier_profiles.description}
                </p>
              </div>
            </div>

            {/* Contact Info and Actions */}
            <div className="lg:w-80 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-600">
                      {supplier.supplier_profiles.address}, {supplier.supplier_profiles.city}, {supplier.supplier_profiles.state} - {supplier.supplier_profiles.pincode}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-3 text-gray-400" />
                    <span className="text-gray-600">{formatPhone(supplier.phone)}</span>
                  </div>
                  {supplier.supplier_profiles.website_url && (
                    <div className="flex items-center text-sm">
                      <Globe className="h-4 w-4 mr-3 text-gray-400" />
                      <a 
                        href={supplier.supplier_profiles.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Contact Supplier
                </Button>
                {profile?.role === 'vendor' && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowRatingModal(true)}
                    className="w-full"
                  >
                    <Star className="h-4 w-4 mr-2" />
                    Rate Supplier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Products ({supplier.inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reviews'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reviews ({supplier.vendor_ratings.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Product Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  {product.photo_url && (
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  {product.name_hindi && (
                    <CardDescription>{product.name_hindi}</CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {product.description || 'Quality product from verified supplier'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-green-600">
                      {formatCurrency(product.base_price)}/{product.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      Min: {product.minimum_quantity} {product.unit}
                    </span>
                  </div>

                  {product.bulk_tiers && product.bulk_tiers.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Bulk Pricing:</p>
                      <div className="space-y-1">
                        {product.bulk_tiers.slice(0, 2).map((tier, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>{tier.min_quantity}+ {product.unit}</span>
                            <span className="text-green-600">
                              {formatCurrency(tier.price_per_unit)}/{product.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button className="w-full mt-4">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Order
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">This supplier hasn't added any products yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-6">
          {/* Reviews Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-3xl font-bold">{avgRating}</span>
                    <div className="flex items-center">
                      {renderStars(avgRating, 'md')}
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Based on {supplier.vendor_ratings.length} reviews
                  </p>
                </div>
                {profile?.role === 'vendor' && (
                  <Button onClick={() => setShowRatingModal(true)}>
                    Write a Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reviews List */}
          <div className="space-y-4">
            {supplier.vendor_ratings.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{review.profiles.name}</span>
                        <div className="flex items-center">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {review.review_title && (
                    <h4 className="font-medium mb-2">{review.review_title}</h4>
                  )}
                  
                  <p className="text-gray-700">{review.review_text}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {supplier.vendor_ratings.length === 0 && (
            <div className="text-center py-12">
              <Star className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-6">Be the first to review this supplier</p>
              {profile?.role === 'vendor' && (
                <Button onClick={() => setShowRatingModal(true)}>
                  Write First Review
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ContactSupplierModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        supplier={supplier}
        onSuccess={() => {
          setShowContactModal(false);
          toast.success('Message sent successfully!');
        }}
      />

      <RateSupplierModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        supplier={supplier}
        onSuccess={() => {
          setShowRatingModal(false);
          fetchSupplierDetail(); // Refresh to show new review
          toast.success('Review submitted successfully!');
        }}
      />
    </div>
  );
};