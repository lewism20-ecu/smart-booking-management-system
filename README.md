# Smart Booking Management System

A REST API for managing venue bookings, built with Node.js, Express, and PostgreSQL.

---

## Prerequisites

| Method | Requirements                            |
| ------ | --------------------------------------- |
| Local  | Node.js 18+, PostgreSQL running locally |
| Docker | Docker Desktop                          |

---

## Option 1 — Local Development

```bash
# 1. Install dependencies
npm install

# 2. Create your local env file
cp .env.example .env.local
# Edit .env.local with your local Postgres credentials

# 3. Run migrations and seed test data
npm run setup-db

# 4. Start the server
npm run start
```

API is available at `http://localhost:8080`

---

## Option 2 — Docker Compose

```bash
# First run (builds image, runs migrations, starts everything)
docker compose up --build

# Subsequent runs (no code changes)
docker compose up

# After code changes
docker compose up --build

# Stop
docker compose down

# Wipe database and start fresh
docker compose down -v && docker compose up --build
```

API is available at `http://localhost:8080`

No Node or Postgres installation required — Docker Desktop is the only dependency.

---

## Using Make

```bash
make up           # build and start everything
make down         # stop containers
make reset        # wipe database and restart fresh
```

---

## Test Credentials

| Email               | Password    | Role    |
| ------------------- | ----------- | ------- |
| admin@example.com   | Admin123!   | admin   |
| manager@example.com | Manager123! | manager |
| alice@example.com   | User123!    | user    |
| bob@example.com     | User123!    | user    |

---

## API Endpoints

| Method | Path                  | Auth | Description         |
| ------ | --------------------- | ---- | ------------------- |
| POST   | `/api/v1/auth/signup` | No   | Create account      |
| POST   | `/api/v1/auth/login`  | No   | Log in, receive JWT |
| GET    | `/api/v1/users/me`    | Yes  | Get your profile    |
| GET    | `/api/v1/bookings`    | Yes  | List your bookings  |
| POST   | `/api/v1/bookings`    | Yes  | Create a booking    |

Protected routes require: `Authorization: Bearer <token>`
