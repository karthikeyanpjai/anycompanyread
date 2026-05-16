import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, error, TABLE_BOOKS, Book, ListBooksResponse } from '@anycompanyread/shared';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const bookId = event.pathParameters?.bookId;

  try {
    if (method === 'OPTIONS') return ok({});
    if (method === 'GET' && bookId) return getBook(bookId);
    if (method === 'GET') return listBooks(event);
    return error('Not found', 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return error(message, 500);
  }
};

async function listBooks(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { search, genre, limit = '20', nextToken } = event.queryStringParameters ?? {};
  const pageLimit = Math.min(parseInt(limit, 10), 100);

  const result = await ddb.send(new ScanCommand({
    TableName: TABLE_BOOKS,
    Limit: pageLimit,
    ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64').toString()) : undefined,
  }));

  let books = (result.Items ?? []) as Book[];

  // Client-side filtering for demo simplicity (no GSI needed)
  if (search) {
    const q = search.toLowerCase();
    books = books.filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q));
  }
  if (genre) {
    books = books.filter(b => b.genre === genre);
  }

  const response: ListBooksResponse = {
    books,
    totalCount: books.length,
    nextToken: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
      : undefined,
  };

  return ok(response);
}

async function getBook(bookId: string): Promise<APIGatewayProxyResult> {
  const result = await ddb.send(new GetCommand({ TableName: TABLE_BOOKS, Key: { bookId } }));
  if (!result.Item) return error('Book not found', 404);
  return ok({ book: result.Item as Book });
}
