# Sathi Cafe

This is the website I built for Sathi Cafe at Rajmarga Chauraha, Butwal. Customers can look at the menu, build an order and send it on WhatsApp, or reserve a table. The owner runs the menu, reservations and messages from an admin dashboard.

Frontend is React 19 + Vite + Tailwind CSS 4. Backend is Node.js + Express + MongoDB (in `server/`).

## Folder layout

```
sathi-cafe/
├── src/                  frontend
│   ├── data/cafe.js      cafe name, address, phone, hours, WhatsApp number, social links
│   ├── data/menu.js      starter menu, only used by the seed script
│   ├── data/images.js    fallback photos matched by item name
│   ├── pages/            Home, Menu, About, Contact, AdminLogin, AdminDashboard
│   ├── components/       Navbar, Footer, ItemPhoto, DialogBox, Reveal, ProtectedRoute
│   ├── hooks/            useDialog
│   └── services/api.js   API helper (reads VITE_API_URL)
├── public/images/        menu photos
├── public/logo.png       logo shown in the navbar
└── server/               backend API
```

## Running it locally

You need Node.js 18+ and a MongoDB database (Atlas works fine).

Backend first. Create `server/.env` with the variables below, then:

```bash
cd server
npm install
npm run dev
```

Then the frontend, in a second terminal from the project root:

```bash
npm install
npm run dev
```

The site opens at http://localhost:5173. In dev, Vite forwards `/api` to the backend on port 5000.

## Environment variables

Backend (`server/.env`):

| Variable | What it does |
|---|---|
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | long random string used to sign admin login tokens |
| `PORT` | optional, defaults to 5000 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | only used by `npm run admin` to create or reset the admin login |
| `NODE_ENV` | set to `production` on the live server |
| `CLIENT_ORIGIN` | live site address(es), comma-separated, like `https://yourdomain.com,https://www.yourdomain.com` |

Frontend (set on the hosting platform, used at build time):

| Variable | What it does |
|---|---|
| `VITE_API_URL` | backend address, like `https://your-api.example.com` (no trailing slash, no `/api`). Leave empty in dev. |

`server/.env` is in `.gitignore`. Don't commit it.

## Admin dashboard

Login is at `/admin/login` and the dashboard is at `/admin`.

To create or reset the admin account, put `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `server/.env`, run `npm run admin` inside `server/`, then delete `ADMIN_PASSWORD` from the file.

The three tabs:
- **Reservations:** confirm, cancel and delete. Confirmed and cancelled bookings can be undone from the same button.
- **Messages:** read and delete.
- **Menu:** add items, edit price, edit image, hide or show, delete.

## Menu and images

Menu items live in the database and get edited from the dashboard. An item's photo comes from its own image link if it has one. If not, the site looks in `src/data/images.js` for a photo matching the item's exact name, and if that fails it shows an emoji placeholder.

To use a photo from the project, drop the file into `public/images/` and put `/images/filename.webp` as the image link. That needs a redeploy to go live.

`npm run seed` (inside `server/`) loads the starter menu from `src/data/menu.js`. It skips if the menu already has items, only wipes the menu if you pass `--force`, and refuses to run when `NODE_ENV=production`.

## Orders, reservations and contact details

All the customer-facing details (address, phone, hours, WhatsApp number, social links) are in `src/data/cafe.js`. If any of them change, also update the description and structured data in `index.html`.

- **Orders:** customers add items on the Menu page and tap "Order on WhatsApp", which opens WhatsApp with the order already written. They still have to press Send, and orders aren't saved in the dashboard.
- **Reservations:** saved in the database (so they show in the dashboard), and the customer can also send the details on WhatsApp.
- Bookable slots (9:00 AM to 11:30 PM) are set at the top of `src/pages/Contact.jsx`. The "is this in the past" check uses Nepal time (UTC+5:45), in `server/routes/reservations.js`.

## Deploying

1. Database: MongoDB Atlas, in the cafe's own account. Turn on backups.
2. Backend: any Node host. Start command is `npm start` inside `server/`. Set the backend variables above.
3. Frontend: `npm run build`, host the `dist/` folder, set `VITE_API_URL`. The host has to send every route to `index.html` (a `vercel.json` rewrite on Vercel, or a `public/_redirects` file on Netlify), otherwise refreshing `/menu` or `/admin` gives a 404.
4. Then test the live site: menu loads, both forms submit, admin login works, the WhatsApp order opens.

## Scripts

Frontend (project root): `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.
Backend (`server/`): `npm start`, `npm run dev`, `npm run seed`, `npm run admin`.
