# AnyCompanyRead - Code Generation Plan

## Unit Context
- **Unit Name**: anycompanyread (single unit, full system)
- **Project Type**: Greenfield Monorepo
- **Output Directory**: `/home/ec2-user/environment/anycompanyread/`
- **Architecture**: AWS Serverless (API Gateway + Lambda + DynamoDB + Cognito + S3 + CloudFront)
- **Frontend**: React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend**: AWS Lambda (TypeScript) x4 handlers
- **Infrastructure**: AWS CDK (TypeScript)

## Dependencies
- packages/shared must be built before packages/backend and packages/frontend
- packages/backend and packages/frontend must be built before packages/infrastructure
- Infrastructure bundles Lambda code and references frontend build output

## Stories Covered
- FR-1: User Authentication (AuthHandler + Frontend Auth pages)
- FR-2: Book Catalog (BooksHandler + Frontend Books pages)
- FR-3: Shopping Cart & Checkout (CartHandler + OrdersHandler + Frontend Cart/Orders pages)
- FR-4: Frontend Experience & Polish (shadcn/ui, dark mode, responsive, toasts, skeletons)

---

## Step 1: Monorepo Root Setup
- [ ] Create `anycompanyread/package.json` (npm workspaces: packages/*)
- [ ] Create `anycompanyread/tsconfig.base.json` (shared TS config)
- [ ] Create `anycompanyread/.gitignore`
- [ ] Create `anycompanyread/.nvmrc`

## Step 2: packages/shared
- [ ] Create `packages/shared/package.json`
- [ ] Create `packages/shared/tsconfig.json`
- [ ] Create `packages/shared/src/types.ts` (Book, CartItem, Order, OrderItem, User interfaces)
- [ ] Create `packages/shared/src/constants.ts` (table names, API paths)
- [ ] Create `packages/shared/src/utils.ts` (response helpers, error helpers)
- [ ] Create `packages/shared/src/index.ts` (barrel export)

## Step 3: packages/backend - AuthHandler
- [ ] Create `packages/backend/package.json`
- [ ] Create `packages/backend/tsconfig.json`
- [ ] Create `packages/backend/handlers/auth/index.ts` (signup, login, forgotPassword, confirmForgotPassword)
- [ ] Create `packages/backend/handlers/auth/auth.test.ts` (unit tests)

## Step 4: packages/backend - BooksHandler
- [ ] Create `packages/backend/handlers/books/index.ts` (listBooks, getBook)
- [ ] Create `packages/backend/handlers/books/books.test.ts` (unit tests)

## Step 5: packages/backend - CartHandler
- [ ] Create `packages/backend/handlers/cart/index.ts` (getCart, addToCart, updateCartItem, removeFromCart)
- [ ] Create `packages/backend/handlers/cart/cart.test.ts` (unit tests)

## Step 6: packages/backend - OrdersHandler
- [ ] Create `packages/backend/handlers/orders/index.ts` (checkout, listOrders, getOrder)
- [ ] Create `packages/backend/handlers/orders/orders.test.ts` (unit tests)

## Step 7: packages/frontend
- [ ] Create `packages/frontend/package.json` (React, Vite, shadcn/ui, Tailwind, React Router)
- [ ] Create `packages/frontend/tsconfig.json`
- [ ] Create `packages/frontend/vite.config.ts`
- [ ] Create `packages/frontend/tailwind.config.ts`
- [ ] Create `packages/frontend/postcss.config.js`
- [ ] Create `packages/frontend/index.html`
- [ ] Create `packages/frontend/src/main.tsx`
- [ ] Create `packages/frontend/src/App.tsx` (router setup, theme provider)
- [ ] Create `packages/frontend/src/index.css` (Tailwind directives + CSS variables)
- [ ] Create `packages/frontend/src/lib/utils.ts` (cn helper)
- [ ] Create `packages/frontend/src/lib/api.ts` (API client with auth headers)
- [ ] Create `packages/frontend/src/components/ui/` (shadcn/ui components: button, card, input, badge, skeleton, alert, dialog, toast, dropdown-menu, select, table, separator, avatar)
- [ ] Create `packages/frontend/src/components/Navbar.tsx`
- [ ] Create `packages/frontend/src/components/ThemeProvider.tsx`
- [ ] Create `packages/frontend/src/components/BookCard.tsx`
- [ ] Create `packages/frontend/src/components/ProtectedRoute.tsx`
- [ ] Create `packages/frontend/src/contexts/AuthContext.tsx`
- [ ] Create `packages/frontend/src/contexts/CartContext.tsx`
- [ ] Create `packages/frontend/src/pages/HomePage.tsx`
- [ ] Create `packages/frontend/src/pages/BooksPage.tsx`
- [ ] Create `packages/frontend/src/pages/BookDetailPage.tsx`
- [ ] Create `packages/frontend/src/pages/LoginPage.tsx`
- [ ] Create `packages/frontend/src/pages/SignupPage.tsx`
- [ ] Create `packages/frontend/src/pages/CartPage.tsx`
- [ ] Create `packages/frontend/src/pages/OrdersPage.tsx`

## Step 8: packages/infrastructure
- [ ] Create `packages/infrastructure/package.json`
- [ ] Create `packages/infrastructure/tsconfig.json`
- [ ] Create `packages/infrastructure/cdk.json`
- [ ] Create `packages/infrastructure/bin/app.ts` (CDK app entry)
- [ ] Create `packages/infrastructure/lib/anycompanyread-stack.ts` (full CDK stack)

## Step 9: Seed Data Script
- [ ] Create `packages/backend/scripts/seed.ts` (populate DynamoDB Books table with 12 sample books)

## Step 10: README and Documentation
- [ ] Create `anycompanyread/README.md` (setup, architecture, deploy instructions)
- [ ] Create `aidlc-docs/construction/anycompanyread/code/summary.md` (code generation summary)

---

## Completion Criteria
- All steps marked [x]
- All packages buildable (tsc compiles without errors)
- Infrastructure stack deployable via `cdk deploy`
- Frontend runnable via `npm run dev`
- Seed script executable
