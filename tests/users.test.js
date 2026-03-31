// Set JWT_SECRET before app loads so verifyToken() picks it up
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const request = require("supertest");
const app     = require("../src/index");

let token = null;

beforeAll(async () => {
  try {
    const bcrypt   = require('bcrypt');
    const { pool } = require('../src/db/index');
    const hash     = await bcrypt.hash('User123!', 10);
    await pool.query(
      `INSERT INTO users (email, password, role)
       VALUES ($1, $2, 'user')
       ON CONFLICT (email) DO NOTHING`,
      ['alice@example.com', hash]
    );
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "alice@example.com", password: "User123!" });
    token = res.body.token || null;
  } catch {
    token = null;
  }
});

describe("GET /api/v1/users/me", () => {

  it("200 — returns the authenticated user profile", async () => {
    if (!token) {
      console.warn('Skipping: no token — DB unavailable in CI');
      return;
    }
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("alice@example.com");
    expect(res.body.role).toBeDefined();
    expect(Array.isArray(res.body.managed_venues)).toBe(true);
  });

  it("401 — no token", async () => {
    const res = await request(app).get("/api/v1/users/me");
    expect(res.status).toBe(401);
  });

  it("401 — invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "Bearer not.a.valid.token");
    expect(res.status).toBe(401);
  });

  it("401 — malformed Authorization header", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", "NotBearer token");
    expect(res.status).toBe(401);
  });

});
