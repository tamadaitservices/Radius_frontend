import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}

export function getTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const CATEGORY_ICONS: Record<string, string> = {
  ELECTRONICS: '📱',
  CLOTHING: '👕',
  GROCERY: '🛒',
  HARDWARE: '🔧',
  MEDICAL: '💊',
  FOOD: '🍱',
  BAKERY: '🥐',
  FURNITURE: '🛋️',
  SPORTS: '⚽',
  BOOKS: '📚',
  BEAUTY: '💄',
  JEWELLERY: '💍',
  TOYS: '🧸',
  AUTO: '🚗',
  OTHER: '🏪',
};

export const CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: 'Electronics',
  CLOTHING: 'Clothing',
  GROCERY: 'Grocery',
  HARDWARE: 'Hardware',
  MEDICAL: 'Medical',
  FOOD: 'Food',
  BAKERY: 'Bakery',
  FURNITURE: 'Furniture',
  SPORTS: 'Sports',
  BOOKS: 'Books',
  BEAUTY: 'Beauty',
  JEWELLERY: 'Jewellery',
  TOYS: 'Toys',
  AUTO: 'Auto',
  OTHER: 'Other',
};

export const LISTING_CATEGORY_ICONS: Record<string, string> = {
  ELECTRONICS: '📱',
  FURNITURE: '🛋️',
  VEHICLES: '🚗',
  FASHION: '👕',
  BOOKS_HOBBIES: '📚',
  APPLIANCES: '🔌',
  SPORTS_FITNESS: '⚽',
  KIDS_BABY: '🧸',
  PROPERTY_RENTAL: '🏠',
  OTHER: '📦',
};

export const LISTING_CATEGORY_LABELS: Record<string, string> = {
  ELECTRONICS: 'Electronics',
  FURNITURE: 'Furniture',
  VEHICLES: 'Vehicles',
  FASHION: 'Fashion',
  BOOKS_HOBBIES: 'Books & Hobbies',
  APPLIANCES: 'Appliances',
  SPORTS_FITNESS: 'Sports & Fitness',
  KIDS_BABY: 'Kids & Baby',
  PROPERTY_RENTAL: 'Property / Rental',
  OTHER: 'Other',
};

export const LISTING_CONDITION_LABELS: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  USED_GOOD: 'Used - Good',
  USED_FAIR: 'Used - Fair',
};
