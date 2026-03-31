// Set JWT_SECRET before app loads so verifyToken() picks it up
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

const request = require("supertest");
const app     = require("../src/index");
const jwt     = require("jsonwebtoken");

const secret = process.env.JWT_SECRET;

const userToken = jwt.sign(
  { userId: 1, role: 'user' },
  secret,
  { expiresIn: '1h' }
);

// ── GET /api/v1/users/me ──────────────────────────────────────────────────
describe("GET /api/v1/users/me", () => {

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

  it("token accepted by auth middleware — returns 404 or 500 (no DB in test env)", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${userToken}`);
    // Auth middleware passed — DB unavailable in test env
    // must never be 401 (bad token) or 403 (wrong role)
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
    expect([404, 500]).toContain(res.status);
  });

});
