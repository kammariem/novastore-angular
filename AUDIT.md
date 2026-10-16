# Initial static audit — 2026-10-16

**Scope:** source inspection only. No successful compilation, runtime test, dependency audit or penetration test claimed.

## Confirmed findings
- Firebase Auth is used for sign-in; admin identification is a frontend hard-coded email (`src/app/services/auth.service.ts`).
- Angular route guards restrict the interface but are not backend authorization.
- JSON Server exposes local demo resources without application-level access control.
- Express upload endpoint does not authenticate requests; only MIME prefix and 5 MiB size are checked. Verify actual content server-side in a hardened version.
- Frontend services use localhost URLs directly.
- Original fixture `db.json` included plaintext passwords and identifying contact data, replaced here by demonstration values and removal of password properties.
- Original repository included Angular cache and a nested source archive. Both omitted.
- Original Firebase project binding and deployment workflow removed; new Firebase settings required.
- Legacy MIT license retained, including original copyright attribution.

## Before publication
- Review all remaining files for sensitive data, copied assets, third-party rights and absolute URLs.
- Check source ownership and attribution.
- Run `npm install`, `npm run build`, test suite and dependency audits in a development environment.
- Review user-registration, checkout/order data ownership, authentication and upload permissions.
- Build a production backend before public deployment.
