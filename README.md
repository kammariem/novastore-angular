# NovaStore

NovaStore is an Angular storefront backed by an Express REST API and PostgreSQL through Prisma. It is a personal evolution of an application originally developed collaboratively; the original author's attribution and MIT license are preserved in [LICENSE](LICENSE). The existing Angular design is retained. The application is a portfolio project and is not yet production-deployed.

## Stack

- Angular 16, TypeScript, Bootstrap
- Node.js 24, Express 4, Prisma 6
- PostgreSQL
- JWT access tokens, bcrypt password hashing, CLIENT / ADMIN server-side roles
- Express JWT authentication and application data use the REST API. JSON Server remains available only as an optional legacy fixture server; Firebase integration was removed after validating the Express authentication replacement.

## Local setup

Requirements: Node.js 24, npm, and a local PostgreSQL database named `novastore_db`. Create the database in PostgreSQL before applying migrations (for example, `CREATE DATABASE novastore_db;` in `psql` or pgAdmin), then put the matching local role/password in `.env`. Never point the seed/import commands at a production database.

1. Install dependencies: `npm ci`.
2. Copy `.env.example` to `.env` and configure `DATABASE_URL`, the API port/host, and allowed frontend origins. `.env` is ignored by Git.
3. Generate a local JWT signing key without printing it: `npm run env:jwt-secret`. The generated value is written only to the ignored `.env` file.
4. Generate Prisma and apply the checked-in, non-destructive migrations:

   ```powershell
   npm run prisma:generate
   npm run prisma:validate
   npm run db:migrate
   ```

5. Load fictional catalog data and the strictly checked demo-order snapshots:

   ```powershell
   npm run db:seed
   npm run db:import-demo-orders
   ```

   The order importer is restricted to local `novastore_db`, imports only records whose email/name/address look like placeholders, skips existing order IDs, and never changes product stock. It does not import legacy users or passwords.

6. Start the Express API and Angular in separate terminals:

   ```powershell
   npm run api
   npm start
   ```

   Open `http://localhost:4200`. Express binds to `127.0.0.1:3001`. JSON Server is optional and remains available with `npm run api:json` on port 3000 for legacy fixture access; Angular services no longer use it. `npm run upload-api` is retained as a compatibility alias for the Express server.

7. Create an account through the registration form. To grant administrator access to an existing local account, run:

   ```powershell
   npm run admin:promote -- registered-email@example.test --confirm
   ```

   This command changes only the role of an existing active account in local `novastore_db`; there is no seeded or hard-coded administrator account.

The Express health endpoints are `GET /api/health` and `GET /api/db-health` on port 3001. Express binds to `127.0.0.1` by default.

## API

The Express API listens on `http://127.0.0.1:3001/api` by default. Responses use JSON; product and category list routes return arrays unless pagination is requested.

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Public; creates CLIENT only |
| `POST` | `/api/auth/login` | Public; limited to 10 attempts per 15 minutes per process |
| `GET` | `/api/auth/me` | Authenticated |
| `GET` | `/api/products`, `/api/products/:id` | Public |
| `POST`, `PUT`, `PATCH`, `DELETE` | `/api/products[/:id]` | ADMIN |
| `GET` | `/api/categories`, `/api/categories/:id` | Public |
| `POST`, `PUT`, `PATCH`, `DELETE` | `/api/categories[/:id]` | ADMIN |
| `GET` | `/api/orders`, `/api/orders/:id` | Authenticated; clients see only their orders |
| `POST` | `/api/orders` | Authenticated; price and stock are checked by the server |
| `PATCH` | `/api/orders/:id` | ADMIN; status transitions enforced |
| `GET`, `PATCH`, `DELETE` | `/api/users[/:id]` | ADMIN; deletion deactivates the account |
| `POST` | `/api/upload` | ADMIN; 5 MB limit, image signatures checked |

