import { APIGatewayProxyEvent } from 'aws-lambda';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: jest.fn().mockReturnValue({ send: mockSend }) },
  QueryCommand: jest.fn(),
  PutCommand: jest.fn(),
  GetCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  BatchWriteCommand: jest.fn(),
}));
jest.mock('uuid', () => ({ v4: () => 'test-order-id' }));

process.env.TABLE_CARTS = 'Carts';
process.env.TABLE_ORDERS = 'Orders';
process.env.TABLE_ORDER_ITEMS = 'OrderItems';

import { handler } from './index';

const userId = 'user-123';
const makeEvent = (method: string, path: string, params?: Record<string, string>): Partial<APIGatewayProxyEvent> => ({
  httpMethod: method,
  path,
  pathParameters: params ?? null,
  queryStringParameters: null,
  body: null,
  requestContext: { authorizer: { claims: { sub: userId } } } as never,
});

const cartItem = { userId, bookId: 'book-1', quantity: 1, title: 'Test', price: 10.00, coverImageUrl: '' };

describe('OrdersHandler', () => {
  beforeEach(() => mockSend.mockReset());

  it('creates order from cart on checkout', async () => {
    mockSend
      .mockResolvedValueOnce({ Items: [cartItem] }) // getCart
      .mockResolvedValueOnce({})                    // putOrder
      .mockResolvedValueOnce({})                    // putOrderItem
      .mockResolvedValueOnce({});                   // batchDelete cart
    const res = await handler(makeEvent('POST', '/checkout') as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).order.orderId).toBe('test-order-id');
  });

  it('returns 400 when cart is empty on checkout', async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });
    const res = await handler(makeEvent('POST', '/checkout') as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(400);
  });

  it('lists orders for user', async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ orderId: 'o1', userId, totalPrice: 10, status: 'CONFIRMED', createdAt: '' }] });
    const res = await handler(makeEvent('GET', '/orders') as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).orders).toHaveLength(1);
  });

  it('returns 404 for missing order', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    const res = await handler(makeEvent('GET', '/orders/missing', { orderId: 'missing' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(404);
  });
});
