# Performance Test Instructions — AnyCompanyRead

## Scope

Demo-grade targets (not production SLAs):

| Metric | Target |
|--------|--------|
| API response time (p95) | < 1 second |
| Cold start Lambda | < 3 seconds (acceptable for demo) |
| Frontend initial load | < 3 seconds on broadband |
| Concurrent users | 10 simultaneous (demo scale) |

---

## Option A: Manual Smoke Test (Recommended for Demo)

Use `curl` with timing to verify response times:

```bash
export API_URL="https://<id>.execute-api.<region>.amazonaws.com/prod"

# Test books endpoint (most common, no auth)
time curl -s "$API_URL/books" > /dev/null

# Test book detail
BOOK_ID=$(curl -s "$API_URL/books" | jq -r '.books[0].bookId')
time curl -s "$API_URL/books/$BOOK_ID" > /dev/null
```

**Expected**: Both complete in under 1 second after warm-up.

---

## Option B: Load Test with `hey` (lightweight CLI tool)

### Install
```bash
# macOS
brew install hey

# Linux
wget https://hey-release.s3.us-east-2.amazonaws.com/hey_linux_amd64 -O hey && chmod +x hey
```

### Run load test against books endpoint
```bash
# 50 requests, 5 concurrent
hey -n 50 -c 5 "$API_URL/books"
```

**Expected output summary:**
```
Summary:
  Total:        ~5s
  Slowest:      ~800ms
  Fastest:      ~100ms
  Average:      ~300ms
  Requests/sec: ~10

Status code distribution:
  [200] 50 responses
```

### Run against frontend (CloudFront)
```bash
hey -n 100 -c 10 "https://<FrontendUrl>"
```

**Expected**: All 200s, average < 500ms (CloudFront cached).

---

## Option C: Lambda Cold Start Test

Lambda cold starts happen after ~15 minutes of inactivity. To measure:

```bash
# Wait 15+ minutes after last invocation, then:
time curl -s "$API_URL/books" > /dev/null
```

**Expected**: First call < 3s, subsequent calls < 500ms.

To eliminate cold starts for demo: enable Lambda Provisioned Concurrency in the CDK stack (adds cost).

---

## Performance Notes for Demo

- DynamoDB on-demand scales automatically — no tuning needed at demo scale
- CloudFront caches frontend assets globally — frontend loads fast worldwide
- Lambda ARM64 (Graviton2) is used — ~20% better price/performance vs x86
- esbuild bundling keeps Lambda package size small — faster cold starts
