import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen } from 'lucide-react';
import { Book } from '@anycompanyread/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BookCard } from '@/components/BookCard';
import { Skeleton } from '@/components/ui/skeleton';

export function HomePage() {
  const [featured, setFeatured] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ books: Book[] }>('/books?limit=4')
      .then(d => setFeatured(d.books))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-20 px-4">
        <div className="container max-w-3xl text-center mx-auto">
          <div className="flex justify-center mb-6">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            Your Next Great Read Awaits
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Discover thousands of books across every genre. From bestsellers to hidden gems.
          </p>
          <Link to="/books">
            <Button size="lg" className="gap-2">
              Browse Catalog <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Featured Books */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Books</h2>
          <Link to="/books"><Button variant="ghost" className="gap-1">View all <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[2/3] w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            : featured.map(book => <BookCard key={book.bookId} book={book} />)
          }
        </div>
      </section>
    </div>
  );
}
