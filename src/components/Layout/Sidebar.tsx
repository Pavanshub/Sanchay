import { Home, Users, Package, ShoppingCart, User, Store, Building2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isMobileMenuOpen: boolean;
}

export const Sidebar = ({ activeTab, onTabChange, isMobileMenuOpen }: SidebarProps) => {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const vendorMenuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'clusters', label: t('nav.clusters'), icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingCart },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  const supplierMenuItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: Home },
    { id: 'inventory', label: t('nav.inventory'), icon: Package },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingCart },
    { id: 'profile', label: t('nav.profile'), icon: User },
  ];

  const menuItems = profile?.role === 'supplier' ? supplierMenuItems : vendorMenuItems;

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => onTabChange(activeTab)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-50',
        'md:relative md:translate-x-0',
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Sanchay</h2>
              <p className="text-sm text-gray-500">{t('auth.tagline')}</p>
            </div>
          </div>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                      isActive 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5',
                      isActive ? 'text-green-600' : 'text-gray-400'
                    )} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};