# Role Matrix

This document defines which roles can access which endpoints in the SBMS API.

## Roles

| Role    | Description                                      |
|---------|--------------------------------------------------|
| user    | Default role. Can register, log in, and book.   |
| manager | Assigned when a user creates a venue. Can approve/reject bookings for their venues. |
| admin   | Full system access. Can create and manage resources. |

## Endpoint Access Matrix

| Method | Endpoint                    | user | manager | admin | Notes                        |
|--------|-----------------------------|------|---------|-------|------------------------------|
| POST   | /auth/signup                | ✅   | ✅      | ✅    | No auth required             |
| POST   | /auth/login                 | ✅   | ✅      | ✅    | No auth required             |
| GET    | /users/me                   | ✅   | ✅      | ✅    | Own profile only             |
| GET    | /resources                  | ✅   | ✅      | ✅    | All authenticated users      |
| POST   | /resources                  | ❌   | ❌      | ✅    | Admin only                   |
| GET    | /bookings                   | ✅   | ✅      | ✅    | Own bookings only            |
| POST   | /bookings                   | ✅   | ✅      | ✅    | Create a booking             |
| PATCH  | /bookings/:id               | ✅   | ✅      | ✅    | Own bookings only            |
| DELETE | /bookings/:id               | ✅   | ✅      | ✅    | Own bookings only            |
| POST   | /bookings/:id/approve       | ❌   | ✅      | ✅    | Manager/Admin only           |
| POST   | /bookings/:id/reject        | ❌   | ✅      | ✅    | Manager/Admin only           |

## Error Responses

### 401 Unauthorized
Returned when no token is provided or the token is invalid/expired.
```json
{
  "error": "Unauthorized",
  "message": "Missing token"
}
```

### 403 Forbidden
Returned when a valid token is provided but the user's role
does not have permission for the requested action.
```json
{
  "error": "Forbidden",
  "message": "Access restricted to: admin."
}
```

## How Role Checking Works

Every protected route uses two middleware functions in sequence:
```
Request → auth middleware → roleAuth middleware → controller
```

1. `auth.js` — verifies the JWT is valid and attaches `req.user`
   containing `userId` and `role`
2. `roleAuth.js` — checks `req.user.role` against the allowed
   roles for that route. If the role is not in the allowed list,
   returns 403 immediately without reaching the controller.

## Example: Admin-Only Route
```javascript
router.post('/', auth, requireRole('admin'), createResource);
//               ↑          ↑                    ↑
//          verifies JWT  checks role      runs only if both pass
```

## Example: Manager or Admin Route
```javascript
router.post('/:id/approve', auth, requireRole('manager', 'admin'), approveBooking);
```