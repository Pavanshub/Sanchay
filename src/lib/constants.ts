// API Endpoints
export const API_ENDPOINTS = {
  PRICING_CALCULATOR: '/functions/v1/pricing-calculator',
  AI_CATEGORIZER: '/functions/v1/ai-categorizer',
  WHATSAPP_NOTIFICATIONS: '/functions/v1/whatsapp-notifications',
} as const;

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

// User Roles
export const USER_ROLES = {
  VENDOR: 'vendor',
  SUPPLIER: 'supplier',
} as const;

// Cluster Status
export const CLUSTER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

// Units
export const UNITS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'l', label: 'Liter (l)' },
  { value: 'ml', label: 'Milliliter (ml)' },
  { value: 'piece', label: 'Piece' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'packet', label: 'Packet' },
] as const;

// Delivery Time Slots
export const DELIVERY_SLOTS = [
  { value: 'morning', label: 'Morning (8 AM - 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
  { value: 'evening', label: 'Evening (4 PM - 8 PM)' },
] as const;

// Default Values
export const DEFAULTS = {
  CLUSTER_RADIUS: 5,
  MINIMUM_QUANTITY: 1,
  BULK_TIER_DISCOUNTS: [5, 12, 20], // Percentage discounts
  BULK_TIER_QUANTITIES: [10, 25, 50],
  PAGINATION_LIMIT: 20,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profile updated successfully!',
  CLUSTER_CREATED: 'Cluster created successfully!',
  CLUSTER_JOINED: 'Successfully joined the cluster!',
  ORDER_CREATED: 'Order created successfully!',
  ORDER_JOINED: 'Successfully joined the group order!',
  PRODUCT_ADDED: 'Product added successfully!',
  PRODUCT_UPDATED: 'Product updated successfully!',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  LANGUAGE: 'sanchay_language',
  THEME: 'sanchay_theme',
  USER_PREFERENCES: 'sanchay_user_preferences',
} as const;

// Feature Flags
export const FEATURES = {
  AI_CATEGORIZATION: true,
  WHATSAPP_NOTIFICATIONS: true,
  REAL_TIME_PRICING: true,
  LOCATION_SERVICES: true,
  ANALYTICS: true,
} as const;