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

export const PLACE_CATEGORY_ICONS: Record<string, string> = {
  PARK: '🌳',
  PLACE_OF_WORSHIP: '🛕',
  MONUMENT: '🏛️',
  TOURIST_SPOT: '📸',
  ENTERTAINMENT: '🎬',
  HOSPITAL: '🏥',
  ATM_BANK: '🏧',
  PETROL_PUMP: '⛽',
  GOVERNMENT_OFFICE: '🏢',
  POLICE_STATION: '👮',
  PHARMACY: '💊',
  SCHOOL: '🏫',
  COLLEGE: '🎓',
  COACHING_CENTER: '📖',
  LIBRARY: '📚',
  PLACE_OTHER: '📍',
};

export const PLACE_CATEGORY_LABELS: Record<string, string> = {
  PARK: 'Park',
  PLACE_OF_WORSHIP: 'Temple / Church',
  MONUMENT: 'Monument',
  TOURIST_SPOT: 'Tourist Spot',
  ENTERTAINMENT: 'Entertainment',
  HOSPITAL: 'Hospital',
  ATM_BANK: 'ATM / Bank',
  PETROL_PUMP: 'Petrol Pump',
  GOVERNMENT_OFFICE: 'Government Office',
  POLICE_STATION: 'Police Station',
  PHARMACY: 'Pharmacy',
  SCHOOL: 'School',
  COLLEGE: 'College',
  COACHING_CENTER: 'Coaching Center',
  LIBRARY: 'Library',
  PLACE_OTHER: 'Other',
};

export const FOOD_CATEGORY_ICONS: Record<string, string> = {
  NORTH_INDIAN: '🍛',
  SOUTH_INDIAN: '🥘',
  CHINESE: '🥡',
  CONTINENTAL: '🍝',
  FAST_FOOD: '🍔',
  BIRYANI: '🍚',
  STREET_FOOD: '🌮',
  BAKERY_CAFE: '☕',
  ICE_CREAM_DESSERTS: '🍨',
  JUICE_BEVERAGES: '🥤',
  MULTI_CUISINE: '🍽️',
  FOOD_OTHER: '🍴',
};

export const FOOD_CATEGORY_LABELS: Record<string, string> = {
  NORTH_INDIAN: 'North Indian',
  SOUTH_INDIAN: 'South Indian',
  CHINESE: 'Chinese',
  CONTINENTAL: 'Continental',
  FAST_FOOD: 'Fast Food',
  BIRYANI: 'Biryani',
  STREET_FOOD: 'Street Food',
  BAKERY_CAFE: 'Bakery / Cafe',
  ICE_CREAM_DESSERTS: 'Ice Cream & Desserts',
  JUICE_BEVERAGES: 'Juice & Beverages',
  MULTI_CUISINE: 'Multi-Cuisine',
  FOOD_OTHER: 'Other',
};
