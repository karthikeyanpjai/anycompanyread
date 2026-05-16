import { APIGatewayProxyResult } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Content-Type': 'application/json',
};

/** Build a successful API Gateway response */
export function ok<T>(body: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body),
  };
}

/** Build an error API Gateway response */
export function error(message: string, statusCode = 500): APIGatewayProxyResult {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ message }),
  };
}

/** Extract userId from API Gateway authorizer context (Cognito JWT) */
export function getUserId(event: { requestContext?: { authorizer?: { claims?: { sub?: string } } | null } | null }): string {
  const sub = (event.requestContext?.authorizer as { claims?: { sub?: string } } | null | undefined)?.claims?.sub;
  if (!sub) throw new Error('Unauthorized: missing user identity');
  return sub;
}

/** Parse JSON body safely */
export function parseBody<T>(body: string | null): T {
  if (!body) throw new Error('Request body is required');
  return JSON.parse(body) as T;
}
