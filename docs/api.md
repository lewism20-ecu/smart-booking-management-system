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

### **GET /bookings**

Returns all bookings belonging to the authenticated user.
This endpoint requires a valid JWT and will only return bookings for the user associated with the token.

**Authentication**
Required: Yes
Type: Bearer Token (JWT)
Header format:
Authorization: Bearer <your_jwt_token>

**Response Schema**

```
{
  "bookings": [
    {
      "booking_id": number,
      "resource_id": number,
      "resource_name": string,
      "venue_id": number,
      "start_time": string,
      "end_time": string,
      "status": "pending" | "approved" | "rejected",
      "created_at": string
    }
  ]
}
```

**Field Descriptions**

| Field | Type | Description |
|-------|-------|-------------|
| `booking_id` | number | Unique ID of the booking |
| `resource_id` | number | ID of the resource that was booked |
| `resource_name` | string | Human‑readable name of the resource (joined from `resources`) |
| `venue_id` | number | ID of the venue the resource belongs to |
| `start_time` | string (ISO timestamp) | When the booking begins |
| `end_time` | string (ISO timestamp) | When the booking ends |
| `status` | string | Current booking status (`pending`, `approved`, `rejected`) |
| `created_at` | string (ISO timestamp) | Timestamp when the booking was created |


**Example Request**
GET /api/v1/bookings
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

**Example Successful Response (200)**
Example for Alice, who has 3 seeded bookings:

```
{
  "bookings": [
    {
      "booking_id": 1,
      "resource_id": 3,
      "resource_name": "Desk A1",
      "venue_id": 1,
      "start_time": "2026-03-31T14:00:00.000Z",
      "end_time": "2026-03-31T15:00:00.000Z",
      "status": "approved",
      "created_at": "2026-03-29T10:22:00.000Z"
    },
    {
      "booking_id": 3,
      "resource_id": 5,
      "resource_name": "Conference Room",
      "venue_id": 2,
      "start_time": "2026-04-02T14:00:00.000Z",
      "end_time": "2026-04-02T17:00:00.000Z",
      "status": "approved",
      "created_at": "2026-03-29T10:22:00.000Z"
    },
    {
      "booking_id": 5,
      "resource_id": 3,
      "resource_name": "Desk A1",
      "venue_id": 1,
      "start_time": "2026-03-23T14:00:00.000Z",
      "end_time": "2026-03-23T15:00:00.000Z",
      "status": "approved",
      "created_at": "2026-03-29T10:22:00.000Z"
    }
  ]
}
```

(Your timestamps will differ based on NOW() in the seed script.)

**Unauthorized Response (401 — No Token)**

```
{
  "error": "Missing token"
}
```

**Unauthorized Response (401 — Invalid Token)**

```
{
  "error": "Invalid token"
}
```

### **POST /bookings**

Creates a new booking for the authenticated user.  
This endpoint validates the time window, checks resource availability, prevents overlapping bookings, and applies approval rules based on the resource.

---
**Authentication**
**Required:** Yes  
**Type:** Bearer Token (JWT)

---

**Validation Rules**

**Required fields**
- `resourceId` (number)
- `startTime` (ISO timestamp)
- `endTime` (ISO timestamp)

**Business rules**
| Rule | Description |
|------|-------------|
| **startTime < endTime** | If not, return **400 Bad Request** |
| **Resource must exist** | If not found, return **404 Not Found** |
| **No overlapping bookings** | If overlap detected, return **409 Conflict** |
| **Approval logic** | If resource.approval_required = true → status = `"pending"`; otherwise `"approved"` |

---

**Request Body Schema**

```json
{
  "resourceId": number,
  "startTime": "ISO-8601 timestamp",
  "endTime": "ISO-8601 timestamp"
}
```

---

**Example Request**

```
POST /api/v1/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "resourceId": 3,
  "startTime": "2030-01-01T10:00:00.000Z",
  "endTime": "2030-01-01T11:00:00.000Z"
}
```

---

**201 Created — Successful Booking**

```json
{
  "booking_id": 12,
  "status": "approved"
}
```

*(If the resource requires approval, status will be `"pending"` instead.)*

---

**400 Bad Request — Invalid Time Window**

```json
{
  "error": "startTime must be before endTime"
}
```

---

**404 Not Found — Resource Does Not Exist**

```json
{
  "error": "Resource not found"
}
```

---

**409 Conflict — Overlapping Booking**

```json
{
  "error": "Resource already booked for this time window"
}
```

### **DELETE /bookings/:id**

Cancels a booking for the authenticated user.

**Authentication**
Required: Yes
Type: Bearer Token (JWT)
Header format:
Authorization: Bearer <your_jwt_token>

**URL Parameters**

- `id` (number): booking ID to cancel

**Example Request**

DELETE /api/v1/bookings/12
Authorization: Bearer <your_jwt_token>

**Success Response (Owner Cancels) — 204 No Content**

(No response body)

**Error Response (Non-owner) — 403 Forbidden**

```json
{
  "error": "Not authorized to delete this booking"
}
```


