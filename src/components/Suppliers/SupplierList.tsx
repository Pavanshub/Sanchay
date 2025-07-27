import { useEffect, useState } from 'react';
import { Star, MapPin, Phone, Mail, Filter, Search, Award, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { formatPhone } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  supplier_profiles: {
    business_name: string;
    business_type: string;
    description: string;
    city: string;
    state: string;
    years_in_business: number;
    is_verified: boolean;
    logo_url: string;
  };
  avg_rating: number;
  total_reviews: number;
  inventory_count: number;
}

export const SupplierList = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [minRating, setMinRating] = useState(0);

  const categories = [
    'all', 'Electronics', 'Textiles', 'Food Products', 'Construction', 
    'Automotive', 'Beauty & Cosmetics', 'Stationery', 'Sports & Fitness', 'Home & Garden'
  ];

  useEffect(() => {
    fetchSuppliers();
  }, []);

  useEffect(() => {
    filterAndSortSuppliers();
  }, [suppliers, searchTerm, selectedCategory, sortBy, minRating]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
          phone,
          supplier_profiles!inner(*),
          vendor_ratings(rating),
          inventory(id)
        `)
        .eq('role', 'supplier');

      if (error) throw error;

      // Process the data to calculate ratings and inventory count
      const processedSuppliers = (data || []).map(supplier => {
        const ratings = supplier.vendor_ratings || [];
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length 
          : 0;
        
        return {
          ...supplier,
          avg_rating: Number(avgRating.toFixed(1)),
          total_reviews: ratings.length,
          inventory_count: supplier.inventory?.length || 0,
        };
      });

      setSuppliers(processedSuppliers);
    } catch (error: any) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSuppliers = () => {
    let filtered = suppliers.filter(supplier => {
      const matchesSearch = 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplier_profiles.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.supplier_profiles.business_type.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || 
        supplier.supplier_profiles.business_type === selectedCategory;
      
      const matchesRating = supplier.avg_rating >= minRating;

      return matchesSearch && matchesCategory && matchesRating;
    });

    // Sort suppliers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.avg_rating - a.avg_rating;
        case 'reviews':
          return b.total_reviews - a.total_reviews;
        case 'experience':
          return b.supplier_profiles.years_in_business - a.supplier_profiles.years_in_business;
        case 'name':
          return a.supplier_profiles.business_name.localeCompare(b.supplier_profiles.business_name);
        default:
          return 0;
      }
    });

    setFilteredSuppliers(filtered);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : i < rating
            ? 'text-yellow-400 fill-current opacity-50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleSupplierClick = (supplierId: string) => {
    navigate(`/suppliers/${supplierId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Loading suppliers..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Directory</h1>
          <p className="text-gray-600">
            Discover verified suppliers for your business needs
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {filteredSuppliers.length} suppliers found
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search suppliers, business names, or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="rating">Highest Rated</option>
            <option value="reviews">Most Reviews</option>
            <option value="experience">Most Experienced</option>
            <option value="name">Name A-Z</option>
          </select>

          {/* Rating Filter */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value={0}>All Ratings</option>
            <option value={4}>4+ Stars</option>
            <option value={3}>3+ Stars</option>
            <option value={2}>2+ Stars</option>
          </select>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map((supplier) => (
          <Card 
            key={supplier.id} 
            className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
            onClick={() => handleSupplierClick(supplier.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {supplier.supplier_profiles.logo_url ? (
                      <img
                        src={supplier.supplier_profiles.logo_url}
                        alt={supplier.supplier_profiles.business_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {supplier.supplier_profiles.business_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg group-hover:text-green-600 transition-colors">
                      {supplier.supplier_profiles.business_name}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {supplier.supplier_profiles.business_type}
                      </span>
                    </CardDescription>
                  </div>
                </div>
                {supplier.supplier_profiles.is_verified && (
                  <div className="flex items-center text-green-600">
                    <Award className="h-4 w-4" />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {renderStars(supplier.avg_rating)}
                  </div>
                  <span className="text-sm font-medium">
                    {supplier.avg_rating > 0 ? supplier.avg_rating : 'New'}
                  </span>
                  <span className="text-sm text-gray-500">
                    ({supplier.total_reviews} reviews)
                  </span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">
                  {supplier.supplier_profiles.city}, {supplier.supplier_profiles.state}
                </span>
              </div>

              {/* Experience */}
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>
                  {supplier.supplier_profiles.years_in_business} years in business
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-2">
                {supplier.supplier_profiles.description || 'Professional supplier offering quality products and services.'}
              </p>

              {/* Stats */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm text-gray-500">
                  {supplier.inventory_count} products
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {formatPhone(supplier.phone).slice(-4)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full mt-4 group-hover:bg-green-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSupplierClick(supplier.id);
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSuppliers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search criteria or filters
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setMinRating(0);
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
};