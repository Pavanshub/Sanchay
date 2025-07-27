import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthForm } from './components/Auth/AuthForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { VendorDashboard } from './components/Dashboard/VendorDashboard';
import { SupplierDashboard } from './components/Dashboard/SupplierDashboard';
import { ClusterList } from './components/Clusters/ClusterList';
import { InventoryManagement } from './components/Inventory/InventoryManagement';
import { OrderManagement } from './components/Orders/OrderManagement';
import { ProfileManagement } from './components/Profile/ProfileManagement';
import { SupplierList } from './components/Suppliers/SupplierList';
import { SupplierDetail } from './components/Suppliers/SupplierDetail';
import { Routes, Route } from 'react-router-dom';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={handleMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />
      
      <div className="flex">
        <Sidebar 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
          isMobileMenuOpen={isMobileMenuOpen}
        />
        
        <main className="flex-1 p-4 md:p-6 md:ml-0">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={
                activeTab === 'dashboard' ? (
                  profile.role === 'vendor' ? <VendorDashboard /> : <SupplierDashboard />
                ) : activeTab === 'clusters' ? <ClusterList /> :
                  activeTab === 'orders' ? <OrderManagement /> :
                  activeTab === 'inventory' ? <InventoryManagement /> :
                  activeTab === 'suppliers' ? <SupplierList /> :
                  activeTab === 'profile' ? <ProfileManagement /> :
                  profile.role === 'vendor' ? <VendorDashboard /> : <SupplierDashboard />
              } />
              <Route path="/suppliers" element={<SupplierList />} />
              <Route path="/suppliers/:supplierId" element={<SupplierDetail />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
          <Toaster position="top-right" />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;