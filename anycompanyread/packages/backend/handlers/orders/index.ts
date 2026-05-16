import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, GetCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { ok, error, getUserId, TABLE_CARTS, TABLE_ORDERS, TABLE_ORDER_ITEMS, CartItem, Order, OrderItem } from '@anycompanyread/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const orderId = event.pathParameters?.orderId;
  const path = event.path;

  try {
    if (method === 'OPTIONS') return ok({});
    const userId = getUserId(event);

    if (path.endsWith('/checkout') && method === 'POST') return checkout(userId);
    if (method === 'GET' && orderId) return getOrder(userId, orderId);
    if (method === 'GET') return listOrders(userId);

    return error('Not found', 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const statusCode = message.startsWith('Unauthorized') ? 401 : 500;
    return error(message, statusCode);
  }
};

async function checkout(userId: string): Promise<APIGatewayProxyResult> {
  // 1. Fetch cart items
  const cartResult = await ddb.send(new QueryCommand({
    TableName: TABLE_CARTS,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));

  const cartItems = (cartResult.Items ?? []) as CartItem[];
  if (cartItems.length === 0) return error('Cart is empty', 400);

  // 2. Create order
  const orderId = uuidv4();
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const order: Order = {
    userId,
    orderId,
    totalPrice: Math.round(totalPrice * 100) / 100,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };

  await ddb.send(new PutCommand({ TableName: TABLE_ORDERS, Item: order }));

  // 3. Create order items
  const orderItems: OrderItem[] = cartItems.map(item => ({
    orderId,
    bookId: item.bookId,
    quantity: item.quantity,
    price: item.price,
    title: item.title,
  }));

  for (const item of orderItems) {
    await ddb.send(new PutCommand({ TableName: TABLE_ORDER_ITEMS, Item: item }));
  }

  // 4. Clear cart (batch delete)
  if (cartItems.length > 0) {
    const deleteRequests = cartItems.map(item => ({
      DeleteRequest: { Key: { userId, bookId: item.bookId } },
    }));
    await ddb.send(new BatchWriteCommand({
      RequestItems: { [TABLE_CARTS]: deleteRequests },
    }));
  }

  return ok({ order }, 201);
}

async function listOrders(userId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLE_ORDERS,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
    ScanIndexForward: false, // newest first
  }));

  return ok({ orders: result.Items ?? [] });
}

async function getOrder(userId: string, orderId: string): Promise<APIGatewayProxyResult> {
  const orderResult = await ddb.send(new GetCommand({
    TableName: TABLE_ORDERS,
    Key: { userId, orderId },
  }));

  if (!orderResult.Item) return error('Order not found', 404);

  const itemsResult = await ddb.send(new QueryCommand({
    TableName: TABLE_ORDER_ITEMS,
    KeyConditionExpression: 'orderId = :oid',
    ExpressionAttributeValues: { ':oid': orderId },
  }));

  return ok({ order: orderResult.Item as Order, items: itemsResult.Items ?? [] });
}
