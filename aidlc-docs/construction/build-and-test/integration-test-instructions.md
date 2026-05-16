# Integration Test Instructions — AnyCompanyRead

## Prerequisites

- AWS stack deployed (`cdk deploy` complete)
- CDK outputs captured: `ApiUrl`, `UserPoolId`, `UserPoolClientId`
- Books table seeded (`npx ts-node scripts/seed.ts`)
- `curl` or a REST client (Postman, Insomnia, etc.)

```bash
# Set these from your CDK outputs
export API_URL="https://<id>.execute-api.<region>.amazonaws.com/prod"
export USER_POOL_CLIENT_ID="<client-id>"
```

---

## Scenario 1: Auth Flow

### 1a. Sign Up
```bash
curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```
**Expected**: `{"message":"Signup successful..."}`

> Note: Cognito sends a confirmation email. For demo, disable email verification in the Cognito console (User Pool → Sign-in experience → Confirmation → Allow Cognito to automatically send messages).

### 1b. Login
```bash
ID_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234"}' \
  | jq -r '.idToken')
echo "Token: $ID_TOKEN"
```
**Expected**: JWT token string returned.

---

## Scenario 2: Book Catalog

### 2a. List books
```bash
curl -s "$API_URL/books" | jq '.totalCount'
```
**Expected**: `12` (after seeding)

### 2b. Search books
```bash
curl -s "$API_URL/books?search=dune" | jq '.books[].title'
```
**Expected**: `"Dune"`

### 2c. Filter by genre
```bash
curl -s "$API_URL/books?genre=Fantasy" | jq '[.books[].title]'
```
**Expected**: `["The Name of the Wind", "The Hobbit"]`

### 2d. Get book by ID
```bash
BOOK_ID=$(curl -s "$API_URL/books" | jq -r '.books[0].bookId')
curl -s "$API_URL/books/$BOOK_ID" | jq '.book.title'
```
**Expected**: Book title string.

---

## Scenario 3: Cart (requires auth token from Scenario 1b)

### 3a. Add to cart
```bash
curl -s -X POST "$API_URL/cart" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bookId\":\"$BOOK_ID\",\"quantity\":1}"
```
**Expected**: `{"item":{...}}` with status 201.

### 3b. View cart
```bash
curl -s "$API_URL/cart" -H "Authorization: $ID_TOKEN" | jq '{items: .items | length, total: .totalPrice}'
```
**Expected**: `{"items": 1, "total": <price>}`

### 3c. Update quantity
```bash
curl -s -X PUT "$API_URL/cart/$BOOK_ID" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":2}'
```
**Expected**: Updated item with `quantity: 2`.

### 3d. Remove from cart
```bash
curl -s -X DELETE "$API_URL/cart/$BOOK_ID" -H "Authorization: $ID_TOKEN"
```
**Expected**: `{"message":"Item removed from cart"}`

---

## Scenario 4: Checkout & Orders

### 4a. Add item back, then checkout
```bash
# Add item
curl -s -X POST "$API_URL/cart" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bookId\":\"$BOOK_ID\",\"quantity\":1}"

# Checkout
ORDER=$(curl -s -X POST "$API_URL/checkout" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')
echo $ORDER | jq '.order.status'
```
**Expected**: `"CONFIRMED"`

### 4b. Verify cart is cleared
```bash
curl -s "$API_URL/cart" -H "Authorization: $ID_TOKEN" | jq '.items | length'
```
**Expected**: `0`

### 4c. List orders
```bash
curl -s "$API_URL/orders" -H "Authorization: $ID_TOKEN" | jq '.orders | length'
```
**Expected**: `1`

---

## Scenario 5: Auth Guard

### 5a. Access protected endpoint without token
```bash
curl -s -o /dev/null -w "%{http_code}" "$API_URL/cart"
```
**Expected**: `401`

---

## Frontend Integration Test

1. Open `https://<FrontendUrl>` in a browser
2. Verify the home page loads with featured books
3. Navigate to `/books` — confirm book grid renders
4. Click a book — confirm detail page loads
5. Sign up / log in — confirm auth flow works
6. Add a book to cart — confirm toast notification appears and cart badge updates
7. Go to `/cart` — confirm items and total display correctly
8. Click "Place Order" — confirm redirect to `/orders` with order listed
