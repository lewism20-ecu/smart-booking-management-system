# Booking Approval & Rejection

## Overview

Bookings that require approval go through this lifecycle:
```
User creates booking → status: pending
                              ↓
              Manager approves or rejects
              ↓                       ↓
     status: approved          status: rejected
```

## Endpoints

### Approve a Booking
```
POST /api/v1/bookings/:id/approve
Authorization: Bearer <manager-token>
```

**200 OK:**
```json
{
  "booking_id": 88,
  "user_id": 1,
  "resource_id": 10,
  "start_time": "2026-04-01T10:00:00.000Z",
  "end_time": "2026-04-01T12:00:00.000Z",
  "status": "approved",
  "created_at": "2026-03-28T09:00:00.000Z"
}
```

**403 Forbidden** (non-manager token):
```json
{
  "error": "Forbidden",
  "message": "Access restricted to: manager, admin."
}
```

**403 Forbidden** (manager of wrong venue):
```json
{
  "error": "Forbidden",
  "message": "You are not a manager of the venue for this booking."
}
```

**404 Not Found:**
```json
{
  "error": "NotFound",
  "message": "Booking not found."
}
```

**409 Conflict** (booking not pending):
```json
{
  "error": "Conflict",
  "message": "Booking cannot be approved — current status is 'approved'."
}
```

### Reject a Booking
```
POST /api/v1/bookings/:id/reject
Authorization: Bearer <manager-token>
```

**200 OK:**
```json
{
  "booking_id": 88,
  "status": "rejected"
}
```

**403 Forbidden** (non-manager):
```json
{
  "error": "Forbidden",
  "message": "Access restricted to: manager, admin."
}
```

**409 Conflict** (already rejected):
```json
{
  "error": "Conflict",
  "message": "Booking cannot be rejected — current status is 'rejected'."
}
```

## curl Examples

### Approve
```bash
curl -X POST https://<url>/api/v1/bookings/88/approve \
  -H "Authorization: Bearer <manager-token>"
```

### Reject
```bash
curl -X POST https://<url>/api/v1/bookings/88/reject \
  -H "Authorization: Bearer <manager-token>"
```

## Validation Logic

Both endpoints follow this exact sequence:
```
1. Find booking by ID          → 404 if not found
2. Check status === 'pending'  → 409 if already approved/rejected/cancelled
3. Check manager owns venue    → 403 if wrong venue (skipped for admin)
4. Update status in DB         → 200 with updated booking
```

## Who Can Approve/Reject

| Role    | Can approve/reject? | Restriction |
|---------|---------------------|-------------|
| user    | No                  | 403 always  |
| manager | Yes                 | Only for venues they manage |
| admin   | Yes                 | Any booking |
