import { APIGatewayProxyEvent } from 'aws-lambda';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: jest.fn().mockReturnValue({ send: mockSend }) },
  QueryCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  DeleteCommand: jest.fn(),
  GetCommand: jest.fn(),
}));

process.env.TABLE_CARTS = 'Carts';
process.env.TABLE_BOOKS = 'Books';

import { handler } from './index';

const userId = 'user-123';
const makeEvent = (method: string, body?: object, params?: Record<string, string>): Partial<APIGatewayProxyEvent> => ({
  httpMethod: method,
  pathParameters: params ?? null,
  queryStringParameters: null,
  body: body ? JSON.stringify(body) : null,
  requestContext: { authorizer: { claims: { sub: userId } } } as never,
});

const sampleItem = { userId, bookId: 'book-1', quantity: 2, title: 'Test', price: 9.99, coverImageUrl: '' };

describe('CartHandler', () => {
  beforeEach(() => mockSend.mockReset());

  it('returns cart items with total price', async () => {
    mockSend.mockResolvedValueOnce({ Items: [sampleItem] });
    const res = await handler(makeEvent('GET') as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.items).toHaveLength(1);
    expect(body.totalPrice).toBe(19.98);
  });

  it('adds item to cart', async () => {
    mockSend
      .mockResolvedValueOnce({ Item: { bookId: 'book-1', title: 'Test', price: 9.99, coverImageUrl: '' } })
      .mockResolvedValueOnce({});
    const res = await handler(makeEvent('POST', { bookId: 'book-1', quantity: 1 }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(201);
  });

  it('removes item from cart', async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await handler(makeEvent('DELETE', undefined, { bookId: 'book-1' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).message).toContain('removed');
  });

  it('returns 401 when no auth context', async () => {
    const event = { ...makeEvent('GET'), requestContext: {} } as APIGatewayProxyEvent;
    const res = await handler(event);
    expect(res.statusCode).toBe(401);
  });
});
