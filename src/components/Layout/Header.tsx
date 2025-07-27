import { useState } from 'react';
import { Menu, X, Globe, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../ui/Button';
import { getInitials } from '../../lib/utils';

interface HeaderProps {
  onMenuToggle: () => void;
  isMobileMenuOpen: boolean;
}

export const Header = ({ onMenuToggle, isMobileMenuOpen }: HeaderProps) => {
  const { profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 md:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuToggle}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Sanchay</h1>
              <p className="text-xs text-gray-500 hidden sm:block">{t('auth.tagline')}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            className="flex items-center space-x-1"
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm">{language === 'en' ? 'हि' : 'EN'}</span>
          </Button>

          {/* Profile Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-2"
            >
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium">
                  {profile?.name ? getInitials(profile.name) : <User className="h-4 w-4" />}
                </span>
              </div>
              <span className="hidden sm:block text-sm">{profile?.name}</span>
            </Button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">{profile?.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setShowProfileMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('nav.signOut')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};