import { APIGatewayProxyEvent } from 'aws-lambda';

const mockSend = jest.fn();
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: { from: jest.fn().mockReturnValue({ send: mockSend }) },
  ScanCommand: jest.fn(),
  GetCommand: jest.fn(),
}));

process.env.TABLE_BOOKS = 'Books';

import { handler } from './index';

const makeEvent = (method: string, params?: Record<string, string>, query?: Record<string, string>): Partial<APIGatewayProxyEvent> => ({
  httpMethod: method,
  pathParameters: params ?? null,
  queryStringParameters: query ?? null,
  body: null,
  requestContext: {} as never,
});

const sampleBook = { bookId: '1', title: 'Test Book', author: 'Author', genre: 'Fiction', price: 9.99 };

describe('BooksHandler', () => {
  beforeEach(() => mockSend.mockReset());

  it('lists books successfully', async () => {
    mockSend.mockResolvedValueOnce({ Items: [sampleBook], Count: 1 });
    const res = await handler(makeEvent('GET') as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).books).toHaveLength(1);
  });

  it('filters books by search term', async () => {
    mockSend.mockResolvedValueOnce({ Items: [sampleBook, { ...sampleBook, title: 'Other' }], Count: 2 });
    const res = await handler(makeEvent('GET', undefined, { search: 'test' }) as APIGatewayProxyEvent);
    expect(JSON.parse(res.body).books).toHaveLength(1);
  });

  it('returns 404 for missing book', async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });
    const res = await handler(makeEvent('GET', { bookId: 'missing' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(404);
  });

  it('returns book by id', async () => {
    mockSend.mockResolvedValueOnce({ Item: sampleBook });
    const res = await handler(makeEvent('GET', { bookId: '1' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).book.bookId).toBe('1');
  });
});
