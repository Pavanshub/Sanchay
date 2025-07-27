import { z } from 'zod';

// Profile validation schemas
export const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  phone: z.string().regex(/^\+91\d{10}$/, 'Invalid Indian phone number format'),
  role: z.enum(['vendor', 'supplier']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

// Cluster validation schemas
export const clusterSchema = z.object({
  name: z.string().min(3, 'Cluster name must be at least 3 characters').max(100, 'Cluster name must be less than 100 characters'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  radius_km: z.number().min(1).max(50),
});

// Inventory validation schemas
export const inventorySchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100, 'Product name must be less than 100 characters'),
  name_hindi: z.string().max(100, 'Hindi name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  category_id: z.string().uuid('Invalid category ID'),
  unit: z.enum(['kg', 'g', 'l', 'ml', 'piece', 'dozen', 'packet']),
  base_price: z.number().min(0.01, 'Price must be greater than 0'),
  minimum_quantity: z.number().min(1, 'Minimum quantity must be at least 1'),
  photo_url: z.string().url('Invalid photo URL').optional(),
});

export const bulkTierSchema = z.object({
  min_quantity: z.number().min(1, 'Minimum quantity must be at least 1'),
  price_per_unit: z.number().min(0.01, 'Price must be greater than 0'),
});

// Order validation schemas
export const orderSchema = z.object({
  title: z.string().min(3, 'Order title must be at least 3 characters').max(200, 'Order title must be less than 200 characters'),
  cluster_id: z.string().uuid('Invalid cluster ID'),
  supplier_id: z.string().uuid('Invalid supplier ID'),
  delivery_date: z.string().optional(),
  delivery_slot: z.enum(['morning', 'afternoon', 'evening']).optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
});

// Validation helper functions
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^\+91\d{10}$/;
  return phoneRegex.test(phone);
};

export const validatePincode = (pincode: string): boolean => {
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const validateImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return validExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
  } catch {
    return false;
  }
};

// Form validation helpers
export const getValidationErrors = (error: z.ZodError) => {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    if (err.path.length > 0) {
      errors[err.path[0]] = err.message;
    }
  });
  return errors;
};