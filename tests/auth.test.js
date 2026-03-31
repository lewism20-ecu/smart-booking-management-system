// Set JWT_SECRET before app loads so verifyToken() picks it up
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const request = require('supertest');
const app     = require('../src/index');

// ── Auth endpoint tests ────────────────────────────────────────────────────
describe('POST /api/v1/auth/signup', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ password: 'StrongPass123!' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('returns 400 when body is empty', async () => {
    const res = await request(app)
        .post('/api/v1/auth/login')
        .send({});
    expect(res.status).toBe(400);
  });
});

// ── Auth middleware tests ──────────────────────────────────────────────────
describe('Auth middleware', () => {
  it('GET /users/me returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /resources returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/resources');
    expect(res.status).toBe(401);
  });

  it('GET /bookings returns 401 with no token', async () => {
    const res = await request(app).get('/api/v1/bookings');
    expect(res.status).toBe(401);
  });
});

// ── Role-based authorization tests ────────────────────────────────────────
describe('Role-based authorization middleware', () => {
  // A real JWT signed with the test secret carrying role: 'user'
  // JWT_SECRET in .env must be 'test_secret' for these to work in CI
  // In CI the env var is set in ci.yml

  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'test_secret';

  const userToken = jwt.sign(
      { userId: 1, role: 'user' },
      secret,
      { expiresIn: '1h' }
  );

  const managerToken = jwt.sign(
      { userId: 2, role: 'manager' },
      secret,
      { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
      { userId: 3, role: 'admin' },
      secret,
      { expiresIn: '1h' }
  );

  // Admin-only route: POST /resources
  it('POST /resources with user token → 403 Forbidden', async () => {
    const res = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          venueId: 1,
          name: 'Room A',
          capacity: 10,
          resourceType: 'room'
        });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('POST /resources with manager token → 403 Forbidden', async () => {
    const res = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          venueId: 1,
          name: 'Room A',
          capacity: 10,
          resourceType: 'room'
        });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  // Manager-only routes: approve/reject bookings
  it('POST /bookings/:id/approve with user token → 403 Forbidden', async () => {
    const res = await request(app)
        .post('/api/v1/bookings/1/approve')
        .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('POST /bookings/:id/reject with user token → 403 Forbidden', async () => {
    const res = await request(app)
        .post('/api/v1/bookings/1/reject')
        .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  // Manager CAN approve/reject
  it('POST /bookings/:id/approve with manager token → not 403', async () => {
    const res = await request(app)
        .post('/api/v1/bookings/1/approve')
        .set('Authorization', `Bearer ${managerToken}`);
    expect(res.status).not.toBe(403);
  });

  // User-only validation: authenticated users can reach user routes
  it('GET /users/me with valid user token → auth passes, returns 404 or 500 (no DB in test)', async () => {
    const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect([404, 500]).toContain(res.status);
  });

});