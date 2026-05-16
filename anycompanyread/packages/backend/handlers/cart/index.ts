import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, PutCommand, UpdateCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, error, getUserId, parseBody, TABLE_CARTS, TABLE_BOOKS, CartItem, CartResponse, Book } from '@anycompanyread/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const bookId = event.pathParameters?.bookId;

  try {
    if (method === 'OPTIONS') return ok({});
    const userId = getUserId(event);

    if (method === 'GET') return getCart(userId);
    if (method === 'POST') return addToCart(userId, event);
    if (method === 'PUT' && bookId) return updateCartItem(userId, bookId, event);
    if (method === 'DELETE' && bookId) return removeFromCart(userId, bookId);

    return error('Not found', 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    const statusCode = message.startsWith('Unauthorized') ? 401 : 500;
    return error(message, statusCode);
  }
};

async function getCart(userId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(new QueryCommand({
    TableName: TABLE_CARTS,
    KeyConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': userId },
  }));

  const items = (result.Items ?? []) as CartItem[];
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const response: CartResponse = { items, totalPrice: Math.round(totalPrice * 100) / 100 };
  return ok(response);
}

async function addToCart(userId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { bookId, quantity = 1 } = parseBody<{ bookId: string; quantity?: number }>(event.body);

  // Fetch book details for denormalization
  const bookResult = await ddb.send(new GetCommand({ TableName: TABLE_BOOKS, Key: { bookId } }));
  if (!bookResult.Item) return error('Book not found', 404);
  const book = bookResult.Item as Book;

  const item: CartItem = {
    userId,
    bookId,
    quantity,
    title: book.title,
    price: book.price,
    coverImageUrl: book.coverImageUrl,
  };

  await ddb.send(new PutCommand({ TableName: TABLE_CARTS, Item: item }));
  return ok({ item }, 201);
}

async function updateCartItem(userId: string, bookId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { quantity } = parseBody<{ quantity: number }>(event.body);
  if (quantity < 1) return removeFromCart(userId, bookId);

  const result = await ddb.send(new UpdateCommand({
    TableName: TABLE_CARTS,
    Key: { userId, bookId },
    UpdateExpression: 'SET quantity = :q',
    ExpressionAttributeValues: { ':q': quantity },
    ReturnValues: 'ALL_NEW',
  }));

  return ok({ item: result.Attributes as CartItem });
}

async function removeFromCart(userId: string, bookId: string): Promise<APIGatewayProxyResult> {
  await ddb.send(new DeleteCommand({ TableName: TABLE_CARTS, Key: { userId, bookId } }));
  return ok({ message: 'Item removed from cart' });
}
