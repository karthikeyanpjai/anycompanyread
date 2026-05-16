import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Order } from '@anycompanyread/shared';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ orders: Order[] }>('/orders')
      .then(d => setOrders(d.orders))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="container py-8 max-w-3xl space-y-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
    </div>
  );

  return (
    <div className="container py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {error && <Alert variant="destructive" className="mb-6"><AlertDescription>{error}</AlertDescription></Alert>}

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">Your order history will appear here</p>
          <Link to="/books"><Button>Start Shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.orderId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-mono text-muted-foreground">
                    #{order.orderId.slice(0, 8).toUpperCase()}
                  </CardTitle>
                  <Badge variant={order.status === 'CONFIRMED' ? 'default' : 'destructive'}>
                    {order.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <span className="font-bold text-lg">${order.totalPrice.toFixed(2)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
