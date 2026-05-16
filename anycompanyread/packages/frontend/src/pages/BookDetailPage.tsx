import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, ShoppingCart, ArrowLeft, BookOpen } from 'lucide-react';
import { Book } from '@anycompanyread/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    api.get<{ book: Book }>(`/books/${bookId}`)
      .then(d => setBook(d.book))
      .catch(() => setError('Book not found'))
      .finally(() => setLoading(false));
  }, [bookId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login to add items to cart'); navigate('/login'); return; }
    try {
      await addToCart(book!.bookId);
      toast.success(`"${book!.title}" added to cart`);
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) return (
    <div className="container py-8 max-w-4xl">
      <div className="flex gap-8">
        <Skeleton className="w-48 aspect-[2/3] rounded-lg shrink-0" />
        <div className="flex-1 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );

  if (error || !book) return (
    <div className="container py-8">
      <Alert variant="destructive"><AlertDescription>{error || 'Book not found'}</AlertDescription></Alert>
    </div>
  );

  return (
    <div className="container py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col md:flex-row gap-8">
        <img
          src={book.coverImageUrl || `https://placehold.co/200x300?text=${encodeURIComponent(book.title)}`}
          alt={book.title}
          className="w-48 aspect-[2/3] object-cover rounded-lg shadow-lg shrink-0 self-start"
        />

        <div className="flex-1">
          <Badge variant="secondary" className="mb-3">{book.genre}</Badge>
          <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
          <p className="text-xl text-muted-foreground mb-3">by {book.author}</p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{book.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>{book.pageCount} pages</span>
            </div>
            <span className="text-muted-foreground">{book.publishedYear}</span>
          </div>

          <Separator className="my-4" />
          <p className="text-muted-foreground leading-relaxed mb-6">{book.description}</p>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">${book.price.toFixed(2)}</span>
            <Button size="lg" onClick={handleAddToCart} className="gap-2">
              <ShoppingCart className="h-5 w-5" /> Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
