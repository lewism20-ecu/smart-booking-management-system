const request = require("supertest");
const app = require("../src/index");
const { pool } = require("../src/db/index");

let token;

beforeAll(async () => {
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: "alice@example.com", password: "User123!" });
  token = res.body.token;
});

afterAll(async () => {
  await pool.end();
});

// ─── GET /api/v1/users/me ─────────────────────────────────────────────────────

describe("GET /api/v1/users/me", () => {
  it("200 — returns the authenticated user", async () => {
    const res = await request(app)
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.userId).toBeDefined();
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
});
