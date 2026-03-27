# Expense API

A RESTful API for personal expense tracking with JWT-based authentication, built with Node.js, Express, Prisma, and PostgreSQL.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [API Reference](#api-reference)
  - [Health Check](#health-check)
  - [Auth](#auth)
  - [Expenses](#expenses)
- [Validation & Error Handling](#validation--error-handling)
- [Postman Collection](#postman-collection)

---

## Features

- JWT authentication for signup/login flows
- Per-user expense data isolation (users can access only their own expenses)
- Expense CRUD endpoints with category/date validation
- Date filtering for expenses: `past_week`, `past_month`, `last_3_months`, or `custom`
- Input validation with Zod for auth, expenses, and query filters
- Security hardening with Helmet and CORS support
- Password hashing with bcrypt (`12` salt rounds)
- Cascade delete from `User` to related `Expense` records

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` |
| Validation | `zod` |
| Security | `helmet`, `cors` |
| Environment Config | `dotenv` |
| Dev Server | `nodemon` |

---

## Project Structure

```text
expense-api/
├── server.js                           # App entry point
├── prisma/
│   ├── schema.prisma                   # Prisma models + enum
│   └── migrations/                     # Migration history
├── src/
│   ├── app.js                          # Express app setup + middleware
│   ├── config/
│   │   └── prisma.js                   # Prisma client singleton
│   ├── controllers/
│   │   ├── auth.controller.js          # Signup/login handlers
│   │   └── expense.controller.js       # Expense CRUD handlers
│   ├── middlewares/
│   │   ├── auth.middleware.js          # JWT auth guard
│   │   └── errorHandler.middleware.js  # Central error handling
│   ├── routes/
│   │   ├── index.js                    # Route aggregator (/auth, /expenses)
│   │   ├── auth.routes.js
│   │   └── expense.routes.js
│   └── validators/
│       ├── auth.validators.js
│       └── expense.validators.js
├── expense-api.postman_collection.json
└── .env.example
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (local or hosted)

### Installation

```bash
git clone <repo-url>
cd expense-api
npm install
cp .env.example .env
```

Update `.env` values, then run:

```bash
npm run db:migrate
npm run dev
```

The server runs on `http://localhost:3000` by default.

---

## Environment Variables

Create a `.env` file in project root:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/expense_tracker"
JWT_SECRET="change-this-to-a-long-random-secret-in-production"
JWT_EXPIRES_IN="7d"
```

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | Runtime mode (`development`/`production`) |
| `PORT` | No | API port (default `3000`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key used to sign JWT tokens |
| `JWT_EXPIRES_IN` | No | Token expiry duration (default `7d`) |

---

## Database Setup

```bash
# Apply migrations (dev) and regenerate Prisma client
npm run db:migrate

# Generate Prisma client only
npm run db:generate

# Prisma Studio
npm run db:studio
```

### Prisma Schema Overview

**User**

| Field | Type | Notes |
|---|---|---|
| `id` | String (CUID) | Primary key |
| `name` | String | Required |
| `email` | String | Unique |
| `password` | String | bcrypt hash |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Expense**

| Field | Type | Notes |
|---|---|---|
| `id` | String (CUID) | Primary key |
| `title` | String | Required |
| `amount` | Float | Positive |
| `category` | Enum | See `Category` values |
| `date` | DateTime | Required |
| `description` | String? | Optional |
| `userId` | String | FK to `User` (cascade delete) |
| `createdAt` | DateTime | Auto-set |
| `updatedAt` | DateTime | Auto-updated |

**Category enum**

`FOOD`, `TRANSPORT`, `ENTERTAINMENT`, `HEALTH`, `UTILITIES`, `OTHER`

---

## API Reference

**Base URL:** `http://localhost:3000`

Routes are mounted under `/api`, except health check.

### Health Check

#### `GET /health`

Response `200`:

```json
{
  "status": "ok",
  "timestamp": "2026-03-08T12:00:00.000Z"
}
```

### Auth

#### `POST /api/auth/signup`

Request body:

| Field | Type | Rules |
|---|---|---|
| `name` | string | 2-50 chars |
| `email` | string | Valid email |
| `password` | string | Min 8 chars, at least 1 uppercase, at least 1 number |

Response `201`:

```json
{
  "message": "Account created successfully.",
  "user": {
    "id": "clxyz...",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-03-08T12:00:00.000Z"
  },
  "token": "<JWT>"
}
```

Possible errors: `400` validation error, `409` email already exists.

#### `POST /api/auth/login`

Request body:

| Field | Type | Rules |
|---|---|---|
| `email` | string | Valid email |
| `password` | string | Required |

Response `200`:

```json
{
  "message": "Logged in successfully.",
  "user": {
    "id": "clxyz...",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "<JWT>"
}
```

Possible errors: `400` validation error, `401` invalid credentials.

### Expenses

All expense endpoints require:

`Authorization: Bearer <token>`

#### `GET /api/expenses`

Optional query params:

| Param | Type | Notes |
|---|---|---|
| `filter` | string | `past_week` \| `past_month` \| `last_3_months` \| `custom` |
| `startDate` | date | Required when `filter=custom` |
| `endDate` | date | Required when `filter=custom` |

Response `200`:

```json
{
  "count": 1,
  "expenses": [
    {
      "id": "clxyz...",
      "title": "Lunch",
      "amount": 12.5,
      "category": "FOOD",
      "date": "2026-03-07T00:00:00.000Z",
      "description": "Burger and fries",
      "userId": "clxyz...",
      "createdAt": "2026-03-07T10:00:00.000Z",
      "updatedAt": "2026-03-07T10:00:00.000Z"
    }
  ]
}
```

#### `POST /api/expenses`

Request body:

| Field | Type | Rules |
|---|---|---|
| `title` | string | 1-100 chars |
| `amount` | number | Positive |
| `category` | string | One of enum values |
| `date` | date string | Valid date |
| `description` | string | Optional, max 500 chars |

Response `201`:

```json
{
  "message": "Expense created successfully.",
  "expense": { "...": "..." }
}
```

#### `GET /api/expenses/:id`

Response `200`:

```json
{
  "expense": { "...": "..." }
}
```

Possible error: `404` expense not found.

#### `PUT /api/expenses/:id`

Partial update allowed (all fields optional).

Response `200`:

```json
{
  "message": "Expense updated successfully.",
  "expense": { "...": "..." }
}
```

Possible errors: `400` validation error, `404` expense not found.

#### `DELETE /api/expenses/:id`

Response `200`:

```json
{
  "message": "Expense deleted successfully."
}
```

Possible error: `404` expense not found.

---

## Validation & Error Handling

Validation uses Zod schemas in `src/validators`.

Validation errors return `400`:

```json
{
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

Authentication middleware returns `401` for missing/invalid/expired tokens.

General errors follow:

```json
{
  "message": "Internal server error"
}
```

---

## Postman Collection

Import `expense-api.postman_collection.json` into Postman.

Use collection variables:

| Variable | Description |
|---|---|
| `baseUrl` | API base URL (default: `http://localhost:3000`) |
| `token` | JWT token |
| `expenseId` | Expense ID for update/delete requests |

Run signup/login first to set token for authenticated endpoints.

---

Project source: https://roadmap.sh/projects/expense-tracker-api
