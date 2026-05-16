import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  AuthFlowType,
} from '@aws-sdk/client-cognito-identity-provider';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ok, error, parseBody } from '@anycompanyread/shared';

const cognito = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const path = event.path;
  const method = event.httpMethod;

  try {
    if (method === 'OPTIONS') return ok({});

    if (path.endsWith('/signup') && method === 'POST') return await signup(event);
    if (path.endsWith('/login') && method === 'POST') return await login(event);
    if (path.endsWith('/forgot-password') && method === 'POST') return await forgotPassword(event);
    if (path.endsWith('/confirm-forgot-password') && method === 'POST') return await confirmForgotPassword(event);

    return error('Not found', 404);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return error(message, 500);
  }
};

async function signup(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { email, password, name } = parseBody<{ email: string; password: string; name: string }>(event.body);

  await cognito.send(new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'name', Value: name },
    ],
  }));

  return ok({ message: 'Signup successful. Please check your email to confirm your account.' }, 201);
}

async function login(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { email, password } = parseBody<{ email: string; password: string }>(event.body);

  const result = await cognito.send(new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  }));

  const tokens = result.AuthenticationResult;
  return ok({
    idToken: tokens?.IdToken,
    accessToken: tokens?.AccessToken,
    refreshToken: tokens?.RefreshToken,
  });
}

async function forgotPassword(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { email } = parseBody<{ email: string }>(event.body);

  await cognito.send(new ForgotPasswordCommand({ ClientId: CLIENT_ID, Username: email }));
  return ok({ message: 'Password reset code sent to your email.' });
}

async function confirmForgotPassword(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { email, code, newPassword } = parseBody<{ email: string; code: string; newPassword: string }>(event.body);

  await cognito.send(new ConfirmForgotPasswordCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  }));

  return ok({ message: 'Password reset successful.' });
}
