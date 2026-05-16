import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { CartItem } from '@anycompanyread/shared';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  totalPrice: number;
  itemCount: number;
  loading: boolean;
  addToCart: (bookId: string, quantity?: number) => Promise<void>;
  updateQuantity: (bookId: string, quantity: number) => Promise<void>;
  removeItem: (bookId: string) => Promise<void>;
  checkout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType>(null!);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    if (!isAuthenticated) { setItems([]); setTotalPrice(0); return; }
    setLoading(true);
    try {
      const data = await api.get<{ items: CartItem[]; totalPrice: number }>('/cart');
      setItems(data.items);
      setTotalPrice(data.totalPrice);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [isAuthenticated]); // eslint-disable-line

  const addToCart = async (bookId: string, quantity = 1) => {
    await api.post('/cart', { bookId, quantity });
    await refresh();
  };

  const updateQuantity = async (bookId: string, quantity: number) => {
    await api.put(`/cart/${bookId}`, { quantity });
    await refresh();
  };

  const removeItem = async (bookId: string) => {
    await api.delete(`/cart/${bookId}`);
    await refresh();
  };

  const checkout = async () => {
    await api.post('/checkout', {});
    setItems([]); setTotalPrice(0);
  };

  return (
    <CartContext.Provider value={{
      items, totalPrice, loading, refresh,
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      addToCart, updateQuantity, removeItem, checkout,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
