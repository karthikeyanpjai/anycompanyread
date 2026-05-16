# AnyCompanyRead

A demo online book e-commerce platform built on AWS Serverless with a polished React frontend.

## Architecture

```
React SPA (Vite + shadcn/ui + Tailwind)
        |
   CloudFront + S3
        |
   API Gateway (REST)
   |    |    |    |
Auth  Books Cart Orders
Lambda Lambda Lambda Lambda
   |    |    |    |
Cognito  DynamoDB (4 tables)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS |
| Backend | AWS Lambda (TypeScript), API Gateway |
| Auth | Amazon Cognito (email/password) |
| Database | Amazon DynamoDB (on-demand) |
| Infrastructure | AWS CDK (TypeScript) |
| Hosting | S3 + CloudFront |

## Project Structure

```
anycompanyread/
├── packages/
│   ├── shared/          # Shared TypeScript types, constants, utils
│   ├── backend/
│   │   ├── handlers/
│   │   │   ├── auth/    # Cognito signup/login Lambda
│   │   │   ├── books/   # Book catalog Lambda
│   │   │   ├── cart/    # Shopping cart Lambda
│   │   │   └── orders/  # Checkout & orders Lambda
│   │   └── scripts/
│   │       └── seed.ts  # DynamoDB seed script
│   ├── frontend/        # React SPA
│   └── infrastructure/  # CDK stack
└── package.json         # npm workspaces root
```

## Prerequisites

- Node.js 18+
- AWS CLI configured (`aws configure`)
- AWS CDK bootstrapped (`cdk bootstrap`)

## Setup & Deploy

### 1. Install dependencies

```bash
cd anycompanyread
npm install
```

### 2. Build shared and backend packages

```bash
npm run build --workspace=packages/shared
npm run build --workspace=packages/backend
```

### 3. Build the frontend

```bash
cd packages/frontend
npm run build
```

### 4. Deploy to AWS

```bash
cd packages/infrastructure
npm run deploy
```

CDK will output:
- `ApiUrl` — paste this as `VITE_API_URL` in the frontend
- `FrontendUrl` — your CloudFront URL
- `UserPoolId` / `UserPoolClientId` — Cognito identifiers

### 5. Seed the book catalog

```bash
cd packages/backend
TABLE_BOOKS=Books npx ts-node scripts/seed.ts
```

## Local Development

```bash
# Start frontend dev server (set VITE_API_URL to your deployed API)
VITE_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod npm run dev
```

## Running Tests

```bash
npm run test --workspace=packages/backend
```

## Features

- Browse and search book catalog with genre filtering
- User registration and login via Amazon Cognito
- Shopping cart (add, update quantity, remove)
- Checkout creates an order and clears the cart
- Order history
- Dark / light mode toggle
- Fully responsive (mobile, tablet, desktop)
- Loading skeletons and toast notifications

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/signup | No | Register |
| POST | /auth/login | No | Login |
| GET | /books | No | List/search books |
| GET | /books/{bookId} | No | Book detail |
| GET | /cart | Yes | Get cart |
| POST | /cart | Yes | Add to cart |
| PUT | /cart/{bookId} | Yes | Update quantity |
| DELETE | /cart/{bookId} | Yes | Remove item |
| POST | /checkout | Yes | Place order |
| GET | /orders | Yes | List orders |
| GET | /orders/{orderId} | Yes | Order detail |

## Cost

Designed to stay within or near AWS Free Tier for demo usage:
- DynamoDB on-demand (pay per request)
- Lambda (1M free requests/month)
- API Gateway (1M free calls/month)
- S3 + CloudFront (minimal storage/transfer)
