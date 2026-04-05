# Finance Data Processing and Access Control Backend

Built by **Me(Hemavathy K)** for the Zorvyn Backend Developer Intern assignment.

This is a REST API backend for a finance dashboard. It handles user login, role-based access control, financial record management, and dashboard analytics.

---

## Tech Stack

- **Node.js + Express** — I went with this because it's straightforward to structure and easy to test manually with tools like Postman.
- **SQLite via sql.js** — I initially tried better-sqlite3 but it requires Python and native build tools on Windows which caused install errors. sql.js is a pure JavaScript port of SQLite so it works without any of that. It reads the DB file from disk on startup, runs everything in memory, and writes back on every change.
- **JWT (jsonwebtoken)** — for stateless authentication. Tokens expire after 8 hours.
- **bcryptjs** — for hashing passwords before storing them.
- **uuid** — for generating unique IDs for users and records.
- **express-rate-limit** — added a basic rate limiter on all routes, stricter on login to prevent brute force.

---

## Project Structure

```
finance-backend/
├── src/
│   ├── app.js                    # entry point, sets up express and routes
│   ├── controllers/              # handles request/response for each route group
│   ├── services/                 # actual business logic lives here
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication + role checking
│   │   └── validate.js           # input validation
│   ├── models/
│   │   └── db.js                 # database setup using sql.js
│   ├── routes/                   # route definitions
│   └── utils/
│       └── seed.js               # script to add demo users and sample records
├── tests/
│   └── test.js                   # integration tests
├── package.json
└── README.md
```
---

## How to Run

### Prerequisites
- Node.js v18 or higher

### Steps

```In command prompt
# 1. install dependencies
npm install

# 2. add demo data (creates 3 users and 15 sample records)
npm run seed

# 3. start the server
npm start
```

Server runs at `http://localhost:3000`

To check it's working: `http://localhost:3000/health`

Swagger API docs (interactive): `http://localhost:3000/api-docs`

### Run Tests

Open a second terminal while the server is running and run:

```In command prompt
npm test
```

All 27 tests should pass.

---

### Demo Users (after seeding)

- The admin account uses the email `admin@finance.com` and the password `admin123`.

- The analyst account uses the email `analyst@finance.com` and the password `analyst123`.

- The viewer account uses the email `viewer@finance.com` and the password `viewer123`.


## Roles and What They Can Do
```
| Action                        | Viewer | Analyst | Admin |
|-------------------------------|:------:|:-------:|:-----:|
| Login                         | ✅     | ✅      | ✅    |
| View records                  | ✅     | ✅      | ✅    |
| Filter records                | ✅     | ✅      | ✅    |
| Create records                | ❌     | ✅      | ✅    |
| Update records                | ❌     | ❌      | ✅    |
| Delete records                | ❌     | ❌      | ✅    |
| View dashboard summary        | ✅     | ✅      | ✅    |
| View category / trend data    | ❌     | ✅      | ✅    |
| Manage users                  | ❌     | ❌      | ✅    |
```
---

## API Endpoints

### Auth

- POST `/api/auth/register` → This is used to create a new user account.

- POST `/api/auth/login` → This lets a user log in and receive a token for authentication.

- GET `/api/auth/me` → This retrieves information about the currently logged‑in user.

### Records

- GET `/api/records` → This lists all records. It also supports filters and pagination so you can narrow down or page through results.

- GET `/api/records/:id` → This fetches the details of a single record by its ID.

- POST `/api/records` → This creates a new record in the system.

- PATCH `/api/records/:id` → This updates an existing record, identified by its ID.

- DELETE `/api/records/:id` → This performs a soft delete, meaning the record is marked as deleted but not permanently removed.

- Filter options for GET `/api/records`:
`?type=income`, `?category=rent`, `?from=2026-01-01`, `?to=2026-04-30`, `?page=1`, `?limit=20`

### Dashboard

- GET `/api/dashboard/summary` → Returns the overall totals: income, expenses, and the net balance.

- GET `/api/dashboard/categories` → Shows totals grouped by each category (like food, travel, etc.).

- GET `/api/dashboard/trends/monthly` → Provides a monthly comparison of income versus expenses.

- GET `/api/dashboard/trends/weekly` → Provides a weekly comparison of income versus expenses.

- GET `/api/dashboard/recent` → Lists the most recent records added.

### Users (admin only)

- GET `/api/users` → Retrieves a list of all users in the system.

- GET `/api/users/:id` → Fetches the details of a single user by their ID.

- PATCH `/api/users/:id` → Updates a user’s role or status, identified by their ID.

---

## Decisions I Made

- **Why soft delete?** For financial data it makes sense to keep a record of everything even if something is "deleted". I set a `deleted_at` timestamp instead of removing the row so there's always an audit trail. All queries filter it out automatically.

- **Why can analysts create records?** The assignment said analysts can "view records and access insights" which I read as needing to be active participants, not just read-only observers. So I gave them create access but kept update and delete restricted to admins only.

- **Why sql.js instead of better-sqlite3?** I ran into a build error on Windows during setup because better-sqlite3 needs Python and Visual C++ tools to compile native bindings. sql.js is pure JavaScript so it installs without any of that. The tradeoff is that it loads the whole database into memory on startup, which is fine for this scale.

- **Why JWT?** It's stateless so I don't need any session storage. The token expires after 8 hours which felt like a reasonable session length for a dashboard app.

- **Validation** — I handle all input validation in middleware before it even reaches the service layer. Each field gets its own validator function and all errors are collected and returned together so the user doesn't have to fix one thing at a time.