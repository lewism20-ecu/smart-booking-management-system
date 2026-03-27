# **Authentication API Documentation**

## Overview

This document describes the authentication endpoints for the Smart Booking Management System backend. It includes:

* Endpoint descriptions
* Request/response examples
* Validation rules
* Status codes
* Error formats

All endpoints use JSON and return JSON.

## **Authentication Endpoints**

### **POST /auth/signup**

Creates a new user account.

**Request Body**

{
  "email": "test@example.com",
  "password": "StrongPass123!"
}

**Validation Rules**

* **Email**

  * Required
  * Must be unique
  * Must be a valid email format
* **Password**
* Required
* Minimum 8 characters
* Must include:
* Uppercase letter
* Lowercase letter
* Number
* Symbol

**Successful Response — 201 Created**

{
  "message": "User created successfully",
  "token": "jwt-token-here",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "role": "user"
  }
}

**Error Responses**

**400 Bad Request — Weak Password**

{
  "error": "Weak password",
  "message": "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
}

**400 Bad Request — Missing Fields**

{
  "error": "Bad Request",
  "message": "Email and password are required."
}

**409 Conflict — Duplicate Email**

{
  "error": "Conflict",
  "message": "Email already exists."
}

### **POST /auth/login**

Authenticates a user and returns a JWT.

**Request Body**

{
  "email": "test@example.com",
  "password": "StrongPass123!"
}

**Successful Response — 200 OK**

{
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "userId": 1,
    "email": "test@example.com",
    "role": "user"
  }
}

**Error Responses**

**400 Bad Request — Missing Fields**

{
  "error": "Bad Request",
  "message": "Email and password are required."
}

**401 Unauthorized — Invalid Credentials**

{
  "error": "Unauthorized",
  "message": "Invalid credentials."
}

### **GET /users/me**

Returns the authenticated user's profile, including their role and any venues they manage.

---

**Authentication**

**Required:** Yes
**Type:** Bearer Token (JWT)

Header format:

```
Authorization: Bearer <your_jwt_token>
```

**Response Schema**

```
{
  "userId": number,
  "email": string,
  "role": "user" | "manager" | "admin",
  "managedVenues": string[]
}
```

**Field Descriptions**

| Field             | Type     | Description                          |
| ----------------- | -------- | ------------------------------------ |
| `userId`        | number   | The authenticated user’s ID         |
| `email`         | string   | User’s email address                |
| `role`          | string   | User’s role in the system           |
| `managedVenues` | string[] | List of venue names the user manages |

---

**Example Request**

```
GET /api/v1/users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

**Example Successful Response (200)**

```
{
  "userId": 3,
  "email": "manager@example.com",
  "role": "manager",
  "managedVenues": [
    "Student Center",
    "Science Building"
  ]
}
```

---

**Unauthorized Response (401 — No Token)**

```
{
  "error": "Missing token"
}
```

---

**Unauthorized Response (401 — Invalid Token)**

```
{
  "error": "Invalid token"
}
```
