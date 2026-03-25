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
