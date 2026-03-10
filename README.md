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
- [Request & Response Examples](#request--response-examples)
- [Error Handling](#error-handling)
- [Postman Collection](#postman-collection)

---

## Features

- User registration and login with hashed passwords (bcrypt, 12 salt rounds)
- JWT authentication with configurable expiry
- Full CRUD for expenses, scoped per authenticated user
- Expense filtering by date range: past week, past month, last 3 months, or custom range
- Input validation with Zod (structured error messages)
- Security hardening via Helmet HTTP headers
- Protection against user enumeration attacks (timing-safe login)
- Cascade deletion: removing an account deletes all associated expenses

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password Hashing | bcryptjs |
| Validation | Zod |
| Security Headers | Helmet |
| Dev Server | Nodemon |

---

## Project Structure

```
expense-api/
├── server.js                        # Entry point
├── prisma/
│   ├── schema.prisma                # Database schema
│   └── migrations/                  # Migration history
└── src/
    ├── app.js                       # Express app setup
    ├── config/
    │   └── prisma.js                # Prisma client instance
    ├── controllers/
    │   ├── auth.controller.js       # Signup & login logic
    │   └── expense.controller.js    # Expense CRUD logic
    ├── middlewares/
    │   ├── auth.middleware.js       # JWT verification
    │   └── errorHandler.middleware.js
    ├── routes/
    │   ├── index.js                 # Route aggregator
    │   ├── auth.routes.js
    │   └── expense.routes.js
    └── validators/
        ├── auth.validators.js
        └── expense.validators.js
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL instance (local or hosted)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd expense-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables below)

# Run database migrations
npm run db:migrate

# Start the development server
npm run dev
```

The server starts at `http://localhost:3000` by default.

---

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | Environment label (`development`, `production`) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs |
| `JWT_EXPIRES_IN` | No | JWT expiry duration (default: `7d`) |

Generate a secure `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Setup

```bash
# Apply migrations and generate Prisma client
npm run db:migrate

# Regenerate Prisma client (after schema changes without migration)
npm run db:generate

# Open Prisma Studio (GUI for browsing data)
npm run db:studio
```

### Schema Overview

**User**

| Field | Type | Notes |
|---|---|---|
| `id` | String (CUID) | Primary key |
| `name` | String | |
| `email` | String | Unique |
| `password` | String | bcrypt hash |
| `createdAt` | DateTime | Auto-set on create |
| `updatedAt` | DateTime | Auto-updated |

**Expense**

| Field | Type | Notes |
|---|---|---|
| `id` | String (CUID) | Primary key |
| `title` | String | |
| `amount` | Float | Must be positive |
| `category` | Category (enum) | See values below |
| `date` | DateTime | |
| `description` | String? | Optional |
| `userId` | String | FK → User (cascade delete) |
| `createdAt` | DateTime | Auto-set on create |
| `updatedAt` | DateTime | Auto-updated |

**Category enum:** `FOOD` `TRANSPORT` `ENTERTAINMENT` `HEALTH` `UTILITIES` `OTHER`

---

## API Reference

**Base URL:** `http://localhost:3000`

All protected routes require an `Authorization: Bearer <token>` header.

---

### Health Check

#### `GET /health`

Returns server status. No authentication required.

**Response `200`**
```json
{
  "status": "ok",
  "timestamp": "2026-03-08T12:00:00.000Z"
}
```

---

### Auth

#### `POST /api/auth/signup`

Register a new user account.

**Request Body**

| Field | Type | Rules |
|---|---|---|
| `name` | string | 2–50 characters |
| `email` | string | Valid email format |
| `password` | string | Min 8 chars, ≥1 uppercase letter, ≥1 digit |

**Response `201`**
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

**Errors:** `400` Validation error · `409` Email already registered

---

#### `POST /api/auth/login`

Authenticate with email and password.

**Request Body**

| Field | Type | Rules |
|---|---|---|
| `email` | string | Valid email format |
| `password` | string | Non-empty |

**Response `200`**
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

**Errors:** `400` Validation error · `401` Invalid email or password

---

### Expenses

All expense endpoints require authentication (`Authorization: Bearer <token>`).

---

#### `GET /api/expenses`

Retrieve all expenses for the authenticated user. Supports optional date filtering.

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `filter` | string | `past_week`, `past_month`, `last_3_months`, `custom` |
| `startDate` | date string | Required when `filter=custom` |
| `endDate` | date string | Required when `filter=custom` |

**Response `200`**
```json
{
  "count": 2,
  "expenses": [
    {
      "id": "clxyz...",
      "title": "Lunch",
      "amount": 12.50,
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

---

#### `POST /api/expenses`

Create a new expense.

**Request Body**

| Field | Type | Rules |
|---|---|---|
| `title` | string | 1–100 characters, required |
| `amount` | number | Positive number, required |
| `category` | string | Enum value, required |
| `date` | date string | Valid date, required |
| `description` | string | Max 500 characters, optional |

**Response `201`**
```json
{
  "message": "Expense created successfully.",
  "expense": { ...expense object }
}
```

---

#### `GET /api/expenses/:id`

Get a single expense by ID.

**Response `200`**
```json
{
  "expense": { ...expense object }
}
```

**Errors:** `404` Expense not found

---

#### `PUT /api/expenses/:id`

Update an existing expense. All fields are optional (partial update).

**Request Body** — same fields as `POST /api/expenses`, all optional.

**Response `200`**
```json
{
  "message": "Expense updated successfully.",
  "expense": { ...expense object }
}
```

**Errors:** `400` Validation error · `404` Expense not found

---

#### `DELETE /api/expenses/:id`

Delete an expense.

**Response `200`**
```json
{
  "message": "Expense deleted successfully."
}
```

**Errors:** `404` Expense not found

---

## Request & Response Examples

### Sign up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Secret123"}'
```

### Create an expense

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Groceries",
    "amount": 45.00,
    "category": "FOOD",
    "date": "2026-03-08",
    "description": "Weekly grocery run"
  }'
```

### Filter expenses by date range

```bash
# Built-in preset
curl "http://localhost:3000/api/expenses?filter=past_week" \
  -H "Authorization: Bearer <token>"

# Custom range
curl "http://localhost:3000/api/expenses?filter=custom&startDate=2026-02-01&endDate=2026-02-28" \
  -H "Authorization: Bearer <token>"
```

---

## Error Handling

All errors follow a consistent shape:

**Validation error (`400`)**
```json
{
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "Invalid email address" },
    { "field": "password", "message": "Password must contain at least one uppercase letter" }
  ]
}
```

**General error**
```json
{
  "message": "Expense not found."
}
```

**Authentication error (`401`)**
```json
{
  "message": "Token has expired. Please log in again."
}
```

---

## Postman Collection

A ready-to-use Postman collection is included at `expense-api.postman_collection.json`.

**Collection variables:**

| Variable | Description |
|---|---|
| `baseUrl` | API base URL (default: `http://localhost:3000`) |
| `token` | JWT — auto-saved after signup or login |
| `expenseId` | Expense ID — auto-saved after creating an expense |

Import the collection into Postman, then run **Signup** or **Login** first to automatically populate the `token` variable for all subsequent requests.

https://roadmap.sh/projects/expense-tracker-api