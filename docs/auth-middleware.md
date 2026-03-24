## Authentication Overview

The Smart Booking Management System uses **JWT-based authentication** to protect API routes.

All clients must include a valid JSON Web Token in the `Authorization` header when accessing protected endpoints.

### How authentication works

* A JWT is issued when a user logs in (temporarily via `/dev/token` during development).
* The token includes:
  * `userId`
  * `role`
  * `iat` (issued at)
  * `exp` (expiration)
* Protected routes use the `auth` middleware to:
  * Validate the token
  * Decode the payload
  * Attach the user object to `req.user`

If the token is missing, invalid, or expired, the server returns  **401 Unauthorized** .

---

## 🔑 Authorization Header Format

All protected routes require the following header:

```
Authorization: Bearer <jwt-token>
```

Rules:

* Must start with the word **Bearer** (capital B)
* Must contain **one space** between `Bearer` and the token
* Must not include quotes or trailing spaces

Example:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🧪 Example JWT (Development Only)

During development, a test token can be generated using:

```
GET /dev/token
```

Example payload:

```json
{
  "userId": 1,
  "role": "user",
  "iat": 1774316510,
  "exp": 1774320110
}
```

This token can be used to test protected routes such as:

```
GET /test/protected
```

---

## 🔒 Protected Route Example

**Request:**

```
GET /test/protected
Authorization: Bearer <jwt-token>
```

**Response:**

```json
{
  "message": "You accessed a protected route!",
  "user": {
    "userId": 1,
    "role": "user"
  }
}
```

---
