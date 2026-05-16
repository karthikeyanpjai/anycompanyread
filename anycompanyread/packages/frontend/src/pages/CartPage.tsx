import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export function CartPage() {
  const { items, totalPrice, updateQuantity, removeItem, checkout } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      await checkout();
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch {
      toast.error('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (items.length === 0) return (
    <div className="container py-16 text-center">
      <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6">Add some books to get started</p>
      <Link to="/books"><Button>Browse Books</Button></Link>
    </div>
  );

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.bookId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img src={item.coverImageUrl || `https://placehold.co/40x60`} alt={item.title} className="w-10 h-14 object-cover rounded" />
                      <span className="font-medium line-clamp-2">{item.title}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.bookId, item.quantity - 1)}>-</Button>
                      <span className="w-6 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.bookId, item.quantity + 1)}>+</Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">${(item.price * item.quantity).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => removeItem(item.bookId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Card className="lg:w-72 h-fit">
          <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {items.map(item => (
              <div key={item.bookId} className="flex justify-between text-sm">
                <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">{item.title} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={handleCheckout} disabled={checkingOut}>
              {checkingOut ? 'Placing Order...' : 'Place Order'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
