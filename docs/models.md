# Model Layer Documentation

Models are the primary layer that communicates directly with the database.
Controllers call model functions instead of writing raw SQL directly.
All new and refactored controllers follow this pattern — raw SQL belongs
in models, not controllers.

## Architecture
```
Request → Route → Middleware → Controller → Model → Database
                                    ↑           ↓
                                Response ← Result
```

## Model Files

### userModel.js

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `createUser` | email, hashedPassword | User | Inserts new user record |
| `findUserByEmail` | email | User\|null | Used for login lookup |
| `findUserById` | userId | User\|null | Returns profile with managed_venues |
| `updateUserRole` | userId, role | User | Updates role, validates allowed values |
| `deleteUser` | userId | boolean | Hard delete |

### venueModel.js

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `createVenue` | name, approvalRequired, creatorUserId | Venue | Creates venue + assigns manager in one transaction |
| `getAllVenues` | — | Venue[] | All venues with manager IDs |
| `findVenueById` | venueId | Venue\|null | Single venue with manager IDs |
| `updateVenue` | venueId, updates | Venue | Partial update using COALESCE |
| `deleteVenue` | venueId | boolean | Hard delete |
| `isVenueManager` | userId, venueId | boolean | Authorization check |

### resourceModel.js

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `createResource` | data object | Resource | Validates type and capacity before insert |
| `getAllResources` | venueId? | Resource[] | All resources, optional venue filter |
| `findResourceById` | resourceId | Resource\|null | Single resource |
| `updateResource` | resourceId, updates | Resource | Partial update |
| `deleteResource` | resourceId | boolean | Hard delete |

### bookingModel.js

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `hasConflict` | resourceId, startTime, endTime, excludeId? | boolean | Double-booking check |
| `createBooking` | userId, resourceId, startTime, endTime, approvalRequired | Booking | Validates times, checks conflicts, inserts |
| `getBookingsByUser` | userId | Booking[] | All bookings for a user with resource/venue names |
| `findBookingById` | bookingId | Booking\|null | Single booking |
| `rescheduleBooking` | bookingId, startTime, endTime | Booking | Checks conflicts excluding self |
| `updateBookingStatus` | bookingId, status | Booking | Validates status before update |

## SQL Injection Prevention

All queries use parameterized statements with `$1, $2...` placeholders.
The `pg` driver passes parameters separately from the query string,
making injection impossible.
```javascript
// SAFE — parameter is never concatenated into the query string
pool.query('SELECT * FROM users WHERE email = $1', [email]);

// UNSAFE — never do this
pool.query(`SELECT * FROM users WHERE email = '${email}'`);
```

## Error Handling

Models throw errors with a `status` property for known failures.
Controllers check `err.status` to return the correct HTTP response.
Unknown errors are passed to the global error handler via `next(err)`.
```javascript
// In a model
const err = new Error('Resource not found.');
err.status = 404;
throw err;

// In a controller
} catch (err) {
  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }
  next(err); // unknown error → errorHandler middleware
}
```

## Transactions

Operations that touch multiple tables use `pool.connect()` with
explicit BEGIN/COMMIT/ROLLBACK to ensure atomicity. Example:
`createVenue` inserts into both `venues` and `venue_managers` —
if either fails, both are rolled back.
