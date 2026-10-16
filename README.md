# NovaStore — e-commerce application (work in progress)

Modernization of an Angular e-commerce application originally developed collaboratively. Original work credited under [LICENSE](LICENSE).

> **Work in progress:** this is an audited starter, not a production-ready application. JSON Server is for local demos only. Do not deploy the current APIs publicly.

## Stack
Angular 16, TypeScript, Firebase Authentication, JSON Server, Express, Multer, Chart.js, Bootstrap.

## Local development
1. Install a compatible Node.js version for Angular 16 and install dependencies with `npm install` (regenerates the lockfile).
2. Create your own Firebase project and replace placeholder values in `src/environments/environment.ts`.
3. Copy `.env.example` to `.env` and set your local PostgreSQL credentials in `DATABASE_URL`; adjust the upload API host, port, or allowed CORS origins if needed. Never commit `.env`.
4. Install dependencies with `npm install`, validate and generate Prisma with `npm run prisma:validate` and `npm run prisma:generate`, then apply checked-in migrations with `npm run db:migrate`.
5. Optionally import the fictional categories and products using `npm run db:seed`. This does not import users, clients, orders, or passwords from `db.json`.
6. Start three terminals: `npm run api`, `npm run upload-api`, `npm start`.
7. Open `http://localhost:4200`.

The Express database probe is available at `http://localhost:3001/api/db-health`. It is separate from `/api/health`; Angular services continue to use JSON Server.

## Security and roadmap
- Demo fixtures are synthetic. No original customer records or stored passwords are included.
- Admin permissions currently rely on frontend email checks: **not secure for production**.
- Upload API currently has no access control. It is bound to localhost by default, validates image signatures and size, and is **not secure or ready for production exposure**. The JSON Server is unauthenticated.
- Prisma/PostgreSQL is currently prepared for local persistence and database health checks; Angular is not connected to it yet.
- Replace mock API with protected backend and server-side authorization before public deployment.
- Configure new hosting, tests, and CI/CD after security improvements.

## Credits
Based on a project originally developed with a colleague. Original MIT license and copyright notice preserved. New changes and individual contributions will be documented in subsequent commits.
