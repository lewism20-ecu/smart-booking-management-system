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

## Option 3 — Local API + Cloud SQL (team cloud testing)

Use this when you want to run the API locally but connect to the shared Cloud SQL database.

```bash
# 1. Install dependencies
npm install

# 2. Create cloud env file
cp .env.cloudsql.example .env.cloudsql
# Edit .env.cloudsql with your assigned DB_USER and DB_PASSWORD

# 3. Install Cloud SQL proxy (one-time)
make install-proxy

# 4. Terminal 1: start proxy
make proxy

# 5. Terminal 2: run migrations (optional one-time per schema change)
make cloud-migrate

# 6. Terminal 2: start API against Cloud SQL
make cloud-dev
```

Detailed setup and troubleshooting: see `docs/local-cloud-sql-setup.md`.

---

## Using Make

```bash
make up           # build and start everything
make down         # stop containers
make reset        # wipe database and restart fresh
make install-proxy # install Cloud SQL proxy binary
make proxy        # start Cloud SQL proxy on 127.0.0.1:5434
make cloud-migrate # run migrations against Cloud SQL
make cloud-setup  # alias of cloud-migrate
make cloud-dev    # run API locally against Cloud SQL
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

---

## API Usage Examples

### 1. Sign Up (Create an account)
**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!"
  }'
```
**Response (201 Created):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "role": "user"
  }
}
```

### 2. Log In
**Request:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "StrongPass123!"
  }'
```
**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "role": "user"
  }
}
```

### 3. Access Protected Route (e.g., Get Profile)
**Request:**
```bash
curl -X GET http://localhost:8080/api/v1/users/me \
  -H "Authorization: Bearer <YOUR_TOKEN_HERE>"
```

---

## Deployment

The application is container-ready and can be deployed to any Docker-compatible hosting platform (e.g., Google Cloud Run, AWS ECS, Azure Container Apps, or Heroku).

1. **Build the Docker Image:**
   ```bash
   docker build -t smart-booking-api .
   ```

2. **Push to your Container Registry:**
   ```bash
   docker tag smart-booking-api gcr.io/your-project/smart-booking-api
   docker push gcr.io/your-project/smart-booking-api
   ```

3. **Set Production Environment Variables:**
   Ensure the following environment variables are securely configured in your deployment environment:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (Pointing to your managed production database)
   - `NODE_ENV=production`
   - `JWT_SECRET` (Use a strong generated secret)
   - `JWT_EXPIRES_IN`

4. **Run Database Migrations:**
   Ensure your production database has the latest schema by securely running migrations before directing traffic to the API:
   ```bash
   node src/db/migrate.js
   ```
