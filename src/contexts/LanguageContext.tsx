import { createContext, useContext, useState } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.clusters': 'Clusters',
    'nav.orders': 'Orders',
    'nav.inventory': 'Inventory',
    'nav.profile': 'Profile',
    'nav.signOut': 'Sign Out',
    
    // Auth
    'auth.welcome': 'Welcome to Sanchay',
    'auth.tagline': 'Together We Save',
    'auth.phoneNumber': 'Phone Number',
    'auth.sendOtp': 'Send OTP',
    'auth.verifyOtp': 'Verify OTP',
    'auth.enterOtp': 'Enter OTP',
    'auth.roleSelect': 'I am a',
    'auth.vendor': 'Vendor',
    'auth.supplier': 'Supplier',
    'auth.name': 'Full Name',
    'auth.complete': 'Complete Profile',
    
    // Dashboard
    'dashboard.welcomeBack': 'Welcome back',
    'dashboard.quickStats': 'Quick Stats',
    'dashboard.activeClusters': 'Active Clusters',
    'dashboard.pendingOrders': 'Pending Orders',
    'dashboard.recentActivity': 'Recent Activity',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.create': 'Create',
    'common.join': 'Join',
    'common.leave': 'Leave',
  },
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.clusters': 'समूह',
    'nav.orders': 'ऑर्डर',
    'nav.inventory': 'इन्वेंटरी',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.signOut': 'साइन आउट',
    
    // Auth
    'auth.welcome': 'संचय में आपका स्वागत है',
    'auth.tagline': 'मिलकर बचाएं',
    'auth.phoneNumber': 'फ़ोन नंबर',
    'auth.sendOtp': 'OTP भेजें',
    'auth.verifyOtp': 'OTP सत्यापित करें',
    'auth.enterOtp': 'OTP दर्ज करें',
    'auth.roleSelect': 'मैं हूं',
    'auth.vendor': 'विक्रेता',
    'auth.supplier': 'आपूर्तिकर्ता',
    'auth.name': 'पूरा नाम',
    'auth.complete': 'प्रोफ़ाइल पूरा करें',
    
    // Dashboard
    'dashboard.welcomeBack': 'वापसी पर स्वागत है',
    'dashboard.quickStats': 'त्वरित आंकड़े',
    'dashboard.activeClusters': 'सक्रिय समूह',
    'dashboard.pendingOrders': 'लंबित ऑर्डर',
    'dashboard.recentActivity': 'हाल की गतिविधि',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.create': 'बनाएं',
    'common.join': 'शामिल हों',
    'common.leave': 'छोड़ें',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};