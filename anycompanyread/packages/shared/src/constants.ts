// DynamoDB table names — set via Lambda environment variables at deploy time
export const TABLE_BOOKS = process.env.TABLE_BOOKS ?? 'Books';
export const TABLE_CARTS = process.env.TABLE_CARTS ?? 'Carts';
export const TABLE_ORDERS = process.env.TABLE_ORDERS ?? 'Orders';
export const TABLE_ORDER_ITEMS = process.env.TABLE_ORDER_ITEMS ?? 'OrderItems';

// API path prefixes
export const API_PATHS = {
  AUTH: '/auth',
  BOOKS: '/books',
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/orders',
} as const;

// Supported book genres for filtering
export const BOOK_GENRES = [
  'Fiction',
  'Non-Fiction',
  'Science Fiction',
  'Fantasy',
  'Mystery',
  'Thriller',
  'Biography',
  'History',
  'Self-Help',
  'Technology',
] as const;
