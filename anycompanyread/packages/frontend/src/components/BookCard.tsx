import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Book } from '@anycompanyread/shared';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BookCardProps { book: Book }

export function BookCard({ book }: BookCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); return; }
    try {
      await addToCart(book.bookId);
      toast.success(`"${book.title}" added to cart`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <Link to={`/books/${book.bookId}`}>
      <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow group">
        <div className="aspect-[2/3] overflow-hidden bg-muted">
          <img
            src={book.coverImageUrl || `https://placehold.co/200x300?text=${encodeURIComponent(book.title)}`}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="flex-1 p-4">
          <Badge variant="secondary" className="mb-2 text-xs">{book.genre}</Badge>
          <h3 className="font-semibold line-clamp-2 mb-1">{book.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
          <div className="flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span>{book.rating.toFixed(1)}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex items-center justify-between">
          <span className="font-bold text-lg">${book.price.toFixed(2)}</span>
          <Button size="sm" onClick={handleAddToCart} aria-label={`Add ${book.title} to cart`}>
            <ShoppingCart className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
