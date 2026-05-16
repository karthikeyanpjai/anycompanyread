# Build Instructions — AnyCompanyRead

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 18+ | Use `.nvmrc` — run `nvm use` |
| npm | 9+ | Included with Node 18 |
| AWS CLI | 2.x | Configured with deploy credentials |
| AWS CDK | 2.x | `npm install -g aws-cdk` |

## Environment Variables

| Variable | Where Used | Description |
|----------|-----------|-------------|
| `AWS_REGION` | CDK, seed script | Target AWS region (e.g. `us-east-1`) |
| `CDK_DEFAULT_ACCOUNT` | CDK | Your AWS account ID |
| `VITE_API_URL` | Frontend build | API Gateway URL (from CDK output) |

---

## Build Steps

### 1. Install all dependencies

```bash
cd anycompanyread
npm install
```

This installs dependencies for all workspaces (shared, backend, frontend, infrastructure) via npm workspaces.

### 2. Build packages/shared

```bash
npm run build --workspace=packages/shared
```

Must be built first — backend and frontend depend on its compiled types.

**Expected output**: `packages/shared/dist/` created with `.js` and `.d.ts` files.

### 3. Build packages/backend

```bash
npm run build --workspace=packages/backend
```

**Expected output**: `packages/backend/dist/` created.

### 4. Build packages/frontend

```bash
# Set the API URL from your CDK deploy output (or use a placeholder for now)
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod \
  npm run build --workspace=packages/frontend
```

**Expected output**: `packages/frontend/dist/` created with `index.html` and hashed JS/CSS bundles.

### 5. Build packages/infrastructure

```bash
npm run build --workspace=packages/infrastructure
```

**Expected output**: `packages/infrastructure/dist/` created.

### 6. CDK Bootstrap (first time only)

```bash
cd packages/infrastructure
npx cdk bootstrap aws://<ACCOUNT_ID>/<REGION>
```

### 7. Deploy to AWS

```bash
cd packages/infrastructure
npm run deploy
```

**Expected CDK outputs:**
```
AnyCompanyReadStack.ApiUrl = https://<id>.execute-api.<region>.amazonaws.com/prod/
AnyCompanyReadStack.FrontendUrl = https://<id>.cloudfront.net
AnyCompanyReadStack.UserPoolId = <region>_<id>
AnyCompanyReadStack.UserPoolClientId = <client-id>
```

### 8. Rebuild frontend with real API URL, then redeploy

```bash
VITE_API_URL=<ApiUrl from step 7> npm run build --workspace=packages/frontend
cd packages/infrastructure && npm run deploy
```

---

## Troubleshooting

### `Cannot find module '@anycompanyread/shared'`
Build shared first: `npm run build --workspace=packages/shared`

### `ENOENT: no such file or directory, packages/frontend/dist`
Build the frontend before deploying: `npm run build --workspace=packages/frontend`

### CDK deploy fails with `ExpiredTokenException`
Refresh AWS credentials: `aws sso login` or re-run `aws configure`

### Tailwind classes not applied
Ensure `postcss.config.js` and `tailwind.config.ts` are present in `packages/frontend/`.