Product/category list responses remain frontend-compatible arrays; optional catalog pagination returns `{ data, total, page, limit, totalPages }`. Order totals and line prices are recalculated from PostgreSQL, and stock changes happen transactionally. Cancelling an order restores stock once; delivered/cancelled orders are terminal.

Authenticated requests send `Authorization: Bearer <token>`. Registration accepts `name`, `email`, `password` (12-72 UTF-8 bytes), and optional `phone`/`address`; both registration and login return `{ user, token }`. Registration always creates a `CLIENT`.

Create orders with only product identifiers and quantities; client email, prices, and totals are taken or recomputed by the server:

```json
{
  "clientName": "Client",
  "clientPhone": "55512345",
  "clientAddress": "Delivery address",
  "items": [{ "productId": "product-id", "quantity": 2 }]
}
```

Allowed order transitions are `En attente` -> `Confirmée` or `Annulée`, `Confirmée` -> `En préparation` or `Annulée`, and `En préparation` -> `Livrée` or `Annulée`. Invalid payloads return HTTP 400, missing resources 404, unauthorized/forbidden access 401/403, conflicts (including insufficient stock) 409, and unexpected server errors a generic 500 response. Uploads use multipart field `image`.

The cart is stored in browser `localStorage` rather than a shared JSON Server collection. The legacy `db.json` is retained unchanged. Demo orders are imported with no account linkage; legacy JSON users/clients are not imported because they have no Node password credentials.

Client checkout remains at `/orders`; signed-in clients can view their PostgreSQL-backed order history at `/my-orders` (also linked from the navigation).

## Security notes

- Set a fresh `JWT_SECRET` for every environment; keep it out of source control. Tokens expire after 15 minutes by default and are stored in browser `sessionStorage`.
- Registration never accepts a role. ADMIN authorization is checked against the current PostgreSQL user record on every protected request.
- The upload endpoint requires ADMIN authorization and validates file signatures; the API still defaults to localhost. Use TLS, a production secret manager, persistent upload storage, and deployment-specific rate limiting before public exposure.
- Firebase was removed after frontend and API authentication tests passed. JSON Server is not used by the storefront and is retained only as an optional legacy fixture command.
- `npm audit fix` was run without `--force`; it could not clear the remaining findings. The audit on 2026-10-17 reported 59 vulnerabilities (33 high, 19 moderate, 7 low; none critical), including 11 in production dependencies (7 high, 4 moderate). Run `npm audit` for current counts.
- Recommended dependency migration (not applied): upgrade Angular one major at a time from 16 through 20, keeping framework, CLI, compiler, and build tooling aligned. Angular 20.3.32 accepts TypeScript `>=5.8 <6.0`; TypeScript 5.9.x and the existing RxJS 7 line are compatible candidates, with `zone.js` moved from 0.13 to the Angular 20-compatible 0.15 line. Use a supported Node version for each intermediate Angular major and run build/tests at every step.
- Keep Prisma 6 CLI and Client aligned at 6.19.3 until a dedicated Prisma 7 migration. Prisma 7.10.1 supports the project's Node 24 runtime, but requires adopting its PostgreSQL driver adapter (`@prisma/adapter-pg` 7.10.1 plus `pg`) and removing the datasource URL from `schema.prisma` (it already exists in `prisma.config.ts`). Validate generated-client, migration, seed, and runtime behavior on an isolated database before rollout. Do not combine this with Angular changes.

## Captures d’écran à ajouter

Add optimized screenshots under `docs/screenshots/` for the responsive storefront, cart/checkout, and administrator dashboard. No screenshots are included yet.

## Verification

```powershell
npm run prisma:validate
npx prisma migrate status
npm run test:api
npm test -- --watch=false --browsers=ChromeHeadless
npm run build
npm audit
```

GitHub Actions runs schema validation/generation, API and Angular tests, and the production build. It does not deploy or access secrets; it does not currently start PostgreSQL or run migrations against a live database.
