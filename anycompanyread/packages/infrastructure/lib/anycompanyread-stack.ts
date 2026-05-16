import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
import * as path from 'path';

export class AnyCompanyReadStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ── Cognito ──────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: 'anycompanyread-users',
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: { minLength: 8, requireDigits: false, requireSymbols: false, requireUppercase: false },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      authFlows: { userPassword: true, userSrp: true },
      generateSecret: false,
    });

    // ── DynamoDB Tables ───────────────────────────────────────────────────────
    const booksTable = new dynamodb.Table(this, 'BooksTable', {
      tableName: 'Books',
      partitionKey: { name: 'bookId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cartsTable = new dynamodb.Table(this, 'CartsTable', {
      tableName: 'Carts',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'bookId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: 'Orders',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const orderItemsTable = new dynamodb.Table(this, 'OrderItemsTable', {
      tableName: 'OrderItems',
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'bookId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── Lambda shared config ──────────────────────────────────────────────────
    const backendDir = path.join(__dirname, '../../backend');
    const commonEnv = {
      TABLE_BOOKS: booksTable.tableName,
      TABLE_CARTS: cartsTable.tableName,
      TABLE_ORDERS: ordersTable.tableName,
      TABLE_ORDER_ITEMS: orderItemsTable.tableName,
      COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
    };
    const lambdaDefaults: Partial<lambdaNodejs.NodejsFunctionProps> = {
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: cdk.Duration.seconds(30),
      bundling: { minify: true, sourceMap: false, externalModules: ['@aws-sdk/*'] },
      environment: commonEnv,
    };

    // ── Lambda Functions ──────────────────────────────────────────────────────
    const authFn = new lambdaNodejs.NodejsFunction(this, 'AuthHandler', {
      ...lambdaDefaults,
      entry: path.join(backendDir, 'handlers/auth/index.ts'),
      handler: 'handler',
    });
    userPool.grant(authFn, 'cognito-idp:SignUp', 'cognito-idp:InitiateAuth', 'cognito-idp:ForgotPassword', 'cognito-idp:ConfirmForgotPassword');

    const booksFn = new lambdaNodejs.NodejsFunction(this, 'BooksHandler', {
      ...lambdaDefaults,
      entry: path.join(backendDir, 'handlers/books/index.ts'),
      handler: 'handler',
    });
    booksTable.grantReadData(booksFn);

    const cartFn = new lambdaNodejs.NodejsFunction(this, 'CartHandler', {
      ...lambdaDefaults,
      entry: path.join(backendDir, 'handlers/cart/index.ts'),
      handler: 'handler',
    });
    cartsTable.grantReadWriteData(cartFn);
    booksTable.grantReadData(cartFn);

    const ordersFn = new lambdaNodejs.NodejsFunction(this, 'OrdersHandler', {
      ...lambdaDefaults,
      entry: path.join(backendDir, 'handlers/orders/index.ts'),
      handler: 'handler',
    });
    ordersTable.grantReadWriteData(ordersFn);
    orderItemsTable.grantReadWriteData(ordersFn);
    cartsTable.grantReadWriteData(ordersFn);

    // ── API Gateway ───────────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'anycompanyread-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [userPool],
    });
    const authRequired = { authorizer: cognitoAuthorizer, authorizationType: apigateway.AuthorizationType.COGNITO };

    // /auth routes (public)
    const authResource = api.root.addResource('auth');
    const authIntegration = new apigateway.LambdaIntegration(authFn);
    authResource.addResource('signup').addMethod('POST', authIntegration);
    authResource.addResource('login').addMethod('POST', authIntegration);
    authResource.addResource('forgot-password').addMethod('POST', authIntegration);
    authResource.addResource('confirm-forgot-password').addMethod('POST', authIntegration);

    // /books routes (public)
    const booksResource = api.root.addResource('books');
    const booksIntegration = new apigateway.LambdaIntegration(booksFn);
    booksResource.addMethod('GET', booksIntegration);
    booksResource.addResource('{bookId}').addMethod('GET', booksIntegration);

    // /cart routes (authenticated)
    const cartResource = api.root.addResource('cart');
    const cartIntegration = new apigateway.LambdaIntegration(cartFn);
    cartResource.addMethod('GET', cartIntegration, authRequired);
    cartResource.addMethod('POST', cartIntegration, authRequired);
    const cartItem = cartResource.addResource('{bookId}');
    cartItem.addMethod('PUT', cartIntegration, authRequired);
    cartItem.addMethod('DELETE', cartIntegration, authRequired);

    // /checkout + /orders routes (authenticated)
    const ordersIntegration = new apigateway.LambdaIntegration(ordersFn);
    api.root.addResource('checkout').addMethod('POST', ordersIntegration, authRequired);
    const ordersResource = api.root.addResource('orders');
    ordersResource.addMethod('GET', ordersIntegration, authRequired);
    ordersResource.addResource('{orderId}').addMethod('GET', ordersIntegration, authRequired);

    // ── S3 + CloudFront (Frontend) ────────────────────────────────────────────
    const frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      errorResponses: [{ httpStatus: 404, responseHttpStatus: 200, responsePagePath: '/index.html' }],
    });

    // Deploy frontend build output (run `npm run build` in packages/frontend first)
    const frontendBuildPath = path.join(__dirname, '../../frontend/dist');
    new s3deploy.BucketDeployment(this, 'FrontendDeployment', {
      sources: [s3deploy.Source.asset(frontendBuildPath)],
      destinationBucket: frontendBucket,
      distribution,
      distributionPaths: ['/*'],
    });

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'ApiUrl', { value: api.url, description: 'API Gateway URL' });
    new cdk.CfnOutput(this, 'FrontendUrl', { value: `https://${distribution.distributionDomainName}`, description: 'Frontend URL' });
    new cdk.CfnOutput(this, 'UserPoolId', { value: userPool.userPoolId, description: 'Cognito User Pool ID' });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: userPoolClient.userPoolClientId, description: 'Cognito Client ID' });
  }
}
