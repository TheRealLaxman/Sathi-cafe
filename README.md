# Sathi Cafe

Website for Sathi Cafe at Rajmarga Chauraha, Butwal. Customers can browse the menu, place an order, reserve a table and send a message. The owner manages everything from the admin dashboard.

Frontend: React 19 + Vite + Tailwind CSS 4. Backend: Node.js + Express + MongoDB. In development, Vite proxies `/api` and `/uploads` to the backend.

## Folder layout

```
sathi-cafe/
├── src/                  frontend
│   ├── data/cafe.js      name, address, phone, hours, WhatsApp number, social links
│   ├── data/menu.js      starter menu (only used by seed)
│   ├── data/images.js    fallback photos matched by item name
│   ├── pages/            Home, Menu, About, Contact, admin pages
│   ├── components/       Navbar, Footer, ItemPhoto, DialogBox, Reveal, ProtectedRoute, admin/
│   ├── config/roles.js   role → permission map (shared naming with server)
│   ├── context/          AuthProvider (identity + permissions)
│   ├── hooks/            useDialog
│   └── services/api.js   fetch wrapper (cookies, token refresh)
├── public/images/        built-in menu photos
├── public/logo.webp      compressed navbar logo
├── server/
│   ├── app.js            Express app (routes, security middleware)
│   ├── server.js         DB connection + listener + graceful shutdown
│   ├── config/           db, env, roles, upload directory
│   ├── models/           MenuItem, Order, Reservation, Message, User, AuditLog
│   ├── routes/           auth, menu, orders, reservations, messages, uploads, admins, audit
│   ├── middleware/       auth, authorize, csrf, validation, rate limits, error handler
│   ├── services/         notify.js (owner/customer), audit.js (activity log)
│   └── utils/            mailer, env helpers
└── .env.example          frontend env template
```

## Running locally

Need Node.js 20+ and a MongoDB database (Atlas works).

1. Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI` and `JWT_SECRET`. Leave `NODE_ENV` unset so cookies are not marked Secure on localhost.
2. Backend: `cd server && npm install && npm run dev`
3. Frontend, in a second terminal: `npm install && npm run dev`

Site: http://localhost:5173. Vite proxies `/api` and `/uploads` to the backend on port 5000. `/uploads` is proxied in dev too — Vite config includes it.

Create the owner once with `cd server && npm run admin` after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. Remove `ADMIN_PASSWORD` afterwards. For an existing database from the single-admin version, run `npm run admins:migrate` once to mark the current account as Owner.

## Environment variables

Backend (`server/.env`):

| Variable | What it does |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | long random string used to sign short-lived admin access tokens |
| `PORT` | optional, defaults to 5000 |
| `HOST` | defaults to `127.0.0.1`; use a reverse proxy for public access |
| `NODE_ENV` | `production` enables Secure cookies, enforced CSP and generic errors |
| `CLIENT_ORIGIN` | site address, comma-separated; used for CORS and CSRF origin checks |
| `SITE_URL` | public site address used in password-reset emails |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only for `npm run admin`; delete `ADMIN_PASSWORD` after use |
| `ADMIN_ROLE` | role assigned by `npm run admin`, default `owner` |
| `AUDIT_RETENTION_DAYS` | how long activity log entries are kept, default 180 |
| `OWNER_EMAIL` | where owner alerts and admin security notices go |
| `OWNER_WHATSAPP` | number included in owner alert links |
| `RESERVATION_CAPACITY` | total guests allowed per 30-minute slot, default 20 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | email delivery for password reset and notifications |

Frontend (`.env` at the project root, used at build time):

| Variable | What it does |
|---|---|
| `VITE_API_URL` | leave empty when the API is served from the same origin; set only if it is on another domain |

`server/.env` and uploaded files are gitignored. Never commit them.

## Admin dashboard and roles

Login at `/admin/login`, dashboard at `/admin`. Tabs are filtered by role, and every API route checks the same permissions again on the server.

| Role | Access |
|---|---|
| **Owner** | Everything, including Staff and Activity; can assign any role. |
| **Manager** | Reservations, Messages, Orders, Menu, Uploads, Staff (non-owner accounts) and read-only Activity. Cannot create managers/owners or modify owners. |
| **Kitchen** | Orders only: view and advance status. |
| **Front Desk** | Reservations (view, confirm, cancel) and Messages (view, delete). |
| **Content** | Menu and photo uploads only. |

- **Reservations:** confirm, cancel, undo and delete (delete is Owner/Manager only). Emailed customers are notified when a booking is confirmed or cancelled.
- **Messages:** read and delete.
- **Orders:** see saved orders with server-checked prices, advance status (new → preparing → ready → completed), cancel and delete (delete is Owner/Manager only). Ready/cancelled orders email the customer if they gave an email.
- **Menu:** add and fully edit items (name, category, price, description, tags, image, availability), upload photos, hide/show and delete.
- **Staff:** Owners and Managers add admins, change roles, deactivate/reactivate, reset passwords, and permanently delete accounts. Role changes, deactivation and deletion end that admin's sessions immediately. Deletion cannot be undone, but the Activity log keeps the record. You cannot delete yourself or the last active Owner.
- **Activity:** Owners and Managers see logins, failed logins, role/password changes, deactivations and destructive admin actions. Entries are kept for `AUDIT_RETENTION_DAYS`.
- **Account:** any admin can change their own password; this signs them out everywhere.

Login uses httpOnly, Secure, SameSite=Strict cookies. Access tokens last 15 minutes; refresh tokens last 7 days, are stored hashed, rotate on use, and reuse is detected and revoked. Roles are read from the database on every request, not trusted from the cookie, so role changes take effect immediately. Every state-changing request must send `X-Requested-With: XMLHttpRequest` (the frontend does this automatically).

## Menu and images

An item's photo comes from its own image link. If empty, the site looks for a built-in photo by name in `src/data/images.js`, then falls back to a category emoji.

Admins can upload JPG/PNG/WEBP/GIF up to 5 MB from the Menu tab. Uploads are resized, stripped of metadata and saved as WebP in `server/uploads/`. The directory must be writable by the service user and is proxied at `/uploads`. Use **Remove image** to clear an item's photo; unused uploaded photos can be permanently deleted with the × on their thumbnail. A photo still used by a menu item cannot be deleted until it is removed from that item.

`npm run seed` inside `server/` loads the starter menu. It skips if items already exist, wipes only with `--force`, and refuses to run with `NODE_ENV=production`.

## Orders, reservations and contact details

All customer-facing details live in `src/data/cafe.js`. Keep the description and structured data in `index.html`/`public/structured-data.js` in sync.

- **Orders:** customers build a cart (saved in localStorage), enter their details, and the server re-checks prices and availability before saving. They can then send the order on WhatsApp. Orders appear in the admin dashboard.
- **Reservations:** saved in the database with an optional email. Slots run 09:00–23:30 Nepal time. Duplicate bookings and over-capacity slots are rejected.
- **Messages:** saved in the database and emailed to the owner.

Owner notifications always include a WhatsApp link. Customer notifications need SMTP. If `SMTP_HOST` is empty, the Forgot-password page explains that the owner must reset the password manually, and no email is sent.

## Deployment checklist

- Build the frontend with `npm run build` and serve the generated `dist/` directory.
- Run the API with `NODE_ENV=production`, a production `server/.env`, and a writable `server/uploads/` directory.
- Route `/api` and `/uploads` to the API, or set `VITE_API_URL` at build time if the API is on another origin.
- Create the owner with `npm run admin`, run `npm run admins:migrate` if upgrading an older database, then remove `ADMIN_PASSWORD`.
- `/api/health` returns 200 only when MongoDB is connected; use it for monitoring.

## Handover runbook

- **Create/reset the owner:** set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `server/.env`, run `npm run admin` in `server/`, then delete `ADMIN_PASSWORD`. This also revokes existing sessions.
- **Upgrade an older single-admin database:** run `npm run admins:migrate` once in `server/`; it promotes the original bootstrap account (the one with no `createdBy`) to Owner.
- **Add staff:** sign in as Owner or Manager, open **Staff**, and create the account with the correct role. Managers may only assign Kitchen, Front Desk and Content.
- **Deactivate staff:** use the Staff tab. Their sessions are revoked and they cannot log in or refresh.
- **Delete staff:** use **Delete** in the Staff tab. This permanently removes the account and revokes every session; it cannot be undone, but the Activity log keeps a record. You cannot delete yourself or the last active Owner.
- **Reset another admin:** use the Staff tab. Password resets end that admin's sessions.
- **Password reset when email is configured:** `/admin/forgot-password` sends a 30-minute link.
- **Password reset when email is not configured:** use `npm run admin` as above, or have an Owner/Manager reset it from the Staff tab.
- **Backups:** enable automated MongoDB Atlas backups and test a restore before handover.
- **Logs:** collect API logs from your process manager; reverse-proxy logs come from your proxy.
- **Client content to confirm:** real Instagram/Facebook URLs and public phone number in `src/data/cafe.js` (the WhatsApp number is currently different), opening hours, SMTP credentials, and the owner email.

## Tests and CI

- Backend: `cd server && npm test` (API tests use an in-memory MongoDB).
- Frontend: `npm test` (Vitest + React Testing Library).
- Lint/build: `npm run lint`, `npm run build`.
- GitHub Actions runs lint, tests and the build on every push and pull request.

## Scripts

Frontend: `npm run dev`, `npm run build`, `npm run lint`, `npm test`, `npm run preview`.
Backend: `npm start`, `npm run dev`, `npm run seed`, `npm run admin`, `npm run admins:migrate`, `npm test`.
