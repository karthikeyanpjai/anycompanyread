// Core domain types shared across frontend and backend

export interface Book {
  bookId: string;
  title: string;
  author: string;
  isbn: string;
  genre: string;
  description: string;
  price: number;
  coverImageUrl: string;
  rating: number;
  pageCount: number;
  publishedYear: number;
  createdAt: string;
}

export interface CartItem {
  userId: string;
  bookId: string;
  quantity: number;
  // Denormalized for display without extra lookups
  title: string;
  price: number;
  coverImageUrl: string;
}

export interface Order {
  userId: string;
  orderId: string;
  totalPrice: number;
  status: 'CONFIRMED' | 'CANCELLED';
  createdAt: string;
}

export interface OrderItem {
  orderId: string;
  bookId: string;
  quantity: number;
  price: number;
  title: string;
}

export interface ApiResponse<T = unknown> {
  statusCode: number;
  body: T;
}

export interface ListBooksResponse {
  books: Book[];
  totalCount: number;
  nextToken?: string;
}

export interface CartResponse {
  items: CartItem[];
  totalPrice: number;
}
