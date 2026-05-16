import { APIGatewayProxyEvent } from 'aws-lambda';

// mockSend must be defined before jest.mock factory runs
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProviderClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  SignUpCommand: jest.fn().mockImplementation((input: unknown) => input),
  InitiateAuthCommand: jest.fn().mockImplementation((input: unknown) => input),
  ForgotPasswordCommand: jest.fn().mockImplementation((input: unknown) => input),
  ConfirmForgotPasswordCommand: jest.fn().mockImplementation((input: unknown) => input),
  AuthFlowType: { USER_PASSWORD_AUTH: 'USER_PASSWORD_AUTH' },
}));

process.env.COGNITO_CLIENT_ID = 'test-client-id';

// Import AFTER mocks are set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handler } = require('./index');

const makeEvent = (path: string, method: string, body: object): Partial<APIGatewayProxyEvent> => ({
  path,
  httpMethod: method,
  body: JSON.stringify(body),
  requestContext: {} as never,
});

describe('AuthHandler', () => {
  beforeEach(() => mockSend.mockReset());

  it('returns 200 on successful login', async () => {
    mockSend.mockResolvedValueOnce({
      AuthenticationResult: { IdToken: 'id', AccessToken: 'access', RefreshToken: 'refresh' },
    });
    const res = await handler(makeEvent('/auth/login', 'POST', { email: 'a@b.com', password: 'pass' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveProperty('idToken', 'id');
  });

  it('returns 201 on successful signup', async () => {
    mockSend.mockResolvedValueOnce({});
    const res = await handler(makeEvent('/auth/signup', 'POST', { email: 'a@b.com', password: 'pass', name: 'Alice' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(201);
  });

  it('returns 404 for unknown route', async () => {
    const res = await handler(makeEvent('/auth/unknown', 'GET', {}) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(404);
  });

  it('returns 500 on Cognito error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Cognito error'));
    const res = await handler(makeEvent('/auth/login', 'POST', { email: 'a@b.com', password: 'bad' }) as APIGatewayProxyEvent);
    expect(res.statusCode).toBe(500);
  });
});
