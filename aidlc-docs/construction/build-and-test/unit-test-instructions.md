# Unit Test Execution — AnyCompanyRead

## Overview

Unit tests cover all 4 Lambda handlers using Jest + ts-jest with AWS SDK mocked.

| Handler | Test File | Tests |
|---------|-----------|-------|
| AuthHandler | `handlers/auth/auth.test.ts` | 4 |
| BooksHandler | `handlers/books/books.test.ts` | 4 |
| CartHandler | `handlers/cart/cart.test.ts` | 4 |
| OrdersHandler | `handlers/orders/orders.test.ts` | 4 |
| **Total** | | **16** |

---

## Run All Unit Tests

```bash
cd anycompanyread
npm run test --workspace=packages/backend
```

**Expected output:**
```
PASS handlers/auth/auth.test.ts
PASS handlers/books/books.test.ts
PASS handlers/cart/cart.test.ts
PASS handlers/orders/orders.test.ts

Test Suites: 4 passed, 4 total
Tests:       16 passed, 16 total
```

## Run a Single Test Suite

```bash
cd anycompanyread/packages/backend
npx jest handlers/auth/auth.test.ts --verbose
```

## Run with Coverage

```bash
cd anycompanyread/packages/backend
npx jest --coverage
```

Coverage report written to `packages/backend/coverage/`.

---

## What Each Suite Tests

### AuthHandler (`auth.test.ts`)
- `POST /auth/login` — returns 200 with tokens on success
- `POST /auth/signup` — returns 201 on success
- Unknown route — returns 404
- Cognito error — returns 500

### BooksHandler (`books.test.ts`)
- `GET /books` — returns book list
- `GET /books?search=test` — filters by title/author
- `GET /books/{bookId}` — returns 404 for missing book
- `GET /books/{bookId}` — returns book on success

### CartHandler (`cart.test.ts`)
- `GET /cart` — returns items with correct total price
- `POST /cart` — adds item (201)
- `DELETE /cart/{bookId}` — removes item
- No auth context — returns 401

### OrdersHandler (`orders.test.ts`)
- `POST /checkout` — creates order, returns 201
- `POST /checkout` with empty cart — returns 400
- `GET /orders` — returns order list
- `GET /orders/{orderId}` for missing order — returns 404

---

## Fixing Failing Tests

1. Check the error message in Jest output
2. Common causes:
   - Missing `process.env.*` — set in test file or jest config
   - Mock not reset between tests — add `beforeEach(() => mockSend.mockReset())`
   - Import order issue — ensure mocks are declared before imports
3. Re-run after fixing: `npm run test --workspace=packages/backend`
