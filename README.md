# NovaStore — e-commerce application (work in progress)

Modernization of an Angular e-commerce application originally developed collaboratively. Original work credited under [LICENSE](LICENSE).

> **Work in progress:** this is an audited starter, not a production-ready application. JSON Server is for local demos only. Do not deploy the current APIs publicly.

## Stack
Angular 16, TypeScript, Firebase Authentication, JSON Server, Express, Multer, Chart.js, Bootstrap.

## Local development
1. Install a compatible Node.js version for Angular 16 and install dependencies with `npm install` (regenerates the lockfile).
2. Create your own Firebase project and replace placeholder values in `src/environments/environment.ts`.
3. Start three terminals: `npm run api`, `npm run upload-api`, `npm start`.
4. Open `http://localhost:4200`.

## Security and roadmap
- Demo fixtures are synthetic. No original customer records or stored passwords are included.
- Admin permissions currently rely on frontend email checks: **not secure for production**.
- Upload API currently has no access control. The JSON Server is unauthenticated.
- Replace mock API with protected backend and server-side authorization before public deployment.
- Configure new hosting, tests, and CI/CD after security improvements.

## Credits
Based on a project originally developed with a colleague. Original MIT license and copyright notice preserved. New changes and individual contributions will be documented in subsequent commits.
